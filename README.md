You can find original SMS Brana documentation <a href="https://www.smsbrana.cz/dokumenty/SMSconnect_dokumentace.pdf">here</a>

This SDK is using hash authorization method (password + time + salt)

Example
--------

Send simple SMS
```
const smsClient = new Client('<your_login>', '<your_passowrd>')

const smsBody = new SmsBody('<target_phone_number>', '<message_text>');

smsClient.sendSms(smsBody).then(res => console.log(res))
```

You can find more examples <a href="https://github.com/Blazik/sms-brana-nodejs-sdk/examples">here</a>

API Documentation
-----------------

**Client:**
- `constructor(login, password)` - returns `Client` object, you can get your `login` and `password` from <a href="https://www.smsbrana.cz/nastaveni-sluzeb/sms-connect.html">www.smsbrana.cz </a>

- object functions:
    - `sendSms(smsBody)` - returns response from SMS gate, its parameter is instance of `SmsBody`
    - `sendMultipleSms(smsBodyArray)` - returns response from SMS gate, its parameter is array of `SmsBody` instances
    - `getCreditStatus()` - returns your current credits
    - `getAcceptedMessages()` - returns answers to your messages

**SmsBody:**
- `constructor(number, message)` - returns `SmsBody` object
    - `number` - **string** - target phone number
    - `message` - **string** - content of SMS to send without diacritics
    
- optional object parameters:
    - `when` - **string** - when to send the message (`YYYYMMDDTHHMMSS` GTM+02:00)
    - `delivery_report` - **0** or **1** - send email when message has been delivered (default **0**)
    - `sender_id` - **string** - ID of authorized phone number from where will be sent message
    - `sender_phone` - **string** - authorized phone number from where will be sent message
    - `user_id` - **string** - your own message identifier for administration purposes
    - `data_code` - **7bit** or **ucs2** - message encoding (default **7bit**)
    - `answer_mail` - **string** - email where will be sent the answer to your message
    - `delivery_mail` - **string** - email where to send that the message has been delivered
