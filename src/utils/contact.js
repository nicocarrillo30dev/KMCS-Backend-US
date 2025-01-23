// backend/server.mjs
import express from 'express'
import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
import cors from 'cors'

// Cargar variables de entorno desde .env
dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL, // URL de tu frontend en Railway
  }),
)
app.use(express.json())

// Ruta POST para manejar el formulario de contacto
app.post('/hola/contact', async (req, res) => {
  const { name, email, subject, message } = req.body

  // Validar los campos
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios.' })
  }

  // Configurar el transporter de nodemailer para iCloud
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST, // smtp.mail.me.com
    port: parseInt(process.env.SMTP_PORT, 10), // 587
    secure: false, // true para puerto 465, false para otros puertos
    auth: {
      user: process.env.SMTP_USER, // tu correo de iCloud
      pass: process.env.SMTP_PASS, // contraseña específica de la aplicación
    },
    tls: {
      // Opcional: Para evitar errores de certificado
      // rejectUnauthorized: false,
    },
    requireTLS: true, // Usar STARTTLS
  })

  // Opciones del correo
  const mailOptions = {
    from: `"${name}" <${email}>`, // Remitente
    to: process.env.RECIPIENT_EMAIL, // Tu correo de iCloud
    subject: subject,
    text: message,
    html: `<p>${message}</p>`,
  }

  try {
    // Verificar la conexión del transporter
    await transporter.verify()
    console.log('Servidor SMTP está listo para enviar correos.')

    // Enviar el correo
    await transporter.sendMail(mailOptions)
    console.log('Correo enviado exitosamente.')

    return res.status(200).json({ message: 'Correo enviado exitosamente.' })
  } catch (error) {
    console.error('Error enviando el correo:', error)
    return res.status(500).json({ message: 'Error enviando el correo.' })
  }
})

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Servidor Express funcionando correctamente.')
})

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor Express escuchando en el puerto ${PORT}`)
})
