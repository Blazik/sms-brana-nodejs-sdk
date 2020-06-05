const {Client} = require('../SmsGateClient')

const smsClient = new Client('<your_login>', '<your_passowrd>')

smsClient.getAcceptedMessages().then(res => console.log(res))
