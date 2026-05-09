const nodemailer = require('nodemailer');

// ➕ ADDED: Central mail utility for OTP flow. Uses SMTP env config.
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

exports.sendotpemail = async (toEmail, otp) => {
    // ⚠️ IMPROVED: Graceful fallback when SMTP is not configured in development.
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log(`// ➕ ADDED: OTP fallback (no SMTP configured). Email: ${toEmail}, OTP: ${otp}`);
        return;
    }

    await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: toEmail,
        subject: 'Health App Password Reset OTP',
        text: `Your OTP is ${otp}. It expires in 10 minutes.`,
        html: `<p>Your OTP is <b>${otp}</b>. It expires in 10 minutes.</p>`
    });
};
