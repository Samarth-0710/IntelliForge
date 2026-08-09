from sqlalchemy.orm import Session

from app.models.user import User
from app.auth.schemas import UserCreate
from app.auth.security import hash_password, verify_password


def create_user(db: Session, user: UserCreate):
    existing_user = (
        db.query(User)
        .filter(
            (User.email == user.email.strip()) |
            (User.username == user.username.strip())
        )
        .first()
    )

    if existing_user:
        return None

    new_user = User(
        username=user.username.strip(),
        email=user.email.strip(),
        hashed_password=hash_password(user.password),
        role="admin"
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


def authenticate_user(db: Session, email_or_username: str, password: str):
    if not email_or_username or not password:
        return None

    identifier = email_or_username.strip()
    user = (
        db.query(User)
        .filter(
            (User.email == identifier) |
            (User.username == identifier)
        )
        .first()
    )

    if not user:
        return None

    if not verify_password(password, user.hashed_password):
        return None

    return user