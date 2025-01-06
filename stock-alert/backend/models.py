from sqlalchemy import create_engine, Column, Integer, String, Float, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

Base = declarative_base()
engine = create_engine('sqlite:///alerts.db', echo=True)
Session = sessionmaker(bind=engine)
session = Session()

def get_session():
    return session()

class Alert(Base):
    __tablename__ = 'alerts'
    id = Column(Integer, primary_key=True)
    symbol = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    price_type = Column(String, nullable=False)
    email = Column(String, nullable=False)


    __table_args__ = (
        UniqueConstraint('symbol', 'price_type','price' , 'email', name='uix_symbol_price_type_email'),
    )

Base.metadata.create_all(engine)
