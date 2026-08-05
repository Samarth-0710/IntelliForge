from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


# Import models here
from app.models.user import User
from app.models.incident import Incident
from app.models.log import Log
from app.models.notification import Notification