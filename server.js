const express = require('express')
const app = express()
const nodemailer = require('nodemailer')
const striptags = require('striptags')
const jwt = require('jsonwebtoken')
require('dotenv').config()

const PORT = process.env.PORT || 8080
const MAIL_PORT = process.env.MAIL_PORT || 25

console.log(`Node.js ${process.version}.`)
app.use(express.json())

const checkKey = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization']
        console.log(`Authorize API key: ${authHeader}`)
        const apiKey = authHeader?.split(' ')[1]

        if (apiKey !== process.env.API_KEY) {
            return res.status(403).json({ error: "Auth failed." })
        }
        next()

    } catch (error) {
        console.log(error.message)
        return res.status(401).json({ error: "Authorization failed." })
    }
}

const checkJwt = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization']
        console.log(`Authorize JWT: ${authHeader}`)
        const token = authHeader?.split(' ')[1]

        const JWT = jwt.verify(token, process.env.JWT_SECRET)
        console.log(`Token authorized for user.`)

        next()
    } catch (error) {
        console.log(error.message)
        return res.status(401).json({ error: "Authorization failed." })
    }   
}

app.get('/', (req, res) => {
    //return res.send(`
        //<h1>Mailer Status: Online.</h1>
    //`)
    res.json({ msg: "Mailer." })
})

let transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT || 25,
    tls: {
        rejectUnauthorized: false
    }
})

app.post('/', /*checkJwt,*/ async (req, res) => {
    const to = req.body.to
    const subject = req.body.subject || process.env.DEFAULT_SUBJECT
    const body = req.body.body
    const from = req.body.from || process.env.MAIL_FROM

    if (!to || !subject || !body || !from) {
        return res.status(400).json({ message: "Missing required variable: from, to, subject, body.", request: req.body })
    }

    console.log(`Sending mail on ${process.env.MAIL_HOST}:${MAIL_PORT}, to: ${to}, from: ${from}, subject: ${subject}.`)

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

app.post('/newsletter', checkKey, async (req, res) => {
    const to = req.body.to
    const subject = req.body.subject || process.env.DEFAULT_SUBJECT
    const body = req.body.body
    const from = process.env.MAIL_FROM

    if (!to || !subject || !body) {
        return res.status(400).json({ message: "Missing required variable: to, subject, body.", request: req.body })
    }

    console.log(`Sending newsletter on ${process.env.MAIL_HOST}:${MAIL_PORT}, to: ${to}, from: ${from}, subject: ${subject}.`)

    try {
        let info = await transporter.sendMail({
            from: from,
            to: to,
            subject: subject,
            text: striptags(body),
            html: body
        })
        console.log(`Newsletter sent: ${info.messageId}.`)
    } catch (error) {
        console.log(error)
        return res.status(400).json({ error: "Newsletter not sent.", message: error.message })
    }

    res.send({ message: "Newsletter sent." })
})

app.post('/order', /*checkJwt,*/ async (req, res) => {
    const from = req.body.from
    const to = req.body.to
    const subject = req.body.subject || process.env.DEFAULT_SUBJECT
    const body = req.body.body

    //console.log(body.orderItems)

    const message = JSON.stringify(body)

    console.log(message)

    if (!to || !subject || !body) {
        return res.status(400).json({ message: "Missing required variable: to, subject, body.", request: req.body })
    }

    console.log(`Sending order confirmation on ${process.env.MAIL_HOST}:${MAIL_PORT}, to: ${to}, from: ${from}, subject: ${subject}.`)

    try {
        let info = await transporter.sendMail({
            from: from,
            to: to,
            subject: subject,
            body: striptags(message),
            html: message
        })
        console.log(`Order confirmation sent: ${info.messageId}.`)
    } catch (error) {
        console.log(error)
        return res.status(400).json({ error: "Order confirmation not sent.", message: error.message })
    }

    res.send({ message: "Order confirmation sent." })
})

app.post('/invoicing', /*checkJwt,*/ async (req, res) => {
    const from = process.env.MAIL_FROM
    const to = req.body.to
    const subject = req.body.subject || process.env.DEFAULT_SUBJECT
    const body = req.body.body

    if (!to || !subject || !body) {
        return res.status(400).json({ message: "Missing required variable: to, subject, body.", request: req.body })
    }

    console.log(`Sending invoice on ${process.env.MAIL_HOST}:${MAIL_PORT}, to: ${to}, from: ${from}, subject: ${subject}.`)

    try {
        let info = await transporter.sendMail({
            from: from,
            to: to,
            subject: subject,
            body: striptags(body),
            html: body
        })
        console.log(`Invoice sent: ${info.messageId}.`)
    } catch (error) {
        console.log(error)
        return res.status(400).json({ error: "Invoice not sent.", message: error.message })
    }

    res.send({ message: "Invoice sent." })
})

app.post('/shipping', /*checkJwt,*/ async (req, res) => {
    const from = process.env.MAIL_FROM
    const to = req.body.to
    const subject = req.body.subject || process.env.DEFAULT_SUBJECT
    const body = req.body.body

    if (!to || !subject || !body) {
        return res.status(400).json({ message: "Missing required variable: to, subject, body.", request: req.body })
    }

    console.log(`Sending shipping details on ${process.env.MAIL_HOST}:${MAIL_PORT}, to: ${to}, from: ${from}, subject: ${subject}.`)

    try {
        let info = await transporter.sendMail({
            from: from,
            to: to,
            subject: subject,
            body: striptags(body),
            html: body
        })
        console.log(`Shipping details sent: ${info.messageId}.`)
    } catch (error) {
        console.log(error)
        return res.status(400).json({ error: "Shipping details not sent.", message: error.message })
    }

    res.send({ message: "Shipping details sent." })
})

app.post('/user', /*checkJwt,*/ async (req, res) => {
    const from = process.env.MAIL_FROM
    const to = req.body.to
    const subject = req.body.subject || process.env.DEFAULT_SUBJECT
    const body = req.body.body

    if (!to || !subject || !body) {
        return res.status(400).json({ message: "Missing required variable: to, subject, body.", request: req.body })
    }

    console.log(`Sending user info on ${process.env.MAIL_HOST}:${MAIL_PORT}, to: ${to}, from: ${from}, subject: ${subject}.`)

    try {
        let info = await transporter.sendMail({
            from: from,
            to: to,
            subject: subject,
            body: striptags(body),
            html: body
        })
        console.log(`User info sent: ${info.messageId}.`)
    } catch (error) {
        console.log(error)
        return res.status(400).json({ error: "User info not sent.", message: error.message })
    }

    res.send({ message: "User info sent." })
})

app.listen(PORT, () => {
    try {
        console.log(`Running on port ${PORT}.`)
    } catch (error) {
        res.status(500).json({ message: 'Internal server error.' })
    }
})