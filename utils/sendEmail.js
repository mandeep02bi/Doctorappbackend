const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: { rejectUnauthorized: false },
});

const sendEmail = async (to, subject, otp) => {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333; text-align: center;">VimPal Smart Clinic</h2>
            <hr style="border: 1px solid #eee;" />
            <p style="font-size: 16px; color: #555;">Your verification code is:</p>
            <div style="text-align: center; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; color: #2c3e50; letter-spacing: 8px; background: #f0f0f0; padding: 12px 24px; border-radius: 8px;">${otp}</span>
            </div>
            <p style="font-size: 14px; color: #888;">This code will expire in 10 minutes. Do not share it with anyone.</p>
            <hr style="border: 1px solid #eee;" />
            <p style="font-size: 12px; color: #aaa; text-align: center;">VimPal Smart Clinic &copy; ${new Date().getFullYear()}</p>
        </div>
    `;

    await transporter.sendMail({
        from: `"VimPal Smart Clinic" <${process.env.EMAIL_USER}>`,
        replyTo: process.env.EMAIL_USER,
        to,
        subject,
        html,
        headers: {
            'X-Priority': '3',
            'X-Mailer': 'VimPal Smart Clinic',
        },
    });
};

module.exports = sendEmail;
