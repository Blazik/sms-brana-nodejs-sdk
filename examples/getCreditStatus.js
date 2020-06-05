const {Client} = require('../SmsGateClient')

const smsClient = new Client('<your_login>', '<your_passowrd>')

smsClient.getCreditStatus().then(res => console.log(res))
