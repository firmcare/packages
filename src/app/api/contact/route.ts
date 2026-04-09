import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sendGeneralEmail } from '@/lib/email';

const schema = z.object({
  name:    z.string().min(1).max(100),
  email:   z.string().email(),
  phone:   z.string().min(1).max(30),
  message: z.string().min(1).max(3000),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return new NextResponse('Invalid input', { status: 400 });

  const { name, email, phone, message } = parsed.data;

  const html = `
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
    <p><strong>Phone:</strong> ${phone}</p>
    <hr style="margin:16px 0;border:none;border-top:1px solid #eee" />
    <p style="white-space:pre-wrap">${message}</p>
  `;

  await sendGeneralEmail(
    'info@firmcare.com.ng',
    `Contact Form: ${name}`,
    html,
  );

  return NextResponse.json({ success: true });
}
