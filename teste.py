import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders

email_user = "noreply.aegix@gmail.com"
email_password = "ymcmfsfbxmbkjyzo"
email_send = "timeo971@gmail.com"

subject = "Test email from pi"

msg = MIMEMultipart()
msg["From"] = email_user
msg["To"] = email_send
msg["Subject"] = subject

body = "Hi there, sending this email from Python!"
body = "<html> Hi there, sending this email <h1> from Python</h1>!<table border=1><tr><td>sdsdssd</td></tr></table> </html>"
#msg.attach(MIMEText(body,"html"))mettre en "plain"
msg.attach(MIMEText(body,"plain"))#mettre en "plain"

text = msg.as_string()
server = smtplib.SMTP("smtp.gmail.com",587)
server.starttls()
server.login(email_user,email_password)


server.sendmail(email_user,email_send,text)
server.quit()
#faire du JS apeler du coder python pour envoier le mail