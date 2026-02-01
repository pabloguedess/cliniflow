import { Resend } from 'resend'

export async function sendCodeEmail(to: string, code: string, subject: string) {
  // DEV fallback: se não configurar, pelo menos você testa
  if (!process.env.RESEND_API_KEY) {
    console.log(`[EMAIL DEV] Para: ${to} | ${subject} | Código: ${code}`)
    return
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  await resend.emails.send({
    from: process.env.MAIL_FROM || 'CliniFlow <onboarding@resend.dev>',
    to,
    subject,
    html: `
      <div style="font-family:Arial;line-height:1.6">
        <h2>${subject}</h2>
        <p>Seu código é:</p>
        <div style="font-size:26px;font-weight:700;letter-spacing:4px">${code}</div>
        <p>Esse código expira em 15 minutos.</p>
      </div>
    `,
  })
}
