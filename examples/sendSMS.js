const {Client, SmsBody} = require('../SmsGateClient')

const smsClient = new Client('<your_login>', '<your_passowrd>')

const smsBody = new SmsBody('<target_phone_number>', '<message_text>');

smsClient.sendSms(smsBody).then(res => console.log(res))
