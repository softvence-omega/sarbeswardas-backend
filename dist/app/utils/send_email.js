"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const sendEmail = (to, subject, html) => __awaiter(void 0, void 0, void 0, function* () {
    const port = Number(process.env.SMTP_PORT) || 587;
    const secure = port === 465; // true for 465, false for other ports
    // 1️⃣ Create transporter
    const transporter = nodemailer_1.default.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        tls: {
            rejectUnauthorized: false, // Helps with self-signed certs in dev/some hosts
        },
    });
    try {
        // 2️⃣ Send the email
        const info = yield transporter.sendMail({
            from: `"Sarbeswar Das" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html,
            // replyTo: process.env.SMTP_USER
        });
        // console.log("📧 Email sent: %s", info.messageId);
        return info;
    }
    catch (error) {
        console.error("❌ Error sending email:", error);
        // Don't throw if you don't want to break the flow, but usually good to know
        // throw error; 
    }
});
exports.sendEmail = sendEmail;
