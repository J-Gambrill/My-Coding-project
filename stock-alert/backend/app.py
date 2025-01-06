

#this represents a basic flask server
from flask import Flask, request, jsonify
from flask_cors import CORS
from stock_utils import get_stock_price
from sqlalchemy.orm import sessionmaker
from models import Alert
from email_utils import send_email
from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy import create_engine
import traceback

app = Flask(__name__)
CORS(app) # Enables (Cross-Origin Resource Sharing) which supoosedly just means frontend-backend communication

# create db

engine = create_engine('sqlite:///alerts.db')
Session = sessionmaker(bind=engine)

@app.route('/')
def home():
    return "Welcome to the Stock Alert API! Use the /set_alert endpoint to submit data."

# this is an endpoint to recieve stock data -->
@app.route('/set_alert', methods=['POST'])
def set_alert():
    try:
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
            return jsonify({'message': 'Prices must be numeric'})
        
         # add new alert to db
        session = Session()
       
        if high_price is not None:
            high_alert = Alert(symbol=symbol, price=float(high_price), email=email, price_type='high')
            session.add(high_alert)

        if low_price is not None:
            low_alert = Alert(symbol=symbol, price=float(low_price), email=email, price_type='low')
            session.add(low_alert)

        session.commit()
        session.close()
        
        print(f"Received alert: Symbol={symbol}, High Price={high_price}, Low Price={low_price} Email={email}")
        return jsonify({'message': 'Alert set successfully!'}), 200 
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
    



# Initialise a background scheduler (apscheduler)

scheduler = BackgroundScheduler()
scheduler.start()

def check_alerts():
    try:
        print('Schedular running: checking alerts..')
        session = Session()  # Start a database session
        alerts = session.query(Alert).all()

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
                    
                    session.delete(alert)  # remove it after sending
                    print(f"Alert for {alert.symbol} removed successfully.")

                elif alert.price_type == 'high' and current_price >= alert_price:
                    print(f"Triggering HIGH alert for {alert.symbol} "
                          f"(current: {current_price}, alert: {alert_price})")
                    if alert.email:
                        send_email(alert.email, alert.symbol, current_price, alert.price_type, alert.price)
                        print('Email sent successfully')
                    
                    session.delete(alert)
                    print(f"Alert for {alert.symbol} removed successfully.")

                # If neither condition is met, it does nothing – the alert remains in the DB until it eventually triggers or is manually removed.

            except Exception as alert_error:
                print(f'Error prossesing alert for {alert.symbol}: Error: {alert_error}')

        session.commit()
        session.close()
        print('Finished Checking alerts')
    except Exception as e:
        print("Error in check_alerts:", traceback.format_exc())

# this line should ensure the check runs every 5 minutes -->
scheduler.add_job(check_alerts, 'interval', minutes=1) # note with 25 reqs per day change your mins to 57.6 for a full day of checks

if __name__ == '__main__':
    app.run(debug=True)



# HTTP 200: OK - Success response
# HTTP 400: Bad Request - Invalid client data
# HTTP 404: Not Found - Requested resource not found
# HTTP 500: Internal Server Error - Server-side failure