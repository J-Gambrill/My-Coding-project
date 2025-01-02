#this represents a basic flask server
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app) # Enables (Cross-Origin Resource Sharing) which supoosedly just means frontend-backend communication

# this is an endpoint to recieve stock data -->

@app.route('/set_alert', methods=['POST'])
def set_alert():
    data = request.json
    symbol = data.get('symbol')
    price = data.get('price')
    email = data.get('email')

    if not symbol or not price:
        return jsonify({'message': 'Invalid data'}), 400
    
    # for now i am just logging the alert data but i will have to store it somewhere later
    print(f"Received alert: Symbol={symbol}, Price={price}, Email={email}")
    return jsonify({'message': 'Alert set successfully!'}), 200 # i believe that these numbers represent to number needed to activate the success message (HTTP statsus codes)

if (__name__) == '__main__':
    app.run(debug=True)