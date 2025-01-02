# this will store my api logic
import requests

STOCK_API_KEY = 'OQTQ7NGARONXP2MD' # it should be noted this key is free and you can get your own at https://www.alphavantage.co/support/#api-key
# this allows for 25 requests per day. so with 1 every 5 mins you will run out of api requests 2 hours after making a request
# this did used to be 500reqs per day this would allow a req every 3 mins

def get_stock_price(symbol):
    url= f'https://www.alphavantage.co/query'
    params = {
        'function': 'GLOBAL_QUOTE',
        'symbol': symbol,
        'apikey': STOCK_API_KEY
    }

    if response.status_code != 200:
        print(f'Errir fetching stock price for {symbol}: {response.status_code}')
        return None
    
    try:
        response = requests.get(url, params=params)
        data = response.json()
        price = data.get('Global Quote', {}).get('05. price')
        return float(price) if price else None
    except Exception as e:
        print(f'Error parsing API response: {e}')
        return None
