const nodemailer = require('nodemailer');

// Create a Nodemailer transporter
const transporter = nodemailer.createTransport({
    host: 'smtp.zoho.com',
    port: 465,
    secure: true,
    auth: {
        user: 'urbanmarket8@gmail.com',
        pass: 'BLgRf30vvevb',
    },
});

const sendVerificationEmail = async (email, verifyToken) => {
    const mailOptions = {
        from: 'urbanmarket8@gmail.com',
        to: email,
        subject: 'Verify Your Email - VT Bazaar',
        html: `
            <p>Dear user,</p>
            <p>Thank you for choosing VT Bazaar. To complete your registration and enhance the security of your account, please click the link below to verify your email address:</p>
            <p><a href="http://localhost:8080/api/v1/auth/verify/${verifyToken}">Verify Your Email Address</a></p>
            <p>If you did not sign up for an account on VT Bazaar, please ignore this email.</p>
            <p>Best regards,</p>
            <p>The VT Bazaar Team</p>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending verification email:', error);
    }
};
module.exports = sendVerificationEmail;