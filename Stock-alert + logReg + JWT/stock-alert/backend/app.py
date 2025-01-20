
# should gmail stop working amazon offers 62,000 free emails per month - best free solution
#this represents a basic flask server
import os
import jwt
import datetime
import traceback

from flask import Flask, request, jsonify
from flask_cors import CORS
from apscheduler.schedulers.background import BackgroundScheduler
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import dotenv_values

from models import db, Alert, User, AlertHistory
from stock_utils import get_stock_price
from email_utils import send_email
from sqlalchemy.orm import joinedload


envValues = dotenv_values(".env")
app = Flask(__name__)

app.config["SECRET_KEY"] = envValues.get("SECRET_KEY", "test123")
iss = "my-flask-app"

CORS(app, resources={r"/*": {"origins": "http://localhost:8080"}}, supports_credentials=True)


#configures sqlalchemy
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(BASE_DIR, "alerts.db")
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{db_path}"

db.init_app(app)


# This should issue an JWT ACCESS token
def create_access_token(data, expires_in=15):
    expiration = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=expires_in)
    token = jwt.encode (
        {
            "data": data,
            "exp": expiration,
            "iss": iss,
        },
        app.config['SECRET_KEY'],
        algorithm="HS256"
    )
    return token

# This should issue a JWT REFRESH token

def create_refresh_token(data, expires_in=1440): # 24 hours
    expiration = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=expires_in)
    token = jwt.encode(
        {
            "data": data,
            "exp": expiration,
            "iss": iss
        },
        app.config['SECRET_KEY'],
        algorithm="HS256"
    )
    return token




# Auth Routes (login/register)

@app.route('/Register', methods=['POST'])
def Register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    confirm_password = data.get('confirm_password')
    email = data.get('email')
    confirm_email = data.get('confirm_email')

    if password != confirm_password:
        return jsonify({"error": "Passwords do not match"}), 400
    
    if email != confirm_email:
        return jsonify({"error": "Emails do not match"}), 400


    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400

    # Check if the user already exists
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already exists'}), 409

    # Hash the password & create a new user
    hashed_password = generate_password_hash(password)
    new_user = User(username=username, password=hashed_password, email=email)
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

    user = User.query.filter_by(username=username).first()

    if not user or not check_password_hash(user.password, password):
        return jsonify({'error': 'Invalid username or password'}), 401

    # we are inputting this so that we can retrieve them from the database later
    access_token = create_access_token({"user_id": user.id, "username": user.username})
    refresh_token = create_refresh_token({"user_id": user.id, "username": user.username})
    
    # we will now set these as HTTP only cookies - these can still be returned in JSON if needed
    # COOKIE Response
    response = jsonify({"message": "Login Successfull"})
    
    response.set_cookie(  # token
        "access_token",
        access_token,
        httponly=True,
        secure=False, # change to true when using production (HTTP = False, HTTPS = True)
        samesite='Lax',
        path='/'
    )

    response.set_cookie( # refresh token
        "refresh_token",
        refresh_token,
        httponly=True,
        secure=False,
        samesite='Lax',
        path='/'
    )
    return response, 200


 #  JSON Response:

 #   return jsonify({
 #           "access_token": access_token,
 #           "refresh_token": refresh_token
 #       }), 200
 #   else:
 #       return jsonify({"error": "Invalid credentials"}), 401


# Protected & Refresh Routes - JWT related

@app.route("/protected", methods=["GET"])
def protected():
    token = request.cookies.get("access_token")
    if not token:
        return jsonify({"error": "Missing access token cookie."}),401
    
    try:
        decoded = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
        return jsonify({"message": "Access Granted", "user_data": decoded["data"]}),200
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token Expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid Token"}), 401
    
@app.route("/refresh", methods=["POST"])
def refresh():
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        return jsonify({"error": "Missing refresh token cookie"}), 401
    
    try:
        decoded = jwt.decode(refresh_token, app.config['SECRET_KEY'], algorithms=["HS256"])
        new_access_token = create_access_token({
            "user_id": decoded["data"]["user_id"],
            "username": decoded["data"]["username"]
        })
        response = jsonify({"message": "Access token refreshed"})
        response.set_cookie(
            "access_token",
            new_access_token,
            httponly=True,
            secure=False
        )
        return response, 200
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Refresh token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid refresh token"}), 401
    


# Alert & Stock Routes

@app.route('/')
def home():
    return "Welcome to the Stock Alert API! Use the /set_alert endpoint to submit data."

