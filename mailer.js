const mailer = require('nodemailer')

const sendData = (title, data, users) => {
    let to = ''
    for (let i of users) {
        to += i + ', ' 
    }
    to = to.slice(0, -2)
    let transporter = mailer.createTransport({
        host: 'smtp-mail.outlook.com',
        port: 25,
        // port: 587,
        // secure: true,
        auth: {
            user: 'beim2015@outlook.com',
            pass: 'giveup999'
        }
    })
    let mailOptions = {
        from: 'beim2015@outlook.com',
        to,
        subject: title,
        html: data
    }
    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.log(err)
        } else {
            console.log('Message sent: ', info.response)
        }
    })
}

module.exports = {
    sendData
}
