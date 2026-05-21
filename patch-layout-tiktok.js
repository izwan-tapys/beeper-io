const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/app/pager/[sessionId]/page.tsx');
let content = fs.readFileSync(file, 'utf8');

const returnStart = content.indexOf('  return (\n    <div className="h-[100dvh]');
if (returnStart === -1) throw new Error('Could not find return statement');

const newReturn = `  return (
    <div className="h-[100dvh] w-screen fixed inset-0 flex justify-center items-center bg-[#020203] overflow-hidden select-none" style={{ backgroundImage: \`radial-gradient(circle at top, \${themeColor}1a, #020203)\` }}>
      
      {/* Centered Device Wrapper for Tablet/Desktop */}
      <div className={\`w-full max-w-md h-full flex flex-col relative z-10 border-x border-white/5 \${status === 'waiting' ? 'bg-black' : 'justify-between p-6 bg-[#020203]/40 backdrop-blur-3xl'} shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden\`}>
        
        {/* ========================================= */}
        {/* TIKTOK UX WAITING SCREEN                 */}
        {/* ========================================= */}
        {status === 'waiting' && (
          <div className="w-full h-full relative flex flex-col justify-between">
            {/* 1. Fullscreen Background Ad */}
            <div className="absolute inset-0 z-0">
              {ad ? (
                <>
                  {ad.media_url ? (
                    (() => {
                      const ytMatch = ad.media_url.match(/^.*(youtu\\.be\\/|v\\/|u\\/\\w\\/|embed\\/|watch\\?v=|\\&v=|shorts\\/)([^#\\&\\?]*).*/);
                      const ytId = (ytMatch && ytMatch[2].length === 11) ? ytMatch[2] : null;
                      if (ytId) {
                        return (
                          <iframe
                            src={\`https://www.youtube.com/embed/\${ytId}?autoplay=1&mute=1&loop=1&playlist=\${ytId}&controls=0&modestbranding=1&rel=0&playsinline=1\`}
                            className="w-full h-full object-cover pointer-events-none scale-[1.15]"
                            allow="autoplay; encrypted-media"
                          />
                        )
                      }
                      
                      const tiktokMatch = ad.media_url.match(/tiktok\\.com\\/@.*\\/video\\/(\\d+)/);
                      const tiktokId = tiktokMatch ? tiktokMatch[1] : null;
                      if (tiktokId) {
                        return (
                          <iframe
                            src={\`https://www.tiktok.com/embed/v2/\${tiktokId}\`}
                            className="w-full h-full object-cover"
                            allow="autoplay; encrypted-media"
                          />
                        )
                      }

                      return (
                        <video
                          src={ad.media_url}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      )
                    })()
                  ) : ad.fallback_image_url ? (
                    <img
                      src={ad.fallback_image_url}
                      alt={ad.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#0c0d12] via-[#020203] to-[#1e1b4b] p-6 flex flex-col justify-center text-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-indigo-500/5 blur-[50px] rounded-full pointer-events-none" />
                      <div className="relative z-10 flex flex-col items-center justify-center">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 mb-4">
                          <span className="text-white font-black text-xl">B</span>
                        </div>
                        <h4 className="text-xl font-black text-white leading-tight uppercase tracking-tight mb-2">Beepme.pro</h4>
                        <p className="text-xs text-slate-400 leading-relaxed font-medium max-w-[200px]">Gantikan Pager Perkakasan Mahal. Daftar Percuma.</p>
                      </div>
                    </div>
                  )}
                  {/* Vertical Top/Bottom Gradients for readability */}
                  <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-black/80 to-transparent pointer-events-none z-10" />
                  <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-10" />
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#020203]">
                  <Loader2 className="animate-spin text-slate-700" />
                </div>
              )}
            </div>

            {/* 2. Transparent Header (Single Row) */}
            <header className="relative z-50 w-full p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {merchantLogo ? (
                  <img src={merchantLogo} alt={merchantName} className="w-8 h-8 rounded-full object-cover border border-white/20 shadow-md" />
                ) : (
                  <Logo size={24} showText={false} />
                )}
                <h2 className="font-black text-white text-sm tracking-tight uppercase drop-shadow-md">{merchantName}</h2>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-black/40 backdrop-blur-md rounded-full border border-white/10 shadow-lg">
                <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                <span className="text-[9px] font-black uppercase tracking-widest text-white">Sedang Disediakan</span>
              </div>
            </header>

            {/* 3. Middle Overlay (Invisible Spacer) */}
            <div className="flex-1" />

            {/* 4. Bottom Section Wrapper */}
            <div className="relative z-50 w-full flex flex-col justify-end">
              
              {/* Right Sidebar (Like/Comment area) */}
              <div className="absolute right-4 bottom-24 flex flex-col items-center gap-4">
                <button 
                  onClick={() => setShowInstructions(true)}
                  className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex flex-col items-center justify-center gap-1 shadow-xl active:scale-95 transition-transform"
                >
                  <AlertTriangle size={20} className="text-amber-400 drop-shadow-md" />
                  <span className="text-[8px] font-black uppercase text-amber-100">Amaran</span>
                </button>
              </div>

              {/* Bottom Left Ad Details */}
              {ad && (
                <a
                  href={ad.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleAdClick}
                  className="absolute left-4 bottom-24 max-w-[70%] text-left"
                >
                  <div className="space-y-1.5 drop-shadow-lg">
                    <h4 className="text-sm font-black text-white tracking-tight uppercase line-clamp-2 leading-tight">@{ad.title}</h4>
                    {ad.description && <p className="text-[11px] text-slate-100 font-medium leading-snug line-clamp-2">{ad.description}</p>}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-lg text-[9px] font-black text-white uppercase tracking-widest mt-1 shadow-lg active:bg-white/30 transition-colors">
                      Ketahui Lebih Lanjut
                    </div>
                  </div>
                </a>
              )}

              {/* 5. Bottom Navbar */}
              <footer className="w-full p-4 pt-0">
                <div className="flex items-stretch gap-2.5 w-full">
                  {/* Wait Time Box */}
                  <div className="flex-1 bg-black/50 backdrop-blur-xl border border-white/10 px-4 py-2.5 rounded-2xl shadow-inner text-left flex flex-col justify-center">
                    {isGhostActive() ? (
                      <>
                        <p className="text-white/60 text-[8px] font-black uppercase tracking-widest mb-0.5">Status Pesanan</p>
                        <p className="text-[10px] font-bold text-white italic animate-pulse leading-tight">Kitchen congestion</p>
                      </>
                    ) : (
                      <>
                        <p className="text-white/60 text-[8px] font-black uppercase tracking-widest mb-0.5">Tempoh Menunggu</p>
                        <p className="text-lg font-black font-mono tracking-tight text-[#10b981] leading-none drop-shadow-md">{formatWaitTime()}</p>
                      </>
                    )}
                  </div>

                  {/* Uji Bunyi Box */}
                  <div className="flex-1 bg-black/50 backdrop-blur-xl border border-white/10 px-3 py-2.5 rounded-2xl flex flex-col justify-between items-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundColor: themeColor }} />
                    <div className="relative z-10 flex items-center gap-1.5 mb-1.5">
                       <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                       <span className="text-[7px] font-black text-white/80 uppercase tracking-widest">Sistem Aktif</span>
                    </div>
                    <button 
                       onClick={() => initAudio()}
                       className="relative z-10 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-white font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-md border border-white/10"
                       style={{ backgroundColor: themeColor, boxShadow: \`0 4px 12px \${themeColor}40\` }}
                    >
                      <Volume2 size={12} />
                      Uji Bunyi
                    </button>
                  </div>
                </div>
              </footer>

            </div>

            {/* Modal Popup for Sound Warning */}
            {showInstructions && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                <div className="w-full max-w-[280px] bg-[#111] border border-white/10 rounded-[32px] p-6 shadow-2xl animate-scale-in flex flex-col items-center text-center relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-600 to-amber-400" />
                  
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
                    <AlertTriangle size={32} className="text-amber-500" />
                  </div>
                  
                  <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">Penting: Amaran Bunyi</h3>
                  <p className="text-xs font-medium text-slate-400 leading-relaxed mb-6">Sila pastikan anda mengikut arahan di bawah supaya pager ini berfungsi dengan sempurna.</p>
                  
                  <ul className="w-full space-y-3 mb-6 text-left">
                    <li className="flex items-center gap-3 bg-white/[0.03] p-3 rounded-2xl border border-white/5">
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                        <Volume2 size={12} className="text-white" />
                      </div>
                      <span className="text-[10px] font-bold text-white uppercase tracking-wide">Kuatkan Volume Audio</span>
                    </li>
                    <li className="flex items-center gap-3 bg-white/[0.03] p-3 rounded-2xl border border-white/5">
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                        <AlertTriangle size={12} className="text-white" />
                      </div>
                      <span className="text-[10px] font-bold text-white uppercase tracking-wide">Matikan "Silent Mode"</span>
                    </li>
                  </ul>

                  <button 
                    onClick={() => setShowInstructions(false)}
                    className="w-full py-4 rounded-xl font-black text-[#111] text-xs uppercase tracking-widest bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)] active:scale-95 transition-transform"
                  >
                    Saya Faham
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================= */}
        {/* CONFIRM SCREEN                           */}
        {/* ========================================= */}
        {status !== 'waiting' && (
          <>
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[50%] blur-[120px] rounded-full pointer-events-none" style={{ backgroundColor: \`\${themeColor}26\` }} />

            {/* Header */}
            <header className="p-2 text-center relative z-20 shrink-0 mb-4 pointer-events-none">
              <div className="flex flex-col items-center gap-2">
                {merchantLogo ? (
                  <img src={merchantLogo} alt={merchantName} className="w-10 h-10 rounded-full object-cover border border-white/10 shadow-md" />
                ) : (
                  <Logo size={36} showText={false} />
                )}
                <h2 className="font-black text-white text-base tracking-tight uppercase">{merchantName}</h2>
              </div>
            </header>

            {/* Main content */}
            <main className="flex-1 flex flex-col items-center justify-center px-2 relative z-10 min-h-0 w-full">
              {status === 'confirm' && (
                <div className="w-full max-w-sm text-center animate-slide-up">
                  <div className="p-8 rounded-[40px] bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-2xl mb-8">
                    <h1 className="text-4xl font-black text-white mb-2 tracking-tighter italic">#{receiptNumber}</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mb-8">Connect Your Pager</p>
                    
                    <div className="space-y-4 text-left mb-8">
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                        <Smartphone size={18} className="text-indigo-400 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-indigo-200 leading-snug">Telefon ini akan bergetar dan mengeluarkan bunyi apabila pesanan sedia.</p>
                      </div>
                    </div>

                    <button 
                      onClick={handleConfirm} 
                      className="w-full py-5 rounded-2xl font-black text-white text-xl shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
                      style={{ backgroundColor: themeColor, boxShadow: \`0 20px 40px \${themeColor}33\` }}
                    >
                      ACTIVATE PAGER
                    </button>
                  </div>
                </div>
              )}
            </main>

            <footer className="p-2 relative z-20 shrink-0 mt-4 text-center">
              <p className="text-[8px] text-slate-700 font-black uppercase tracking-[0.4em]">
                Beepme.pro — Virtual Paging System
              </p>
            </footer>
          </>
        )}

      </div>

      <style jsx global>{\`
        @keyframes flash-green {
          0%, 100% { background-color: #000000; }
          50% { background-color: #10b981; }
        }
        .animate-flash-green {
          animation: flash-green 0.5s step-end infinite;
        }
        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-ping-slow {
          animation: ping-slow 1s ease-in-out infinite;
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out forwards;
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in {
          animation: scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      \`}</style>
    </div>
  )
}
`;

const newContent = content.substring(0, returnStart) + newReturn;
fs.writeFileSync(file, newContent, 'utf8');
console.log('Layout patched successfully.');
