#this represents a basic flask server
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from stock_utils import get_stock_price
from models import Alert, User, History
from email_utils import send_email
from apscheduler.schedulers.background import BackgroundScheduler
import traceback
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from datetime import datetime, timezone


app = Flask(__name__)
CORS(app, supports_credentials=True) # Enables (Cross-Origin Resource Sharing) which supoosedly just means frontend-backend communication

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(BASE_DIR, "alerts.db")

app.config['JWT_SECRET_KEY'] = 'your-secret-key'
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{db_path}"

db = SQLAlchemy(app)
jwt = JWTManager(app)

# Auth Routes

@app.route('/Register', methods=['POST'])
def Register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400

    # Check if the user already exists
    existing_user = db.session.query(User).filter_by(username=username).first()
    if existing_user:
        return jsonify({'error': 'Username already exists'}), 409

    # Hash the password & create a new user
    hashed_password = generate_password_hash(password)
    new_user = User(username=username, password=hashed_password)
    db.session.add(new_user)
    db.session.commit()  # <-- be sure to call commit()

    return jsonify({'message': 'User registered successfully'}), 201


@app.route('/Login', methods=['POST'])
def Login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400

    user = db.session.query(User).filter_by(username=username).first()

    if not user or not check_password_hash(user.password, password):
        return jsonify({'error': 'Invalid username or password'}), 401

    access_token = create_access_token(identity=user.id)
    return jsonify({'access_token': access_token}), 200

# Alert & Stock Routes

@app.route('/')
def home():
    return "Welcome to the Stock Alert API! Use the /set_alert endpoint to submit data."

# this is an endpoint to recieve stock data -->
@app.route('/set_alert', methods=['POST'])
@jwt_required()
def set_alert():
    try:

        current_user_id = get_jwt_identity()
        data = request.json
        print("Request data:", data)
        
        symbol = data.get('symbol')
        high_price = data.get('high_price')
        low_price = data.get('low_price')
        email = data.get('email')

        if not symbol:
            return jsonify({'message': 'Invalid data: Stock symbol required'}), 400
        if not high_price and not low_price:
            return jsonify({'message': 'Invalid data: Please provide at least one target price.'}), 400
        
        try:
            high_price = float(high_price) if high_price else None
            low_price = float(low_price) if low_price else None
        except ValueError:
            return jsonify({'message': 'Prices must be numeric'}), 400

       # creates alerts in DB

        if high_price is not None:
            high_alert = Alert(
                symbol=symbol,
                price=float(high_price),
                email=email,
                price_type='high',
                user_id=current_user_id
            )
            db.session.add(high_alert)

        if low_price is not None:
            low_alert = Alert(
                symbol=symbol,
                price=float(low_price),
                email=email,
                price_type='low',
                user_id=current_user_id
            )
            db.session.add(low_alert)

        db.session.commit()
        print(f"Received alert: Symbol={symbol}, High Price={high_price}, "f"Low Price={low_price}, Email={email}")

        return jsonify({'message': 'Alert set successfully!'}), 200
        
    except Exception as e:
        print("Error processing request:", traceback.format_exc())
        return jsonify({'message': 'An internal error occurred.'}), 500
    
    
@app.route('/get_price/<symbol>', methods=['GET'])
@jwt_required()
def get_price(symbol):
    try:
        stock_price = get_stock_price(symbol)
        if stock_price:
            return jsonify({'symbol': symbol, 'price': stock_price}), 200
        return jsonify({'message': 'Stock price not found'}), 404
    except Exception as e:
        print("Error fetching stock price:", traceback.format_exc())
        return jsonify({'message': 'An error occurred while fetching the price.'}), 500
    
# get all alerts for the logged in user

@app.route('/alerts', methods=['GET'])
@jwt_required()
def get_alerts():
    try:
        print(f"JWT Identity: {get_jwt_identity()}")  # Debugging line
        current_user_id = get_jwt_identity()
        user_alerts = db.session.query(Alert).filter_by(user_id=current_user_id).all()

        alerts_data = []
        for alert in user_alerts:
            alerts_data.append({
                'id': alert.id,
                'symbol': alert.symbol,
                'price': alert.price,
                'price_type': alert.price_type,
                'email': alert.email,
                'created_at': alert.created_at
            })
        
        return jsonify(alerts_data), 200
    except Exception as e:
        print("Error fetching user alerts:", traceback.format_exc())
        return jsonify({'message': 'An error occured while fetching alerts.'}), 500
    
# Delete an alert (manually - used on site)

@app.route('/alerts/<int:alert_id>', methods=['DELETE'])
@jwt_required()
def delete_alert(alert_id):
    try:
        current_user_id = get_jwt_identity()
        alert = db.session.query(Alert).filter_by(id=alert_id, user_id=current_user_id).first()
        if not alert:
            return jsonify({'message': 'Alert not found'}), 404
        
        # Moves request to history before deleting

        history_entry = History(
            symbol=alert.symbol,
            price=alert.price,
            price_type=alert.price_type,
            email=alert.email,
            user_id=alert.user_id,
            removed_at=datetime.now(timezone.utc)
        )
        db.session.add(history_entry)

        db.session.delete(alert)
        db.session.commit()
        return jsonify({'message': 'Alert deleted successfully'}), 200
    except Exception as e:
        print("Error deleting alert:", traceback.format_exc())
        return jsonify({'message': 'An error occured while deleting the alert'}), 500
    
