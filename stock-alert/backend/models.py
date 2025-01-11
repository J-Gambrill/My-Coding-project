from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Float,
    UniqueConstraint,
    ForeignKey,
    DateTime
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime, timezone

Base = declarative_base()
engine = create_engine('sqlite:///alerts.db', echo=True)
Session = sessionmaker(bind=engine)
session = Session()

def get_session():
    return session()

class User(Base):
    __tablename__ = 'user'
    id = Column(Integer, primary_key=True)
    username = Column(String(80), unique=True, nullable=False)
    password = Column(String(200), nullable=False)
    email = Column(String(120), unique=True, nullable=False)
    # Relationship to alerts
    alerts = relationship('Alert', back_populates='user')

class Alert(Base):
    __tablename__ = 'alerts'
    id = Column(Integer, primary_key=True)
    symbol = Column(String, nullable=False)
    price_type = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    email = Column(String, nullable=False)
    user_id = Column(Integer, ForeignKey('user.id'), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship('User', back_populates='alerts')

    __table_args__ = (
        UniqueConstraint('symbol', 'price_type','price' , 'email', name='uix_symbol_price_type_email'),
    )

class History(Base):
    __tablename__ = 'History'
    id = Column(Integer, primary_key=True)
    symbol = Column(String, nullable=False)
    price_type = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    email = Column(String, nullable=False)
    user_id = Column(Integer, ForeignKey('user.id'), nullable=False)
    removed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
   

Base.metadata.create_all(engine)
