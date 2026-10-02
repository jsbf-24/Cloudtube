from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str

class CommentCreate(BaseModel):
    content: str
    user_id: int

class CommentResponse(BaseModel):
    id: int
    content: str
    user_id: int
    created_at: datetime

class VideoResponse(BaseModel):
    id: int
    title: str
    description: str
    video_url: str
    thumbnail_url: str
    views: int
    created_at: datetime
    user_id: int