# edit an existing alert (manually - used on site)

@app.route('/alert/<int:alert_id>', methods=['PUT'])
@jwt_required()
def edit_alert(alert_id):
    # Expects JSON with fields you want to update
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()

        alert = db.session.query(Alert).filter_by(id=alert_id, user_id=current_user_id).first()
        if not alert:
            return jsonify({'message': 'Alert not found'}), 404
        
        symbol = data.get('symbol')
        price = data.get('price')
        price_type = data.get('price_type')
        email = data.get('email')

        if symbol:
            alert.symbol = symbol
        if price:
            alert.price = float(price)
        if price_type:
            alert.price_type = price_type
        if email:
            alert.email = email

        db.session.commit()
        return jsonify({'message':'Alert updated successfully'}), 200
    except Exception as e:
        print ('Error editing alert:', traceback.format_exc()) 
        return jsonify({'message': 'An error occurred while editing the alert'}), 500
    

# route for retrieving history + search using symbol and removed_at time

@app.route('/history', methods=['GET'])
@jwt_required()
def get_history():
    try:
        current_user_id = get_jwt_identity()
        search = request.args.get('search', '', type=str)
        sort = request.args.get('sort', 'desc', type=str)

        query = db.session.query(History).filter_by(user_id=current_user_id)

        if search:
            # symbol search
            query = query.filter(History.symbol.ilike(f"%{search}%"))

        if sort == 'asc':
            query = query.order_by(History.removed_at.asc())
        else:
            query = query.order_by(History.removed_at.desc())
        
        history_items = query.all()

        history_data = []
        for h in history_items:
            history_data.append({
                'id': h.id,
                'symbol': h.symbol,
                'price': h.price,
                'price_type': h.price_type,
                'email': h.email,
                'removed_at': h.removed_at
            })

        return jsonify(history_data), 200
    except Exception as e:
        print("Error fetching history:", traceback.format_exc())
        return jsonify({'message:' 'An error occured while fetching history.'}), 500


# Initialise a background scheduler (apscheduler)

scheduler = BackgroundScheduler()
scheduler.start()

def check_alerts():
      with app.app_context():
        try:
            print('Scheduler running: checking alerts..')
            alerts = db.session.query(Alert).all()

            for alert in alerts:
                try:
                    current_price = get_stock_price(alert.symbol)
                    print(f"Checking alert for {alert.symbol}. Current price: {current_price}, Alert price: {alert.price}, Price type = {alert.price_type}")


                    if current_price is None:
                        print(f'Failed to fetch price for {alert.symbol}. Skipping.')
                        continue

                    current_price = float(current_price)
                    alert_price = float(alert.price) # after here alert_price should be used instaed of alert.price

                 # --- Only send email if the condition is true ---
                    if alert.price_type == 'low' and current_price <= alert_price:
                        print(f"Triggering LOW alert for {alert.symbol} "
                            f"(current: {current_price}, alert: {alert_price})")
                        if alert.email:
                            send_email(alert.email, alert.symbol, current_price, alert.price_type, alert.price)
                            print('Email sent successfully')
                            
                        history_entry = History(
                            symbol=alert.symbol,
                            price=alert.price,
                            price_type=alert.price_type,
                            email=alert.email,
                            user_id=alert.user_id,
                            removed_at = datetime.now(timezone.utc)
                        )

                        db.session.add(history_entry)
                        db.session.delete(alert)  # remove it after sending
                        print(f"Alert for {alert.symbol} removed successfully.")

                    elif alert.price_type == 'high' and current_price >= alert_price:
                        print(f"Triggering HIGH alert for {alert.symbol} "
                            f"(current: {current_price}, alert: {alert_price})")
                        if alert.email:
                            send_email(alert.email, alert.symbol, current_price, alert.price_type, alert.price)
                            print('Email sent successfully')
                        
                        history_entry = History(
                            symbol=alert.symbol,
                            price=alert.price,
                            price_type=alert.price_type,
                            email=alert.email,
                            user_id=alert.user_id,
                            removed_at=datetime.now(timezone.utc)
                        
                        )
                        db.session.add(history_entry)
                        
                        db.session.delete(alert)
                        print(f"Alert for {alert.symbol} removed successfully.")

                    # If neither condition is met, it does nothing – the alert remains in the DB until it eventually triggers or is manually removed.

                except Exception as alert_error:
                    print(f'Error processing alert for {alert.symbol}: Error: {alert_error}')

            db.session.commit()
            print('Finished Checking alerts')
        except Exception as e:
            print("Error in check_alerts:", traceback.format_exc())

# this line should ensure the check runs every 5 minutes -->
scheduler.add_job(check_alerts, 'interval', minutes=1) # note with 25 reqs per day change your mins to 57.6 for a full day of checks

# Main Entry Point

if __name__ == '__main__':
    # create all tables (User, Alert) in the 'alerts.db' if not present
    with app.app_context():
        db.create_all()
    
    app.run(debug=True)



# HTTP 200: OK - Success response
# HTTP 400: Bad Request - Invalid client data
# HTTP 404: Not Found - Requested resource not found
# HTTP 500: Internal Server Error - Server-side failure