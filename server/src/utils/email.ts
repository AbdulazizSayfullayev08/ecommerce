import nodemailer from 'nodemailer';
import { env } from '../config/env';

const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: env.smtp.port === 465,
  auth: {
    user: env.smtp.user,
    pass: env.smtp.pass,
  },
});

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<void> {
  if (!env.smtp.user || !env.smtp.pass) {
    console.warn('[email] SMTP credentials not set — email skipped:', options.to);
    return;
  }

  await transporter.sendMail({
    from: `"Do'kon" <${env.smtp.user}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });
}
