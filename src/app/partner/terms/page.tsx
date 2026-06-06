import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terma Rakan Kongsi — Beepme.pro',
  description: 'Terma & Syarat Program Rakan Kongsi (Affiliate) Beepme.pro. Sila baca sebelum menyertai.',
}

export default function PartnerTermsPage() {
  const clauses = [
    {
      num: '1',
      title: 'Definisi',
      content: '"Beepme.pro" merujuk kepada platform pager digital layan-diri dan pemiliknya. "Rakan Kongsi" merujuk kepada individu atau entiti yang telah diluluskan secara rasmi oleh Admin Beepme.pro untuk menyertai Program Rakan Kongsi. "Merchant" merujuk kepada pemilik kedai F&B atau perniagaan yang mendaftar dan melanggan Beepme.pro melalui pautan rujukan Rakan Kongsi.'
    },
    {
      num: '2',
      title: 'Status Kontraktor Bebas (Independent Contractor)',
      content: 'Rakan Kongsi adalah kontraktor bebas dan bukan pekerja, ejen rasmi, rakan kongsi perniagaan, atau wakil undang-undang Beepme.pro. Tiada hubungan pekerjaan, syarikat usaha sama, atau perkongsian wujud antara Rakan Kongsi dan Beepme.pro. Rakan Kongsi bertanggungjawab sepenuhnya ke atas cukai pendapatan (LHDN), KWSP, dan segala liabiliti cukai peribadi mereka sendiri yang timbul daripada komisen yang diterima.'
    },
    {
      num: '3',
      title: 'Kadar Komisen & Syarat Pembayaran',
      content: 'Rakan Kongsi layak menerima komisen sebanyak 30% (tiga puluh peratus) daripada jumlah bersih langganan Premium yang berjaya diterima oleh Beepme.pro daripada Merchant yang dirujuk. Komisen hanya akan dikira berdasarkan transaksi yang berstatus "claimable" (selepas tempoh penahanan 14 hari dari tarikh bayaran Merchant). Had minimum pengeluaran komisen ialah RM100.00. Pembayaran komisen akan dibuat pada awal bulan berikutnya melalui pindahan bank kepada akaun yang didaftarkan.'
    },
    {
      num: '4',
      title: 'Hak Mengubah Terma & Menamatkan Akaun',
      content: 'Beepme.pro berhak mengubah suai kadar komisen, harga langganan Merchant, atau mana-mana terma dalam perjanjian ini pada bila-bila masa dengan notis minima 30 hari kepada Rakan Kongsi aktif. Beepme.pro juga berhak menamatkan akaun Rakan Kongsi serta-merta tanpa notis sekiranya berlaku sebarang penipuan, spam, atau pelanggaran terma ini. Sebarang komisen yang telah berstatus "claimable" sebelum penamatan akan tetap dibayar.'
    },
    {
      num: '5',
      title: 'Larangan Keras (Prohibited Activities)',
      content: 'Rakan Kongsi dilarang sama sekali daripada: (i) Pendaftaran diri sendiri (self-referral) — mendaftar akaun Merchant menggunakan pautan rujukan sendiri, (ii) Menghantar spam e-mel, SMS, atau mesej tidak diminta kepada prospek, (iii) Membuat sebarang tuntutan palsu atau menipu tentang ciri-ciri atau harga Beepme.pro, (iv) Membida kata kunci carian berbayar (Google Ads/TikTok Ads) menggunakan nama tanda dagangan "Beepme" atau "Beepme.pro", dan (v) Membuat representasi bahawa mereka adalah pekerja atau wakil rasmi Beepme.pro. Pelanggaran mana-mana larangan ini akan mengakibatkan pembatalan serta-merta semua komisen terkumpul dan penamatan akaun.'
    },
    {
      num: '6',
      title: 'Klausa Keaktifan (Activity Requirement)',
      content: 'Untuk mengekalkan status Rakan Kongsi Aktif dan kadar komisen penuh (30%), Rakan Kongsi dikehendaki merujuk sekurang-kurangnya satu (1) Merchant Premium baharu dalam tempoh setiap enam (6) bulan. Kegagalan memenuhi syarat ini memberi Beepme.pro hak untuk mengurangkan kadar komisen kepada 15% atau menggantung akaun Rakan Kongsi sehingga keperluan aktiviti dipenuhi.'
    },
    {
      num: '7',
      title: 'Had Liabiliti (Limitation of Liability)',
      content: 'Beepme.pro disediakan "seperti adanya" (as-is). Beepme.pro tidak bertanggungjawab ke atas: (i) Sebarang kerugian kewangan atau kehilangan pendapatan yang dialami oleh Rakan Kongsi akibat masa henti pelayan, perubahan harga, atau perubahan ciri produk, (ii) Sebarang tuntutan pihak ketiga yang timbul daripada taktik pemasaran Rakan Kongsi, dan (iii) Ketidakupayaan untuk menyampaikan notifikasi disebabkan masalah teknikal di luar kawalan Beepme.pro.'
    },
    {
      num: '8',
      title: 'Ganti Rugi (Indemnification)',
      content: 'Rakan Kongsi bersetuju untuk membela, menanggung rugi, dan mempertahankan Beepme.pro dan pemiliknya daripada dan terhadap sebarang tuntutan, kerugian, liabiliti, ganti rugi, kos, dan perbelanjaan (termasuk yuran guaman) yang munasabah yang timbul daripada: (i) Pelanggaran terma ini oleh Rakan Kongsi, (ii) Salah laku atau kecuaian Rakan Kongsi, atau (iii) Sebarang tuntutan daripada pihak ketiga berkaitan aktiviti pemasaran Rakan Kongsi.'
    },
    {
      num: '9',
      title: 'Perlindungan Data Peribadi (PDPA 2010)',
      content: 'Rakan Kongsi dengan ini memberikan kebenaran kepada Beepme.pro untuk memproses data peribadi mereka (termasuk Nama Penuh, Nombor Kad Pengenalan/SSM, Butiran Akaun Bank, dan Maklumat Hubungan) semata-mata untuk tujuan pengurusan komisen, pembayaran, dan kepatuhan cukai LHDN (Borang CP58). Beepme.pro tidak akan mendedahkan atau menjual data peribadi Rakan Kongsi kepada pihak ketiga untuk tujuan pemasaran. Rakan Kongsi berhak mengakses, membetulkan, atau memohon pemadaman data mereka dengan menghubungi support@beepme.pro.'
    },
    {
      num: '10',
      title: 'Undang-undang Pentadbiran',
      content: 'Perjanjian ini ditadbir oleh undang-undang Malaysia. Sebarang pertikaian yang timbul daripada atau berkaitan dengan perjanjian ini hendaklah diselesaikan melalui rundingan suci hati antara kedua-dua pihak terlebih dahulu. Jika gagal diselesaikan, pihak-pihak bersetuju untuk merujuk pertikaian kepada bidang kuasa eksklusif mahkamah Malaysia.'
    }
  ]

  return (
    <div className="min-h-screen bg-[#020203] text-slate-200 font-sans">
      <div className="fixed top-[-20%] right-[-10%] w-[50%] h-[50%] bg-violet-600/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-3xl mx-auto px-6 py-16 md:py-24 relative z-10">
        {/* Back */}
        <Link href="/partner" className="inline-flex items-center gap-2 text-slate-500 hover:text-white text-xs font-bold uppercase tracking-widest mb-12 transition-colors">
          ← Kembali ke Program Rakan Kongsi
        </Link>

        {/* Header */}
        <div className="mb-12">
          <span className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.4em]">Beepme.pro — Versi 1.0</span>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mt-2 mb-4">
            Terma & Syarat<br />Rakan Kongsi
          </h1>
          <p className="text-slate-500 text-sm">
            Dikemas kini: Jun 2026 · Sila baca dengan teliti sebelum menyertai program ini.
          </p>
        </div>

        {/* Important callout */}
        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 mb-10">
          <p className="text-amber-400 text-sm font-bold">⚠️ Penting</p>
          <p className="text-slate-400 text-xs mt-1">Dengan menyertai Program Rakan Kongsi Beepme.pro (sama ada melalui borang WhatsApp atau persetujuan bertulis), anda dianggap telah membaca, memahami, dan bersetuju dengan semua terma dan syarat di bawah ini sepenuhnya.</p>
        </div>

        {/* Clauses */}
        <div className="space-y-8">
          {clauses.map((clause) => (
            <div key={clause.num} className="border-b border-white/5 pb-8 last:border-0">
              <div className="flex items-start gap-4">
                <span className="text-indigo-500/40 font-black text-2xl font-mono mt-0.5">{clause.num.padStart(2, '0')}</span>
                <div>
                  <h2 className="text-base font-black text-white mb-3 tracking-tight">{clause.title}</h2>
                  <p className="text-slate-400 text-sm leading-relaxed">{clause.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-white/5">
          <div className="p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 text-center">
            <p className="text-white font-black mb-2">Ingin Menyertai Program Rakan Kongsi?</p>
            <p className="text-slate-400 text-sm mb-4">Hubungi kami melalui WhatsApp untuk memulakan proses pendaftaran manual anda.</p>
            <a
              href={`https://wa.me/60194696158?text=${encodeURIComponent('Salam Admin Beepme.pro! Saya berminat untuk menyertai Program Rakan Kongsi. Saya telah membaca dan bersetuju dengan Terma & Syarat. Nama saya: [NAMA]. Kod yang saya mahukan: [KOD].')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-black text-sm hover:bg-indigo-500 transition-all active:scale-95"
            >
              Hubungi Admin via WhatsApp
            </a>
          </div>
          <p className="text-center text-slate-600 text-[10px] uppercase tracking-widest mt-8">© 2026 Beepme.pro — Hak Cipta Terpelihara</p>
        </div>
      </div>
    </div>
  )
}
