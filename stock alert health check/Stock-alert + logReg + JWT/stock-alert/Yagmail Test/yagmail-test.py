import yagmail
import os

sender = os.getenv('EMAIL_USER')
password = os.getenv('EMAIL_PASS')
recipient = "jameswgambrill@icloud.com"

print(f'Sender Username: {sender} , Sender Password: {password}, Recipient: {recipient}')

yag = yagmail.SMTP(user=sender, password=password)

subject = "Test Email"
content = "This is a test email sent using yagmail."

print('Email Formed')

try:
    yag.send(to=recipient, subject=subject, contents=content)
    print("Email sent successfully!")
except Exception as e:
    print(f"Error: {e}")
