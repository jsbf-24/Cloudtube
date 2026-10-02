import os
import re
import mimetypes
import boto3
from typing import List
from datetime import datetime, timezone
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from sqlalchemy.orm import joinedload
from database import init_db, get_session
from models import User, Video, Comment
from schemas import (
    UserCreate,
    UserLogin,
    UserResponse,
    VideoResponse,
    CommentCreate,
    CommentResponse,
)

app = FastAPI(title="Video Platform API")

# Configuración de CORS para el frontend en S3 / CloudFront
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Variables de entorno exactas de la EC2
S3_VIDEOS_BUCKET = os.getenv("S3_BUCKET_RAW", "videodb-raw-uploads")
S3_THUMBNAILS_BUCKET = os.getenv("S3_BUCKET_PROCESSED", "videodb-processed-hls")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")

s3_client = boto3.client("s3", region_name=AWS_REGION)

@app.on_event("startup")
def on_startup():
    init_db()

def upload_to_s3(file: UploadFile, bucket: str, prefix: str) -> str:
    # 1. Sanitizar el nombre del archivo (remueve espacios y caracteres especiales)
    clean_filename = re.sub(r'[^a-zA-Z0-9_.-]', '_', file.filename)
    filename = f"{prefix}/{clean_filename}"
    
    # 2. Asignar Content-Type adecuado para reproducción pública HTML5
    content_type = file.content_type
    if not content_type or content_type == "application/octet-stream":
        content_type, _ = mimetypes.guess_type(clean_filename)
        content_type = content_type or "video/mp4"

    s3_client.upload_fileobj(
        file.file,
        bucket,
        filename,
        ExtraArgs={"ContentType": content_type}
    )
    return f"https://{bucket}.s3.{AWS_REGION}.amazonaws.com/{filename}"

# --- USUARIOS ---
@app.post("/users", response_model=UserResponse)
def register(user: UserCreate, session: Session = Depends(get_session)):
    db_user = User(name=user.name, email=user.email, password_hash=user.password)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user

@app.post("/login")
def login(credentials: UserLogin, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == credentials.email)).first()
    if not user or user.password_hash != credentials.password:
        raise HTTPException(status_code=400, detail="Credenciales incorrectas")
    return {"user_id": user.id, "name": user.name, "email": user.email}

@app.get("/users/{id}", response_model=UserResponse)
def get_user(id: int, session: Session = Depends(get_session)):
    user = session.get(User, id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user

# --- VIDEOS ---
@app.post("/videos", response_model=VideoResponse)
def create_video(
    title: str = Form(...),
    description: str = Form(...),
    user_id: int = Form(...),
    video_file: UploadFile = File(...),
    thumbnail_file: UploadFile = File(...),
    session: Session = Depends(get_session)
):
    video_url = upload_to_s3(video_file, S3_VIDEOS_BUCKET, "videos")
    thumbnail_url = upload_to_s3(thumbnail_file, S3_THUMBNAILS_BUCKET, "thumbnails")

    new_video = Video(
        title=title,
        description=description,
        video_url=video_url,
        thumbnail_url=thumbnail_url,
        user_id=user_id,
        created_at=datetime.now(timezone.utc)
    )
    session.add(new_video)
    session.commit()
    session.refresh(new_video)

    # Carga la relación del usuario para responder con la información del canal
    statement = select(Video).where(Video.id == new_video.id).options(joinedload(Video.user))
    return session.exec(statement).first()

@app.get("/videos", response_model=List[VideoResponse])
def get_videos(session: Session = Depends(get_session)):
    statement = select(Video).options(joinedload(Video.user))
    return session.exec(statement).all()

@app.get("/videos/{id}", response_model=VideoResponse)
def get_video(id: int, session: Session = Depends(get_session)):
    statement = select(Video).where(Video.id == id).options(joinedload(Video.user))
    video = session.exec(statement).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video no encontrado")
    
    video.views += 1
    session.add(video)
    session.commit()
    session.refresh(video)
    
    # Re-consulta para mantener la relación del usuario cargada tras el refresh
    return session.exec(statement).first()

@app.put("/videos/{id}", response_model=VideoResponse)
def update_video(id: int, title: str = Form(...), description: str = Form(...), session: Session = Depends(get_session)):
    statement = select(Video).where(Video.id == id).options(joinedload(Video.user))
    video = session.exec(statement).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video no encontrado")
    video.title = title
    video.description = description
    session.add(video)
    session.commit()
    session.refresh(video)
    return session.exec(statement).first()

@app.delete("/videos/{id}")
def delete_video(id: int, session: Session = Depends(get_session)):
    video = session.get(Video, id)
    if not video:
        raise HTTPException(status_code=404, detail="Video no encontrado")
    
    # 1. Eliminar primero los comentarios asociados al video
    comments = session.exec(select(Comment).where(Comment.video_id == id)).all()
    for comment in comments:
        session.delete(comment)
    
    # 2. Eliminar el registro del video
    session.delete(video)
    session.commit()
    
    return {"message": "Video y comentarios asociados eliminados correctamente"}

# --- COMENTARIOS ---
@app.post("/videos/{id}/comments", response_model=CommentResponse)
def add_comment(id: int, comment: CommentCreate, session: Session = Depends(get_session)):
    new_comment = Comment(
        content=comment.content,
        user_id=comment.user_id,
        video_id=id,
        created_at=datetime.now(timezone.utc)
    )
    session.add(new_comment)
    session.commit()
    session.refresh(new_comment)

    # Carga la relación del usuario autor del comentario
    statement = select(Comment).where(Comment.id == new_comment.id).options(joinedload(Comment.user))
    return session.exec(statement).first()

@app.get("/videos/{id}/comments", response_model=List[CommentResponse])
def get_comments(id: int, session: Session = Depends(get_session)):
    statement = (
        select(Comment)
        .where(Comment.video_id == id)
        .options(joinedload(Comment.user))
    )
    return session.exec(statement).all()