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
        subject: 'Verify Your Email',
        html: `<p>Click <a href="http://your-app.com/verify/${verifyToken}">here</a> to verify your email.</p>`,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Verification email sent.');
    } catch (error) {
        console.error('Error sending verification email:', error);
    }
};

module.exports = sendVerificationEmail;