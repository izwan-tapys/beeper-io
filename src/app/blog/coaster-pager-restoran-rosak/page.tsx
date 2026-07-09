import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, CheckCircle, HelpCircle, XCircle, AlertTriangle, Play, Zap } from 'lucide-react'
import { Logo } from '@/components/Logo'

export const metadata: Metadata = {
  title: "Coaster Pager Restoran Selalu Rosak & Hilang? Cara Ganti Secara Percuma | Beepme",
  description: "Bandingkan kos coaster pager restoran fizikal vs sistem QR pager maya Beepme.pro. Ketahui cara mengurangkan kos perkakasan F&B di Malaysia kepada RM0.",
  alternates: {
    canonical: "https://beepme.pro/blog/coaster-pager-restoran-rosak",
  },
}

export default function BlogPost() {
  return (
    <div className="min-h-screen bg-[#020203] text-slate-300 font-sans selection:bg-indigo-500/30 selection:text-white pb-24">
      {/* Header */}
      <header className="border-b border-white/5 py-4 bg-black/30 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
          <Link href="/blog" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={14} /> Blog
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <Logo size={28} />
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-6 pt-12 md:pt-16">
        {/* Category & Date */}
        <div className="flex items-center gap-3 mb-6">
          <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
            Panduan F&B
          </span>
          <span className="text-slate-500 text-xs font-medium">Julai 10, 2026</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight mb-8">
          Coaster Pager Restoran Selalu Rosak & Hilang? Cara Ganti Secara Percuma Dengan Aplikasi QR
        </h1>

        {/* Hero Image */}
        <div className="relative aspect-video w-full rounded-[32px] overflow-hidden border border-white/5 bg-white/[0.02] mb-12 shadow-2xl">
          <Image 
            src="/pager-comparison.png" 
            alt="Perbandingan coaster pager fizikal restoran vs sistem QR pager maya Beepme"
            fill
            priority
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>

        {/* Content Body */}
        <article className="prose prose-invert prose-slate max-w-none text-sm md:text-base leading-relaxed space-y-6 text-slate-400">
          <p>
            Sebagai pemilik restoran, kafe, atau trak makanan (food truck) di Malaysia, anda pasti tahu betapa pentingnya sistem panggilan makanan untuk mengelakkan barisan pelanggan yang panjang di kaunter. 
          </p>
          <p>
            Namun, alat yang paling kerap digunakan — iaitu <strong className="text-white font-bold">coaster pager fizikal</strong> — sering kali menjadi punca sakit kepala yang berterusan.
          </p>

          {/* Section 1 */}
          <h2 className="text-xl md:text-2xl font-bold text-white pt-6 tracking-tight">
            Kenapa Coaster Pager Fizikal Menyusahkan Pengusaha F&B?
          </h2>
          <p>
            Jika anda pernah atau sedang menggunakan pager fizikal, anda pasti biasa dengan situasi di bawah:
          </p>
          <ul className="space-y-3 list-none pl-0">
            <li className="flex items-start gap-3">
              <XCircle size={18} className="text-rose-500 shrink-0 mt-1" />
              <span><strong className="text-white font-semibold">Bateri Cepat Kong:</strong> Selepas 6-12 bulan, kapasiti bateri pager mula merosot. Pager yang tidak dicas penuh akan mati separuh jalan sebelum sempat pelanggan dipanggil.</span>
            </li>
            <li className="flex items-start gap-3">
              <XCircle size={18} className="text-rose-500 shrink-0 mt-1" />
              <span><strong className="text-white font-semibold">Pelanggan Bawa Balik / Hilang:</strong> Pelanggan terlupa memulangkan pager, membawa pulang ke rumah, atau ia hilang secara misteri. Penggantian unit baru amat leceh.</span>
            </li>
            <li className="flex items-start gap-3">
              <XCircle size={18} className="text-rose-500 shrink-0 mt-1" />
              <span><strong className="text-white font-semibold">Jarak Isyarat Terhad:</strong> Pager fizikal menggunakan gelombang radio RF yang mudah disekat oleh dinding tebal, menyebabkan pelanggan terlepas panggilan jika mereka duduk terlalu jauh.</span>
            </li>
            <li className="flex items-start gap-3">
              <XCircle size={18} className="text-rose-500 shrink-0 mt-1" />
              <span><strong className="text-white font-semibold">Masalah Kebersihan:</strong> Pager fizikal bertukar tangan beratus kali sehari. Ia sukar dibersihkan dengan sempurna dan boleh kelihatan kotor.</span>
            </li>
          </ul>

          {/* Section 2 */}
          <h2 className="text-xl md:text-2xl font-bold text-white pt-6 tracking-tight">
            Kajian Kos Sebenar Pager Fizikal di Malaysia
          </h2>
          <p>
            Berapakah kos sebenar yang anda belanjakan untuk perkakasan pager fizikal? Mari kita lihat realiti pasaran di Malaysia hari ini:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
            <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
              <h3 className="text-white font-bold mb-2 text-sm uppercase tracking-wider text-rose-400">Set Murah Shopee (China Import)</h3>
              <p className="text-2xl font-black text-white mb-2">RM150 – RM500</p>
              <p className="text-xs text-slate-500 leading-normal">
                Murah di awal pembelian (biasanya 8–16 pager), tetapi menggunakan plastik gred rendah, pin pengecas cepat patah, jarak isyarat lemah, dan tiada waranti/sokongan tempatan.
              </p>
            </div>
            <div className="p-6 rounded-2xl border border-indigo-500/10 bg-white/[0.02]">
              <h3 className="text-white font-bold mb-2 text-sm uppercase tracking-wider text-indigo-400">Set Komersial Profesional (Local Supplier)</h3>
              <p className="text-2xl font-black text-white mb-2">RM800 – RM2,500+</p>
              <p className="text-xs text-slate-500 leading-normal">
                Didatangkan dengan 16–20 pager tahan lasak dan waranti tempatan. Namun, pelaburan awal (Capex) adalah sangat besar untuk kedai makan yang baru bermula.
              </p>
            </div>
          </div>
          
          <p className="bg-rose-950/20 border border-rose-500/10 rounded-2xl p-4 text-xs text-rose-300 flex gap-3 items-start">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <span>
              <strong>Kos Tersembunyi:</strong> Setiap kali satu coaster pager hilang atau pecah, anda perlu membelanjakan <strong>RM40 hingga RM150 per unit</strong> untuk menggantikannya. Kos ini terus bertambah dari tahun ke tahun.
            </span>
          </p>

          {/* Section 3 */}
          <h2 className="text-xl md:text-2xl font-bold text-white pt-6 tracking-tight">
            Penyelesaian Moden: Tukar Kepada Pager Maya (Virtual QR Pager)
          </h2>
          <p>
            Kenapa perlu beli perkakasan mahal jika pelanggan anda sudah mempunyai skrin canggih di dalam poket mereka?
          </p>
          <p>
            <strong className="text-white font-bold">Beepme.pro</strong> menggantikan coaster pager fizikal sepenuhnya dengan penyelesaian berasaskan web. Pelanggan hanya perlu mengimbas kod QR unik pada resit atau kaunter mereka menggunakan telefon pintar. Telefon mereka kini menjadi pager peribadi mereka!
          </p>

          {/* Section 4 */}
          <h2 className="text-xl md:text-2xl font-bold text-white pt-6 tracking-tight">
            Jadual Perbandingan: Pager Fizikal vs Beepme.pro
          </h2>
          <p>
            Mari kita bandingkan secara terperinci untuk melihat pilihan mana yang paling menjimatkan dan berkesan untuk restoran anda:
          </p>

          {/* Interactive Table */}
          <div className="overflow-x-auto my-6 border border-white/5 rounded-2xl bg-white/[0.01]">
            <table className="w-full text-left text-xs md:text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="p-4 font-bold text-white">Ciri-ciri</th>
                  <th className="p-4 font-bold text-slate-400">Coaster Pager Fizikal</th>
                  <th className="p-4 font-bold text-indigo-400 bg-indigo-500/5">Beepme.pro (Pager Maya)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/5">
                  <td className="p-4 font-semibold text-white">Kos Setup Awal</td>
                  <td className="p-4">RM150 – RM2,500+</td>
                  <td className="p-4 font-bold text-indigo-400 bg-indigo-500/5">RM0 (Percuma Selamanya)</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="p-4 font-semibold text-white">Kos Gantian Unit Hilang</td>
                  <td className="p-4">RM40 – RM150 / unit</td>
                  <td className="p-4 font-bold text-indigo-400 bg-indigo-500/5">RM0 (Tiada perkakasan boleh hilang)</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="p-4 font-semibold text-white">Jarak Isyarat Panggilan</td>
                  <td className="p-4">Terhad (100m - 300m)</td>
                  <td className="p-4 font-bold text-indigo-400 bg-indigo-500/5">Tanpa Had (Boleh tunggu dalam mall/kereta)</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="p-4 font-semibold text-white">Kumpul Google Reviews</td>
                  <td className="p-4 text-rose-500">❌ Tiada fungsi</td>
                  <td className="p-4 font-bold text-indigo-400 bg-indigo-500/5">✅ Automatik (Meningkatkan rating kedai)</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="p-4 font-semibold text-white">Integrasi Loyverse POS</td>
                  <td className="p-4 text-rose-500">❌ Kebanyakan tiada</td>
                  <td className="p-4 font-bold text-indigo-400 bg-indigo-500/5">✅ Sokongan Penuh</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-white">Senggaraan (Maintenance)</td>
                  <td className="p-4">Perlu cas setiap hari, bateri rosak</td>
                  <td className="p-4 font-bold text-indigo-400 bg-indigo-500/5">Tiada penyelenggaraan perkakasan</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 5 */}
          <h2 className="text-xl md:text-2xl font-bold text-white pt-6 tracking-tight">
            Bagaimana Beepme Membantu Memajukan Perniagaan Anda?
          </h2>
          <p>
            Selain menjimatkan kos perkakasan sehingga RM0, Beepme.pro mempunyai kelebihan unik yang tidak dimiliki oleh pager biasa:
          </p>
          <ul className="space-y-4 list-none pl-0">
            <li className="flex items-start gap-3">
              <CheckCircle size={18} className="text-indigo-500 shrink-0 mt-1" />
              <span>
                <strong className="text-white font-semibold">Mengumpul Google Reviews:</strong> Sebaik sahaja pesanan siap dan dipanggil, pelanggan akan diarahkan ke halaman kutipan review. Ini membantu meletakkan restoran anda di kedudukan teratas carian Google Maps tempatan!
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle size={18} className="text-indigo-500 shrink-0 mt-1" />
              <span>
                <strong className="text-white font-semibold">Integrasi Loyverse POS:</strong> Sync secara automatik dengan sistem jualan sedia ada anda. Tiada kemasukan manual berganda.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle size={18} className="text-indigo-500 shrink-0 mt-1" />
              <span>
                <strong className="text-white font-semibold">WhatsApp & Screen WakeLock:</strong> Memastikan pelanggan menerima notifikasi walaupun skrin telefon mereka ditutup.
              </span>
            </li>
          </ul>

          {/* Conclusion */}
          <h2 className="text-xl md:text-2xl font-bold text-white pt-6 tracking-tight">
            Kesimpulan: Masa Untuk Beralih Kepada Sistem Digital
          </h2>
          <p>
            Membeli coaster pager fizikal pada tahun 2026 adalah seperti membeli mesin faks di era e-mel. Teknologi telah bergerak ke hadapan. Dengan menukarkan sistem pager anda kepada Beepme.pro, anda bukan sahaja menjimatkan beribu-ribu Ringgit daripada kos perkakasan dan penggantian, malah meningkatkan operasi dan reputasi digital restoran anda secara serentak.
          </p>
        </article>

        {/* CTA Card */}
        <section className="mt-16 p-8 md:p-12 rounded-[40px] border border-indigo-500/30 bg-gradient-to-br from-indigo-950/20 to-black relative overflow-hidden text-center shadow-2xl">
          <div className="absolute inset-0 bg-indigo-600/5 pointer-events-none" />
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-600/20 animate-pulse">
              <Zap size={24} className="text-white" />
            </div>
            <h2 className="text-2xl md:text-4xl font-black text-white mb-4 tracking-tight">
              Tukar ke Pager Maya Secara Percuma Hari Ini!
            </h2>
            <p className="text-slate-400 text-xs md:text-sm max-w-md mx-auto mb-8 leading-relaxed">
              Dapatkan setup serta-merta untuk restoran anda di Malaysia dalam masa 2 minit. Tiada kontrak, tiada kos tersembunyi.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login" className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-indigo-600 text-white font-black text-sm hover:bg-indigo-500 shadow-xl shadow-indigo-600/20 transition-all active:scale-95">
                Mula Percuma Sekarang
              </Link>
              <Link href="/" className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-sm hover:bg-white/10 transition-all">
                Ketahui Lebih Lanjut
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
