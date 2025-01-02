# this will store my api logic

import requests

FINNHUB_API_KEY = 'ctrc3ahr01qhb16mhni0ctrc3ahr01qhb16mhnig'

def get_stock_price(symbol):
    try:
        url = f'https://finnhub.io/api/v1/quote?symbol={symbol}&token={FINNHUB_API_KEY}'
        response = requests.get(url)
        if response.status_code != 200:
            print(f"Error fetching stock price for {symbol}: {response.status_code}")
            return None
        
        data = response.json()
        # Finnhub returns current price under 'c'
        return data.get('c', None)  # 'c' is the current price
    except Exception as e:
        print(f"Error in get_stock_price: {e}")
        return None


# I am currently using Finnhub which provides up to 60 reqs per min
# This has no minutely, hourly, daily or monthly limit.

# ALPHA VANTAGE - NOTE: DO NOT USE BETTER OPTIONS AVAILABLE
# it should be noted this key is free (OQTQ7NGARONXP2MD) and you can get your own at https://www.alphavantage.co/support/#api-key
# this allows for 25 requests per day. so with 1 every 5 mins you will run out of api requests 2 hours after making a request.
# On further inspections they only allow 5 reqs per min 
# this did used to be 500reqs per day this would allow a req every 3 mins