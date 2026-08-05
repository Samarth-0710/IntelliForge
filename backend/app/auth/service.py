from sqlalchemy.orm import Session

from app.models.user import User
from app.auth.schemas import UserCreate
from app.auth.security import hash_password

from app.auth.security import (
    hash_password,
    verify_password
)

def create_user(db: Session, user: UserCreate):

    existing_user = (
        db.query(User)
        .filter(
            (User.email == user.email) |
            (User.username == user.username)
        )
        .first()
    )

    if existing_user:
        return None

    new_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hash_password(user.password),
        role="admin"
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

def authenticate_user(db: Session, email: str, password: str):

    user = db.query(User).filter(
        User.email == email
    ).first()

    if not user:
        return None

    if not verify_password(
        password,
        user.hashed_password
    ):
        return None

    return user