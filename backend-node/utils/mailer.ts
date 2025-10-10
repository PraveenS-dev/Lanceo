import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

transporter.verify((err, success) => {
    if (err) console.error("Mailer error:", err);
    else console.log("Mailer ready");
});

export const sendMail = async (to: string[] | string, subject: string, html: string) => {
    try {
        const recipients = Array.isArray(to) ? to.join(",") : to;

        const info = await transporter.sendMail({
            from: `${process.env.APP_NAME} <${process.env.SMTP_USER}>`,
            to: recipients,
            subject,
            html,
        });

        console.log("Email sent:", info.messageId);
    } catch (err) {
        console.error("Email error:", err);
    }
};