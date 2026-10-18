import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { nombre, telefono, codigo } = await request.json();

    if (!nombre || !telefono || !codigo) {
      return NextResponse.json({ error: 'Faltan campos' }, { status: 400 });
    }

    const telefonoLimpio = telefono.replace(/\D/g, '');
    const apiUbuntu = process.env.NEXT_PUBLIC_API_UBUNTU;
    const googleDriveUrl = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_URL;

    if (!googleDriveUrl) {
      return NextResponse.json({ error: 'Configuración incompleta' }, { status: 500 });
    }

    // Validar código en la API de Ubuntu - REQUIRED
    if (!apiUbuntu) {
      return NextResponse.json({ error: 'API no configurada' }, { status: 500 });
    }

    try {
      const validationResponse = await fetch(`${apiUbuntu}/api/validar_afiliado`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo }),
      });

      // Validación estricta: debe ser exitosa
      if (!validationResponse.ok) {
        console.error('Código rechazado por API:', validationResponse.status);
        return NextResponse.json({ error: 'Código de afiliado no disponible' }, { status: 400 });
      }

      const validationData = await validationResponse.json();

      // Verificar que el código esté disponible en la respuesta
      if (!validationData.disponible) {
        return NextResponse.json({ error: 'Código no está disponible' }, { status: 400 });
      }
    } catch (validateError) {
      console.error('Error conectando con API Ubuntu:', validateError);
      return NextResponse.json({ error: 'No se pudo validar el código' }, { status: 400 });
    }

    // Mensaje de bienvenida - solo llega aquí si validación fue exitosa
    const mensajeBienvenida = `¡Hola ${nombre}! 🚀 Soy Sofía, asistente de BK Electronics. Tu solicitud de embajador fue recibida. Tu código oficial es: ${codigo}. Aquí tienes tu acceso al material: ${googleDriveUrl} ¡Cualquier duda, escríbeme!`;

    const metaPhoneId = process.env.META_PHONE_ID;
    const metaAccessToken = process.env.META_ACCESS_TOKEN;

    if (!metaPhoneId || !metaAccessToken) {
      return NextResponse.json({ error: 'Config incompleta' }, { status: 500 });
    }

    const metaResponse = await fetch(
      `https://graph.facebook.com/v17.0/${metaPhoneId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${metaAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: telefonoLimpio,
          type: 'text',
          text: { body: mensajeBienvenida },
        }),
      }
    );

    if (!metaResponse.ok) {
      const errorText = await metaResponse.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { raw: errorText };
      }
      console.error('Error Meta API:', errorData);
      return NextResponse.json({ error: 'Error WhatsApp' }, { status: metaResponse.status });
    }

    const metaData = await metaResponse.json();

    return NextResponse.json(
      { success: true, messageId: metaData.messages?.[0]?.id },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
