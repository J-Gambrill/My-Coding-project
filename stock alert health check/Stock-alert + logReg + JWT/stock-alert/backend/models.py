# In models.py
from flask_sqlalchemy import SQLAlchemy
import datetime

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'  # Optional: Specify table name
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    email = db.Column(db.String(254), nullable=False)

class Alert(db.Model):
    __tablename__ = 'alerts'
    id = db.Column(db.Integer, primary_key=True)
    symbol = db.Column(db.String, nullable=False)
    price = db.Column(db.Float, nullable=False)
    price_type = db.Column(db.String, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    user = db.relationship('User', backref=db.backref('alerts', lazy=True)) 
    # creates a relationship between the Alert table and User table, adds a reverse relationship which means you can access all alerts for a specific user e.g. user.alerts
    #lazy=True means that related alerts are loaded when accessed and not immediatley when the object is queried.
                                                                            
    __table_args__ = (
        db.UniqueConstraint('symbol', 'price_type', 'price', 'user_id', name='uix_symbol_price_type_email'),
    )

class AlertHistory(db.Model):
    __tablename__ = 'alert_history'
    id = db.Column(db.Integer, primary_key=True)
    symbol = db.Column(db.String, nullable=False)
    price = db.Column(db.Float, nullable=False)
    price_type = db.Column(db.String, nullable=False)  # 'high' or 'low'
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    activated_at = db.Column(db.DateTime, nullable=False, default=datetime.datetime.utcnow)

    user = db.relationship('User', backref=db.backref('alert_history', lazy=True))
    
