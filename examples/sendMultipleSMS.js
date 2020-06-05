const {Client, SmsBody} = require('../SmsGateClient')

const smsClient = new Client('<your_login>', '<your_passowrd>')

const smsBody1 = new SmsBody('<target_phone_number>', '<message_text>');
const smsBody2 = new SmsBody('<target_phone_number>', '<message_text>');
const smsBody3 = new SmsBody('<target_phone_number>', '<message_text>');

smsClient.sendMultipleSms([smsBody1, smsBody2, smsBody3]).then(res => console.log(res))
