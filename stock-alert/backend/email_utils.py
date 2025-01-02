# this will send the email
# !! !! !!  directly putting in your credentials is NOT SECURE   !! !! !!
# instead i will be importing them from elsewhere so they can not be accessed through this git repository
# to ensure this code works for you - input your own email and password into cmd using | set EMAIL_USER=... and set EMAILPASS=... |
# do NOT use '' 
import yagmail
import os

def send_email(recipient, symbol, price):
    sender_email = os.environ.get('EMAIL_USER') # this should use my GMAIL
    sender_password = os.environ.get('EMAIL_PASS')

    if not sender_email or not sender_password:
        raise ValueError("Email credentials are not set in environment variables")
    
    yag = yagmail.SMTP(sender_email, sender_password)

    subject = f"Stock Alert: {symbol} has hit your target price!" #f just allows you to insert data
    content = f"The stock {symbol} has reached your target price. Current Price: £{price}.\nThank you for using this service."

    try:
        yag.send(to=recipient, subject=subject, contents=content)
        print(f"Email sent to {recipient} for {symbol}.")
    except Exception as e:
        print(f'Failed to send email to {recipient}: {e}')