# this is an endpoint to recieve stock data -->
@app.route('/set_alert', methods=['POST'])
def set_alert():
    try:
        data = request.json
        print("Request data:", data)

        token = request.cookies.get("access_token")
        if not token:
            return jsonify({'message': 'Unauthorized. Missing token.'}), 401
        
        try:
            decoded = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
        except jwt.ExpiredSignatureError:  
            return jsonify({'message': 'Token expired'}), 401 
        except jwt.InvalidTokenError:  
            return jsonify({'message': 'Invalid token'}), 401 
        
        user_id = decoded["data"]["user_id"]  # Get user_id from token
        
        symbol = data.get('symbol')
        high_price = data.get('high_price')
        low_price = data.get('low_price')

        if not symbol:
            return jsonify({'message': 'Invalid data: Stock symbol required'}), 400
        if not high_price and not low_price:
            return jsonify({'message': 'Invalid data: Please provide at least one target price.'}), 400
        
        try:
            high_price = float(high_price) if high_price else None
            low_price = float(low_price) if low_price else None
        except ValueError:
            return jsonify({'message': 'Prices must be numeric'}), 400

       # creates alert in DB

        if high_price is not None:
            high_alert = Alert(user_id=user_id, symbol=symbol, price=float(high_price), price_type='high')
            db.session.add(high_alert)

        if low_price is not None:
            low_alert = Alert(user_id=user_id, symbol=symbol, price=float(low_price), price_type='low')
            db.session.add(low_alert)

        db.session.commit()
        print(f"Received alert: User ID={user_id} Symbol={symbol}, High Price={high_price}, "f"Low Price={low_price}")

        return jsonify({'message': 'Alert set successfully!'}), 200
    
    except jwt.ExpiredSignatureError:  
        return jsonify({'message': 'Token expired'}), 401 
    except jwt.InvalidTokenError:  
        return jsonify({'message': 'Invalid token'}), 401    
    except Exception as e:
        print("Error processing request:", traceback.format_exc())
        return jsonify({'message': 'An internal error occurred.'}), 500
    
    
@app.route('/get_price/<symbol>', methods=['GET'])
def get_price(symbol):
    try:
        stock_price = get_stock_price(symbol)
        if stock_price:
            return jsonify({'symbol': symbol, 'price': stock_price}), 200
        return jsonify({'message': 'Stock price not found'}), 404
    except Exception as e:
        print("Error fetching stock price:", traceback.format_exc())
        return jsonify({'message': 'An error occurred while fetching the price.'}), 500
    
# app route to display the users alerts in a table

@app.route('/user_alerts', methods=['GET'])
def user_alerts():
    token = request.cookies.get("access_token")
    if not token:
        return jsonify({'error': 'Unauthorized. Missing token.'}), 401
    
    try:
        decoded = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = decoded["data"]["user_id"]

        alerts = Alert.query.filter_by(user_id=user_id).all()
        alerts_data = [
            {"id": alert.id, "symbol": alert.symbol, "price": alert.price, "price_type": alert.price_type}
            for alert in alerts
        ]
        return jsonify({'alerts': alerts_data}), 200
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        print("Error fetching alerts:", traceback.format_exc())
        return jsonify({'error': 'Internal server error'}), 500

# app route to display user history

@app.route('/alert_history', methods=['GET'])
def alert_history():
    token = request.cookies.get("access_token")
    if not token:
        return jsonify({'error': 'Unauthorized. Missing token.'}), 401
    
    try:
        decoded = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = decoded["data"]["user_id"]

        history_alerts = AlertHistory.query.filter_by(user_id=user_id).order_by(AlertHistory.activated_at.desc()).all()
        history_data = [
            {
                "id": alert.id,
                "symbol": alert.symbol,
                "price": alert.price,
                "price_type": alert.price_type,
                "activated_at": alert.activated_at.strftime('%H:%M, %d.%m.%Y')
            }
            for alert in history_alerts
        ]
        return jsonify({'history_alerts': history_data}), 200
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token Expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        print("Error fetching alert history:", traceback.format_exc())
        return jsonify({'error': 'Internal server error'}), 500
    

# Initialise a background scheduler (apscheduler)

scheduler = BackgroundScheduler()
scheduler.start()

def check_alerts():
      with app.app_context():
        try:
            print('Scheduler running: checking alerts..')
            alerts = Alert.query.options(joinedload(Alert.user)).all()

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
                        if alert.user.email:
                            send_email(alert.user.email, alert.symbol, current_price, alert.price_type, alert.price)
                            print('Email sent successfully')
                        
                        # Move alert to history
                        history_alert = AlertHistory(
                            symbol=alert.symbol,
                            price=alert.price,
                            price_type=alert.price_type,
                            user_id=alert.user_id,
                            activated_at=datetime.datetime.now(datetime.timezone.utc)
                        )
                        db.session.add(history_alert)
                        print(f"Alert for {alert.symbol} added to history")
                        
                        db.session.delete(alert)  # remove it after sending
                        print(f"Alert for {alert.symbol} removed successfully.")

                    elif alert.price_type == 'high' and current_price >= alert_price:
                        print(f"Triggering HIGH alert for {alert.symbol} "
                            f"(current: {current_price}, alert: {alert_price})")
                        if alert.user.email:
                            send_email(alert.user.email, alert.symbol, current_price, alert.price_type, alert.price)
                            print('Email sent successfully')
                        
                         # Move alert to history
                        history_alert = AlertHistory(
                            symbol=alert.symbol,
                            price=alert.price,
                            price_type=alert.price_type,
                            user_id=alert.user_id,
                            activated_at=datetime.datetime.now(datetime.timezone.utc)
                        )
                        db.session.add(history_alert)
                        print(f"Alert for {alert.symbol} added to history")
                        
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
    
    app.run(debug=True, use_reloader=False)



# HTTP 200: OK - Success response
# HTTP 400: Bad Request - Invalid client data
# HTTP 404: Not Found - Requested resource not found
# HTTP 500: Internal Server Error - Server-side failure