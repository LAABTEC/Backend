const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
app.use(cors());
app.use(express.json({ limit: "25mb" })); // acepta PDFs en base64

// Validaciones básicas
if (!process.env.GMAIL_EMAIL || !process.env.GMAIL_APP_PASSWORD) {
  console.warn("⚠️ Falta configurar GMAIL_EMAIL o GMAIL_APP_PASSWORD");
}

// Nodemailer (Gmail App Password)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

// Healthcheck
app.get("/", (_, res) => res.send("Campo App backend OK"));

/**
 * POST /send-report
 * body: { email: string, base64: string, subject?: string, html?: string }
 */
app.post("/send-report", async (req, res) => {
  try {
    const { email, base64, subject, html } = req.body;
    if (!email) return res.status(400).json({ error: "Falta email" });
    if (!base64) return res.status(400).json({ error: "Falta base64 del PDF" });

    const buffer = Buffer.from(base64, "base64");

    await transporter.sendMail({
      from: `"Campo App" <${process.env.GMAIL_EMAIL}>`,
      to: email,
      subject: subject || "Reporte de Campo App",
      html: html || `<p>Adjuntamos su reporte generado en <strong>Campo App</strong>.</p>`,
      attachments: [{ filename: "reporte.pdf", content: buffer }]
    });

    res.json({ ok: true, message: "Correo enviado" });
  } catch (e) {
    console.error("Error /send-report:", e);
    res.status(500).json({ error: "No se pudo enviar" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor en puerto", PORT));
