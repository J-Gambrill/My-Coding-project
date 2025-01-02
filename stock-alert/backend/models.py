from sqlalchemy import create_engine, Column, Integer, String, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

Base = declarative_base()
engine = create_engine('sqlite:///alerts.db', echo=True)
Session = sessionmaker(bind=engine)
session = Session()

def get_session():
    return session

class Alert(Base):
    __tablename__ = 'alerts'
    id = Column(Integer, primary_key=True)
    symbol = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    email = Column(String)

Base.metadata.create_all(engine)
