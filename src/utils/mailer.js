const nodemailer = require('nodemailer');
const { config } = require('../config');

const { USER, PASSWORD } = config.MAIL

exports.transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: USER,
        pass: PASSWORD
    },
    tls: {
        rejectUnauthorized: false
    }
})
