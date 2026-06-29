import { Resend } from 'resend'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const stationLabel: Record<string, string> = {
  dan: 'דן',
  rothschild: 'רוטשילד',
}

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { station, reading_kwh } = req.body ?? {}
  const label = stationLabel[station] ?? station

  try {
    await resend.emails.send({
      from: 'Charge Dashboard <onboarding@resend.dev>',
      to: 'dan.aviam@gmail.com',
      subject: 'קריאת מונה חדשה',
      html: `
        <div dir="rtl" style="font-family: sans-serif; font-size: 15px;">
          <h2 style="margin-bottom: 8px;">קריאת מונה חדשה נרשמה</h2>
          <table style="border-collapse: collapse;">
            <tr>
              <td style="padding: 4px 12px 4px 0; color: #555;">עמדה</td>
              <td style="padding: 4px 0; font-weight: bold;">${label}</td>
            </tr>
            <tr>
              <td style="padding: 4px 12px 4px 0; color: #555;">קריאה</td>
              <td style="padding: 4px 0; font-weight: bold;">${Number(reading_kwh).toLocaleString()} קוט"ש</td>
            </tr>
          </table>
        </div>
      `,
    })

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('notify-reading error:', err)
    return res.status(500).json({ error: 'Failed to send email' })
  }
}
