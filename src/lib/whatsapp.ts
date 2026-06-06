/**
 * WhatsApp notification utility for Beepme.pro
 * 
 * Currently uses direct wa.me links as a lightweight fallback.
 * Future: Integrate with Fonnte / Watasap API using WHATSAPP_API_KEY env var.
 */

const GMB_FREE_LIMIT = 30

/**
 * Sends a WhatsApp alert to the merchant's registered phone number.
 * Uses the same wa.me number already used throughout the dashboard.
 * 
 * NOTE: In production, replace the server-side console.log with a real
 * WhatsApp Business API call (Fonnte, Watasap, etc.) using:
 *   process.env.WHATSAPP_API_KEY
 *   process.env.WHATSAPP_API_URL
 */
export async function sendWhatsAppAlert(
  phone: string,
  merchantName: string,
  currentClicks: number,
  type: '80' | '100'
): Promise<void> {
  const message =
    type === '80'
      ? `Hai ${merchantName}! 👋\n\nKuota Google Review percuma anda di Beepme.pro hampir penuh.\n\n✅ Digunakan: ${currentClicks} / ${GMB_FREE_LIMIT} klik\n\nNaik taraf ke Premium (RM49/bulan) sekarang untuk ulasan Google tanpa had sepanjang masa!\n\n👉 https://beepme.pro`
      : `Hai ${merchantName}! 🔴\n\nKuota Google Review percuma anda telah HABIS untuk bulan ini.\n\n⛔ Digunakan: ${currentClicks} / ${GMB_FREE_LIMIT} klik\n\nPelanggan anda tidak lagi dapat melihat butang ulasan Google sehingga bulan hadapan, ATAU anda naik taraf ke Premium (RM49/bulan) untuk ulasan tanpa had!\n\n👉 https://beepme.pro`

  // --- Production integration point ---
  // Uncomment and configure when WhatsApp API is available:
  //
  // const res = await fetch(process.env.WHATSAPP_API_URL!, {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${process.env.WHATSAPP_API_KEY}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({ target: phone, message }),
  // })
  // if (!res.ok) throw new Error('WhatsApp send failed: ' + await res.text())

  // For now: log to server console (visible in Vercel/server logs)
  console.log(`[GMB ALERT ${type}%] → ${phone} | ${merchantName} | ${currentClicks}/${GMB_FREE_LIMIT} clicks`)
  console.log(`[GMB ALERT MESSAGE] ${message}`)
}
