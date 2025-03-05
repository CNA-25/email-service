const express = require('express')
const app = express()
const nodemailer = require('nodemailer')
const striptags = require('striptags')
const jwt = require('jsonwebtoken')
const pdflib = require('pdf-lib')
const fs = require('fs')
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
        console.log(`Token authorized for ${JWT.role} ${JWT.sub}: ${JWT.name}, ${JWT.email}.`)

        req.userData = JWT

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

app.post('/', checkJwt, async (req, res) => {
    const to = req.userData.email
    const subject = req.body.subject || process.env.DEFAULT_SUBJECT
    const body = req.body.body
    const from = process.env.MAIL_FROM

    if (!to || !subject || !body || !from) {
        return res.status(400).json({ message: "Missing required variable: to, subject, body.", request: req.body })
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

app.post('/invoicing', checkJwt, async (req, res) => {
    const from = process.env.MAIL_FROM
    const to = req.userData.email
    const subject = req.body.subject || process.env.DEFAULT_SUBJECT
    const body = req.body.body
    const base64 = req.body.pdfBase64
    const invoiceName = subject.replace(/\s+/g, '');
    const fileName = invoiceName + '.pdf'

    console.log(fileName)

    try {
        function base64ToPDF(base64, fileName) {
            // Remove data URL
            const base64Data = base64.replace(/^data:application\/pdf;base64,/, "");
            console.log(base64Data);
    
            // Create buffer from base64 string
            const pdfBuffer = Buffer.from(base64Data, 'base64');
            console.log(pdfBuffer);
    
            // Write to file
            fs.writeFileSync(fileName, pdfBuffer)
        }

        base64ToPDF(base64, fileName)
    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ message: "Unable to convert base64 to PDF." })
    }

    if (!to || !subject || !body || !base64) {
        return res.status(400).json({ message: "Missing required variable: to, subject, body.", request: req.body })
    }

    console.log(`Sending invoice on ${process.env.MAIL_HOST}:${MAIL_PORT}, to: ${to}, from: ${from}, subject: ${subject}.`)

    try {
        let info = await transporter.sendMail({
            from: from,
            to: to,
            subject: subject,
            body: striptags(body),
            html: body,
            attachments: [
                {
                    filename: `${fileName}`,
                    path: `./${fileName}`
                }
            ]
        })
        console.log(`Invoice sent: ${info.messageId}.`)
    } catch (error) {
        console.log(error)
        return res.status(400).json({ error: "Invoice not sent.", message: error.message })
    }

    res.send({ message: "Invoice sent." })
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

app.post('/order', checkJwt, async (req, res) => {
    const from = process.env.MAIL_FROM
    const to = req.userData.email
    const subject = req.body.subject || process.env.DEFAULT_SUBJECT
    const body = req.body.body

    const itemsList = body[0].orderItems;

    let listLength = itemsList.length;

    let text = `<p>Hej ${req.userData.name},</p>
        <p>Tack för din beställning! Här är bekräftelsen för din beställning, Order #${body[0].orderId}, som gjordes den ${body[0].timestamp}.</p>
        <p>Pris: ${body[0].orderPrice}</p>
        <p>Shipping adress: ${body[0].shipping_address}</p><br>
        <p>Sammanfattning: </p>
        <table style='width:100%'>`;

    for (let i = 0; i < listLength; i++) {
        text += `<tr>
                    <td style='width:20%'>
                        <img src='https://product-service-cna-product-service.2.rahtiapp.fi${body[0].orderItems[i].product_image}' width='100px' height='auto'>
                    </td>
                    <td>
                        <b>${body[0].orderItems[i].product_name}</b>
                        <p>${body[0].orderItems[i].product_description}</p>
                        <ul>
                            <li>Land: ${body[0].orderItems[i].product_country}</li>
                            <li>Kategori: ${body[0].orderItems[i].product_category}</li>
                            <li>Item ID: ${body[0].orderItems[i].order_item_id}</li>
                            <li>BeställningsID: ${body[0].orderItems[i].order_id}</li>
                            <li>ProduktID: ${body[0].orderItems[i].product_id}</li>
                            <li>Mängd: ${body[0].orderItems[i].quantity}</li>
                            <li>Produktpris: ${body[0].orderItems[i].product_price}</li>
                            <li>Totalt pris: ${body[0].orderItems[i].total_price}</li>
                        </ul>
                    </td>
                </tr>`;
    }
    
    text += `</table>
            <p>Tack för att du shoppade hos oss!</p><br>
            <p>Med vänlig hälsning,</p>
            <p>Beercraft</p>`;

    if (!to || !subject || !body) {
        return res.status(400).json({ message: "Missing required variable: to, subject, body.", request: req.body })
    }

    console.log(`Sending order confirmation on ${process.env.MAIL_HOST}:${MAIL_PORT}, to: ${to}, from: ${from}, subject: ${subject}.`)

    try {
        let info = await transporter.sendMail({
            from: from,
            to: to,
            subject: subject,
            body: striptags(text),
            html: text
        })
        console.log(`Order confirmation sent: ${info.messageId}.`)
    } catch (error) {
        console.log(error)
        return res.status(400).json({ error: "Order confirmation not sent.", message: error.message })
    }

    res.send({ message: "Order confirmation sent." })
})

app.post('/shipping', checkJwt, async (req, res) => {
    const from = process.env.MAIL_FROM
    const to = req.userData.email
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
        res.status(500).json({ message: "Internal server error." })
    }
})
