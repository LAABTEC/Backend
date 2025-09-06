const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const admin = require("firebase-admin");

// Inicializa Firebase Admin con variables de entorno
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_BUCKET
});

const app = express();
app.use(cors());
app.use(express.json({ limit: "25mb" })); // acepta JSON con base64 grande

// Config Nodemailer con Gmail App Password
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

// Endpoint para enviar el PDF
app.post("/send-report", async (req, res) => {
  try {
    const { email, filePath, base64 } = req.body;

    if (!email) return res.status(400).send({ error: "Falta email" });

    let buffer;
    if (base64) {
      // Si recibo PDF en base64 directo desde la app
      buffer = Buffer.from(base64, "base64");
    } else if (filePath) {
      // Si recibo path en Firebase Storage
      const [fileBuffer] = await admin.storage().bucket().file(filePath).download();
      buffer = fileBuffer;
    } else {
      return res.status(400).send({ error: "Falta filePath o base64" });
    }

    await transporter.sendMail({
      from: `"Campo App" <${process.env.GMAIL_EMAIL}>`,
      to: email,
      subject: "Reporte de Campo App",
      html: `<p>Adjuntamos su reporte generado en <strong>Campo App</strong>.</p>`,
      attachments: [
        {
          filename: "reporte.pdf",
          content: buffer
        }
      ]
    });

    res.send({ ok: true, message: "Correo enviado" });
  } catch (e) {
    console.error("Error al enviar:", e);
    res.status(500).send({ error: "No se pudo enviar" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor corriendo en puerto", PORT));
