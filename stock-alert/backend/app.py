#this represents a basic flask server
from flask import Flask, request, jsonify
from flask_cors import CORS
from stock_utils import get_stock_price
from sqlalchemy.orm import sessionmaker
from models import Alert
from email_utils import send_email
from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy import create_engine

app = Flask(__name__)
CORS(app) # Enables (Cross-Origin Resource Sharing) which supoosedly just means frontend-backend communication

@app.route('/')
def home():
    return "Welcome to the Stock Alert API! Use the /set_alert endpoint to submit data."

# this is an endpoint to recieve stock data -->
@app.route('/set_alert', methods=['POST'])
def set_alert():
    try:
        data = request.json
        print("request data:", data)
        
        symbol = data.get('symbol')
        price = data.get('price')
        email = data.get('email')

        # HTTP 200: OK - Success response
        # HTTP 400: Bad Request - Invalid client data
        # HTTP 404: Not Found - Requested resource not found
        # HTTP 500: Internal Server Error - Server-side failure

        if not symbol or not price:
            return jsonify({'message': 'Invalid data'}), 400
        
        print(f"Received alert: Symbol={symbol}, Price={price}, Email={email}")
        return jsonify({'message': 'Alert set successfully!'}), 200 
    except Exception as e:
        print("Error processing request:", e)
        return jsonify({'message': 'An internal error occurred.'}), 500

@app.route('/get_price/<symbol>', methods=['GET'])
def get_price(symbol):
    price = get_stock_price(symbol)
    if price:
        return jsonify({'symbol': symbol, 'price': price}), 200
    return jsonify({'message': 'Stock price not found'}), 404

# create db

engine = create_engine('sqlite:///alerts.db')
Session = sessionmaker(bind=engine)

# Initialise a background scheduler (apscheduler)

scheduler = BackgroundScheduler()
scheduler.start()

def check_alerts():
    try:
        session = Session() # starts a database session
        alerts = session.query(Alert).all()

        for alert in alerts:
            current_price = get_stock_price(alert.symbol)
            if current_price and current_price <= alert.price:
                print(f"Alert triggered for {alert.symbol}! Current price: {current_price}")

                #send notification
                if alert.email:
                    send_email(alert.email, alert.symbol, current_price)
                
                session.delete(alert)
        
        session.commit()
    except Exception as e:
        print("Error in check_alerts:", e)

# this line should ensure the check runs every 5 minutes -->
scheduler.add_job(check_alerts, 'interval', minutes=5)

if __name__ == '__main__':
    app.run(debug=True)
