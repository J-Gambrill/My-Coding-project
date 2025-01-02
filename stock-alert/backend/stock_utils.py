# this will store my api logic
import requests

STOCK_API_KEY = 'OQTQ7NGARONXP2MD'

def get_stock_price(symbol):
    url= f'https://www.alphavantage.co/query'
    params = {
        'function': 'GLOBAL_QUOTE',
        'symbol': symbol,
        'apikey': STOCK_API_KEY
    }
    response = requests.get(url, params=params)
    data = response.json()
    price = data.get('Global Quote', {}).get('05. price')
    return float(price) if price else None
