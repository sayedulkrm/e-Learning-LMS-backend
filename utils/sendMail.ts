import { Transporter, createTransport } from "nodemailer";

import ejs from "ejs";
import fs from "fs";

import path from "path";
import ErrorHandler from "./errorHandler";
import { NextFunction } from "express";

interface IEmailOptions {
    email: string;
    subject: string;
    templete: string;
    data: {
        [key: string]: any;
    };
}

const sendMail = async (options: IEmailOptions): Promise<void> => {
    const transporter: Transporter = createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        service: process.env.SMTP_SERVICE,
        auth: {
            user: process.env.SMTP_MAIL,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    const { email, subject, templete, data } = options;

    // Get the path of the templete file

    const templetePath = path.join(__dirname, "../mails", templete);

    // Render the email template

    const html: string = await ejs.renderFile(templetePath, data);

    const mailOptions = {
        from: process.env.SMTP_MAIL,
        to: email,
        subject,
        html,
    };

    await transporter.sendMail(mailOptions);
};

export default sendMail;
