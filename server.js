const express = require('express')
const app = express()
const nodemailer = require('nodemailer')
const striptags = require('striptags')
require('dotenv').config()

const PORT = process.env.PORT || 8080

console.log(`Node.js ${process.version}.`)
app.use(express.json())

const checkKey = (req, res, next) => {
    if (req.query.api_key !== process.env.JWT_SECRET) {
        return res.status(403).json({ error: "Auth failed." })
    }
    next()
}

app.get('/', (req, res) => {
    //return res.send(`
        //<h1>Mailer Status: Online.</h1>
    //`)
    res.json({ msg: "Mailer." })
})

app.post('/', /*checkKey,*/ async (req, res) => {
    const to = req.body.to
    const subject = req.body.subject || process.env.DEFAULT_SUBJECT
    const body = req.body.body
    const from = req.body.from || process.env.MAIL_FROM

    if (!to || !subject || !body || !from) {
        return res.status(400).json({ message: "Missing required variable: from, to, subject, body.", request: req.body })
    }

    console.log(`Sending mail on ${process.env.MAIL_HOST}, to: ${to}, from: ${from}, subject: ${subject}.`)

    let transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: process.env.MAIL_PORT || 25,
        tls: {
            rejectUnauthorized: false
        }
    })

    try {
        let info = await transporter.sendMail({
            from: from,
            to: to,
            subject: subject,
            text: striptags(body),
            html: body
        })
        console.log(`Mail sent: ${info.messageId}.`)
    } catch (error) {
        console.log(error)
        return res.status(400).json({ error: "Mail not sent.", message: error.message })
    }

    res.send({ message: "Mail sent." })
})

app.listen(PORT, () => {
    try {
        console.log(`Running on port ${PORT}.`)
    } catch (error) {
        res.status(500).json({ message: "Internal server error." })
    }
})