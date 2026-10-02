from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime, timezone

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    email: str = Field(unique=True, index=True)
    password_hash: str

    videos: List["Video"] = Relationship(back_populates="user")
    comments: List["Comment"] = Relationship(back_populates="user")

class Video(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: str
    video_url: str
    thumbnail_url: str
    views: int = Field(default=0)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    user_id: int = Field(foreign_key="user.id")
    user: Optional[User] = Relationship(back_populates="videos")
    comments: List["Comment"] = Relationship(back_populates="video")

class Comment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    user_id: int = Field(foreign_key="user.id")
    video_id: int = Field(foreign_key="video.id")
    
    user: Optional[User] = Relationship(back_populates="comments")
    video: Optional[Video] = Relationship(back_populates="comments")