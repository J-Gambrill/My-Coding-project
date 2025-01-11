# this will send the email
# !! !! !!  directly putting in your credentials is NOT SECURE   !! !! !!
# instead i will be importing them from elsewhere so they can not be accessed through this git repository
# to ensure this code works for you - input your own email and password into cmd using | set EMAIL_USER=... and set EMAILPASS=... |
# do NOT use '' 
import yagmail
import os
import logging



def send_email(
        recipient, # alert.email
        symbol, # alert.symbol
        stock_price, # current_price 
        price_type, # 'low' or 'high'
        alert_price # alert.price
    ):

    sender_email = os.getenv('EMAIL_USER')
    sender_password = os.getenv('EMAIL_PASS')

    if not sender_email or not sender_password:
        raise ValueError("Email credentials are not set in environment variables")
    
    yag = yagmail.SMTP(sender_email, sender_password)

    subject = f"Stock Alert: {symbol} has hit your {price_type} target price!" #f just allows you to insert data

    if price_type == "high":
        content = f"The stock {symbol} has risen to or above your target price of ${alert_price}. The stock price is currently ${stock_price}\nThank you for using this service."
    else:
        content = f"The stock {symbol} has fallen to or below your target price of ${alert_price}. The stock price is currently ${stock_price}\nThank you for using this service."

    try:
        yag.send(to=recipient, subject=subject, contents=content)
        logging.info(f"Email sent to {recipient} for {symbol}.")
    except Exception as e:
        logging.error(f'Failed to send email to {recipient}: {e}')