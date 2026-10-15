import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const clean = (v: unknown, max: number) =>
      typeof v === 'string' ? v.replace(/[\r\n]+/g, ' ').trim().slice(0, max) : '';

    // Başlıklara satır sonu enjekte edilmesini engelle ve uzunlukları sınırla
    const name = clean(body?.name, 100).replace(/["<>]/g, '');
    const email = clean(body?.email, 200);
    const subject = clean(body?.subject, 200);
    const message = typeof body?.message === 'string' ? body.message.trim().slice(0, 5000) : '';

    if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, message: 'Geçersiz form verisi.' }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"${name}" <${process.env.EMAIL_USER}>`,
      to: 'pskfurkan.manav@gmail.com',
      replyTo: email,
      subject: `[Web Sitesi İletişim Formu] ${subject}`,
      text: `Ad: ${name}\nE-posta: ${email}\n\nMesaj:\n${message}`,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: 'Email sent successfully!' });
  } catch (error) {
    console.error('Email error:', error);
    return NextResponse.json({ success: false, message: 'Failed to send email.' }, { status: 500 });
  }
}
