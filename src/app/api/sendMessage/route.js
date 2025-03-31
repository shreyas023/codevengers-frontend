import { NextResponse } from 'next/server';

export async function POST(req) {
  const { phone, message } = await req.json();

  if (!phone.startsWith('91') || phone.length !== 12) {
    return NextResponse.json({ error: 'Invalid Indian phone number' }, { status: 400 });
  }

  const whatsappUrl = `https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_ID}/messages`;
  
  const payload = {
    messaging_product: 'whatsapp',
    to: phone,
    type: 'text',
    text: { body: message },
  };

  try {
    const res = await fetch(whatsappUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
