import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Polisi Privasi — Beepme.pro',
  description: 'Dasar Privasi Beepme.pro di bawah Akta Perlindungan Data Peribadi 2010 (PDPA) Malaysia.',
}

export default function PrivacyPage() {
  const sections = [
    {
      title: '1. Siapakah Kami?',
      content: 'Beepme.pro adalah sistem pager digital layan-diri untuk perniagaan F&B di Malaysia. Pengendali data peribadi bagi tujuan Akta Perlindungan Data Peribadi 2010 (PDPA) adalah pemilik sistem Beepme.pro.'
    },
    {
      title: '2. Data yang Kami Kumpul',
      content: null,
      subsections: [
        {
          subtitle: 'A. Pelanggan Kedai (Customer — yang scan QR Pager)',
          text: 'Kami TIDAK mengumpul sebarang data peribadi daripada pelanggan kedai yang menggunakan pager digital Beepme. Sistem hanya menggunakan pengecam peranti rawak (client UUID) yang tersimpan di dalam pelayar web (browser) anda untuk mengaitkan sesi giliran anda dengan kedai berkenaan. Tiada Nama, E-mel, Nombor Telefon, atau Nombor Kad Pengenalan dikumpul.'
        },
        {
          subtitle: 'B. Pemilik Kedai (Merchant)',
          text: 'Apabila mendaftar akaun Beepme.pro, kami mengumpul: (i) Nama kedai, (ii) Alamat e-mel, (iii) Nombor telefon (pilihan). Maklumat pembayaran (kad kredit/FPX) diproses sepenuhnya oleh Stripe atau ToyyibPay yang mematuhi piawaian PCI-DSS. Beepme.pro TIDAK menyimpan maklumat kad kredit secara langsung.'
        },
        {
          subtitle: 'C. Rakan Kongsi Affiliate (Partner)',
          text: 'Untuk tujuan pembayaran komisen, kami mengumpul: (i) Nama penuh, (ii) Nombor Kad Pengenalan (IC) atau Nombor Pendaftaran Syarikat (SSM), (iii) Alamat surat-menyurat, dan (iv) Butiran akaun bank. Maklumat ini diproses semata-mata untuk tujuan pembayaran komisen dan kepatuhan cukai LHDN (Borang CP58).'
        }
      ]
    },
    {
      title: '3. Cara Kami Menggunakan Data Anda',
      content: 'Data peribadi yang dikumpul digunakan untuk: (i) Menyediakan dan menguruskan perkhidmatan Beepme.pro, (ii) Memproses pembayaran langganan dan komisen, (iii) Menghantar notifikasi berkaitan perkhidmatan, dan (iv) Mematuhi keperluan undang-undang Malaysia (LHDN, PDPA 2010). Kami TIDAK menjual atau berkongsi data peribadi anda kepada pihak ketiga untuk tujuan pemasaran.'
    },
    {
      title: '4. Penyimpanan & Keselamatan Data',
      content: 'Data peribadi disimpan dengan selamat menggunakan perkhidmatan Supabase (PostgreSQL dengan Row Level Security). Akses kepada data peribadi adalah terhad hanya kepada pengguna yang sah dan pentadbir sistem. Kami menggunakan enkripsi HTTPS untuk semua komunikasi data.'
    },
    {
      title: '5. Hak Anda di Bawah PDPA 2010',
      content: 'Anda berhak untuk: (i) Mengakses data peribadi anda yang kami simpan, (ii) Membetulkan data peribadi yang tidak tepat, (iii) Memohon pemadaman data peribadi anda (tertakluk kepada keperluan undang-undang), dan (iv) Menarik balik kebenaran pemprosesan data pada bila-bila masa. Untuk membuat sebarang permohonan berkaitan data peribadi, sila hubungi kami.'
    },
    {
      title: '6. Perubahan Dasar Privasi',
      content: 'Kami berhak mengemas kini Dasar Privasi ini dari semasa ke semasa. Sebarang perubahan material akan dimaklumkan melalui e-mel atau notis di dalam aplikasi. Penggunaan berterusan perkhidmatan Beepme.pro selepas perubahan tersebut dikuatkuasakan merupakan penerimaan anda terhadap dasar yang dikemas kini.'
    },
    {
      title: '7. Hubungi Kami',
      content: 'Untuk sebarang pertanyaan berkaitan Dasar Privasi atau permohonan data peribadi di bawah PDPA 2010, sila hubungi kami di: support@beepme.pro'
    }
  ]

  return (
    <div className="min-h-screen bg-[#020203] text-slate-200 font-sans">
      {/* Bg glow */}
      <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-3xl mx-auto px-6 py-16 md:py-24 relative z-10">
        {/* Back */}
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-white text-xs font-bold uppercase tracking-widest mb-12 transition-colors">
          ← Kembali ke Beepme.pro
        </Link>

        {/* Header */}
        <div className="mb-12">
          <span className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.4em]">Beepme.pro</span>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mt-2 mb-4">
            Polisi Privasi
          </h1>
          <p className="text-slate-500 text-sm">
            Dikemas kini: Jun 2026 · Di bawah Akta Perlindungan Data Peribadi 2010 (PDPA) Malaysia
          </p>
        </div>

        {/* Callout */}
        <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 mb-10">
          <p className="text-emerald-400 text-sm font-bold">✅ Pelanggan Pager: Tiada Data Peribadi Dikumpul</p>
          <p className="text-slate-400 text-xs mt-1">Jika anda hanya menggunakan pager digital Beepme di sesebuah kedai, kami tidak mengumpul sebarang data peribadi anda.</p>
        </div>

        {/* Sections */}
        <div className="space-y-10">
          {sections.map((section, i) => (
            <div key={i} className="border-b border-white/5 pb-10 last:border-0">
              <h2 className="text-lg font-black text-white mb-4 tracking-tight">{section.title}</h2>
              {section.content && (
                <p className="text-slate-400 text-sm leading-relaxed">{section.content}</p>
              )}
              {section.subsections && (
                <div className="space-y-5 mt-4">
                  {section.subsections.map((sub, j) => (
                    <div key={j} className="pl-4 border-l-2 border-indigo-500/30">
                      <p className="text-indigo-400 text-xs font-black uppercase tracking-widest mb-2">{sub.subtitle}</p>
                      <p className="text-slate-400 text-sm leading-relaxed">{sub.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-white/5 text-center">
          <p className="text-slate-600 text-[10px] uppercase tracking-widest">© 2026 Beepme.pro — Hak Cipta Terpelihara</p>
          <div className="flex justify-center gap-6 mt-3">
            <Link href="/partner/terms" className="text-slate-600 hover:text-slate-400 text-[10px] uppercase tracking-widest transition-colors">Terma Rakan Kongsi</Link>
            <Link href="/partner" className="text-slate-600 hover:text-slate-400 text-[10px] uppercase tracking-widest transition-colors">Program Affiliate</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
