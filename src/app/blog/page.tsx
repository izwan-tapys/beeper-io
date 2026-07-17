import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, BookOpen, Clock, Calendar, ArrowRight } from 'lucide-react'
import { Logo } from '@/components/Logo'

export const metadata: Metadata = {
  title: "Blog & Panduan Pengurusan Restoran F&B Malaysia | Beepme",
  description: "Ketahui tips moden untuk mengurangkan kos operasi F&B, mempercepat sistem giliran makanan, dan alternatif terbaik kepada coaster pager fizikal di Malaysia.",
  alternates: {
    canonical: "https://beepme.pro/blog",
  },
  openGraph: {
    title: "Blog & Panduan Pengurusan Restoran F&B Malaysia | Beepme",
    description: "Ketahui tips moden untuk mengurangkan kos operasi F&B, mempercepat sistem giliran makanan, dan alternatif terbaik kepada coaster pager fizikal di Malaysia.",
    url: "https://beepme.pro/blog",
    siteName: "Beepme",
    images: [
      {
        url: "https://beepme.pro/pager-comparison.png",
        width: 1024,
        height: 1024,
        alt: "Beepme Blog & Resources",
      },
    ],
    locale: "en_MY",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog & Panduan Pengurusan Restoran F&B Malaysia | Beepme",
    description: "Ketahui tips moden untuk mengurangkan kos operasi F&B, mempercepat sistem giliran makanan, dan alternatif terbaik kepada coaster pager fizikal di Malaysia.",
    images: ["https://beepme.pro/pager-comparison.png"],
  },
}

export default function BlogArchive() {
  const articles = [
    {
      title: "Coaster Pager Restoran Selalu Rosak & Hilang? Cara Ganti Secara Percuma Dengan Aplikasi QR",
      desc: "Ketahui bagaimana pemilik restoran F&B di Malaysia beralih daripada perkakasan pager fizikal yang mahal kepada sistem pager maya berasaskan QR secara RM0.",
      slug: "coaster-pager-restoran-rosak",
      date: "Julai 10, 2026",
      readTime: "5 minit bacaan",
      image: "/pager-comparison.png",
      category: "Panduan F&B",
    }
  ]

  return (
    <div className="min-h-screen bg-[#020203] text-slate-200 font-sans selection:bg-indigo-500/30 selection:text-white pb-20">
      {/* Header / Nav */}
      <header className="border-b border-white/5 py-4 bg-black/30 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Logo size={32} />
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={14} /> Kembali Ke Utama
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-12 text-center relative overflow-hidden">
        <div className="absolute top-[-50%] left-[50%] -translate-x-1/2 w-[600px] h-[300px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
            <BookOpen size={12} />
            Beepme Blog & Resources
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-4">
            Panduan & Tips <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-500">Operasi F&B</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto font-medium">
            Strategi moden untuk menjimatkan kos perkakasan restoran, meningkatkan Google Reviews, dan mempercepatkan giliran pelanggan di Malaysia.
          </p>
        </div>
      </section>

      {/* Blog Grid */}
      <main className="max-w-6xl mx-auto px-6 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((post, idx) => (
            <article 
              key={idx}
              className="group flex flex-col rounded-[32px] border border-white/5 bg-white/[0.02] overflow-hidden hover:border-indigo-500/30 hover:bg-white/[0.03] transition-all duration-300 shadow-xl hover:shadow-indigo-500/5"
            >
              {/* Image Container */}
              <Link href={`/blog/${post.slug}`} className="block relative aspect-video w-full overflow-hidden bg-slate-900">
                <Image 
                  src={post.image} 
                  alt={post.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  priority
                />
                <span className="absolute top-4 left-4 bg-indigo-600 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-lg">
                  {post.category}
                </span>
              </Link>

              {/* Content */}
              <div className="p-6 flex flex-col flex-1">
                {/* Meta */}
                <div className="flex items-center gap-4 text-slate-500 text-[10px] font-semibold uppercase tracking-wider mb-3">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} /> {post.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> {post.readTime}
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-lg md:text-xl font-bold text-white mb-3 group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug">
                  <Link href={`/blog/${post.slug}`}>
                    {post.title}
                  </Link>
                </h2>

                {/* Desc */}
                <p className="text-slate-400 text-xs md:text-sm leading-relaxed mb-6 line-clamp-3">
                  {post.desc}
                </p>

                {/* Action */}
                <div className="mt-auto pt-4 border-t border-white/5">
                  <Link 
                    href={`/blog/${post.slug}`} 
                    className="inline-flex items-center gap-2 text-xs font-black text-white group-hover:text-indigo-400 transition-colors uppercase tracking-widest"
                  >
                    Baca Artikel <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  )
}
