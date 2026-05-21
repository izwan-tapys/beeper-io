const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/app/pager/[sessionId]/page.tsx');
let content = fs.readFileSync(file, 'utf8');

const returnStart = content.indexOf('  return (\n    <div className="h-[100dvh]');
if (returnStart === -1) throw new Error('Could not find return statement');

const newReturn = `  return (
    <div className="h-[100dvh] w-screen fixed inset-0 flex justify-center items-center bg-[#020203] overflow-hidden" style={{ backgroundImage: \`radial-gradient(circle at top, \${themeColor}1a, #020203)\` }}>
      
      {/* Centered Device Wrapper for Tablet/Desktop */}
      <div className={\`w-full max-w-md h-full flex flex-col justify-between relative z-10 border-x border-white/5 \${status === 'waiting' ? 'bg-black' : 'p-6 bg-[#020203]/40 backdrop-blur-3xl'} shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden\`}>
        
        {/* Background Glow (Confirm Only) */}
        {status !== 'waiting' && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[50%] blur-[120px] rounded-full pointer-events-none" style={{ backgroundColor: \`\${themeColor}26\` }} />
        )}

        {/* Header - 15% */}
        <header className={\`\${status === 'waiting' ? 'h-[15dvh] bg-[#111]' : 'mb-4'} shrink-0 flex flex-col items-center justify-center p-4 relative z-20\`}>
          <div className="flex flex-col items-center gap-2 w-full max-w-[280px]">
            <div className="flex items-center gap-2">
              {merchantLogo ? (
                <img src={merchantLogo} alt={merchantName} className={\`\${status === 'waiting' ? 'w-8 h-8' : 'w-10 h-10'} rounded-full object-cover border border-white/10 shadow-md\`} />
              ) : (
                <Logo size={status === 'waiting' ? 24 : 36} showText={false} />
              )}
              <h2 className="font-black text-white text-base tracking-tight uppercase">{merchantName}</h2>
            </div>
            
            {status === 'waiting' && (
              <div className="w-full mt-1">
                <div className="flex justify-between text-[7px] font-black uppercase tracking-widest text-slate-500 mb-1">
                  <span className="animate-pulse">Sedang Disediakan</span>
                  <span>Sedia Dikutip</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 w-[40%] animate-pulse" />
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Main Content - 70% (Ads) or Confirm screen */}
        <main className={\`\${status === 'waiting' ? 'h-[70dvh] w-full' : 'flex-1 px-2'} flex flex-col items-center justify-center relative z-10 overflow-hidden bg-black\`}>
          {status === 'confirm' && (
            <div className="w-full max-w-sm text-center animate-slide-up h-full flex flex-col justify-center">
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

          {status === 'waiting' && (
            <div className="w-full h-full relative group">
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
                            className="w-full h-full object-cover pointer-events-none scale-105"
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
                    <div className="w-full h-full bg-gradient-to-br from-[#0c0d12] via-[#020203] to-[#1e1b4b] p-6 flex flex-col justify-center text-center relative overflow-hidden select-none">
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

                  {/* Gradient Overlay for Ad Title */}
                  <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none z-10" />

                  {/* Clickable Overlay */}
                  <a
                    href={ad.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleAdClick}
                    className="absolute inset-0 z-20 flex flex-col justify-end p-6 text-left"
                  >
                    <div className="space-y-1.5 select-none mt-auto">
                      <h4 className="text-sm font-black text-white tracking-tight uppercase line-clamp-1 drop-shadow-md">{ad.title}</h4>
                      {ad.description && <p className="text-[10px] text-slate-200 font-medium leading-tight line-clamp-2 drop-shadow-md">{ad.description}</p>}
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[9px] font-black text-white uppercase tracking-widest mt-2 shadow-lg">
                        Ketahui Lebih Lanjut →
                      </div>
                    </div>
                  </a>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 className="animate-spin text-slate-700" />
                </div>
              )}
            </div>
          )}
        </main>

        {/* Footer - 15% */}
        <footer className={\`\${status === 'waiting' ? 'h-[15dvh] bg-[#111]' : 'mt-4'} shrink-0 flex flex-col justify-center p-4 relative z-20\`}>
          {status === 'waiting' && (
            <div className="w-full space-y-3 max-w-[280px] mx-auto">
              <div className="flex items-stretch gap-3 w-full">
                <div className="flex-1 bg-white/[0.02] border border-white/10 px-4 py-3 rounded-2xl shadow-inner text-left flex flex-col justify-center">
                  {isGhostActive() ? (
                    <>
                      <p className="text-slate-500 text-[8px] font-black uppercase tracking-widest mb-0.5">Status Pesanan</p>
                      <p className="text-[10px] font-bold text-slate-300 italic animate-pulse leading-tight">Kitchen congestion</p>
                    </>
                  ) : (
                    <>
                      <p className="text-slate-500 text-[8px] font-black uppercase tracking-widest mb-0.5">Tempoh Menunggu</p>
                      <p className="text-xl font-black font-mono tracking-tight text-[#10b981] leading-none">{formatWaitTime()}</p>
                    </>
                  )}
                </div>

                <div className="flex-1 bg-white/[0.02] border border-white/5 p-3 rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 justify-center mb-1.5">
                     <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                     <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Sistem Aktif</span>
                  </div>
                  <button 
                     onClick={() => initAudio()}
                     className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-white font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 shadow-md"
                     style={{ backgroundColor: themeColor, boxShadow: \`0 8px 16px \${themeColor}26\` }}
                  >
                    <Volume2 size={10} />
                    Uji Bunyi
                  </button>
                </div>
              </div>

              {showInstructions && (
                <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-left relative animate-slide-up">
                   <button onClick={() => setShowInstructions(false)} className="absolute top-2 right-2 text-slate-500 hover:text-white font-bold text-[8px]">X</button>
                   <div className="flex items-center gap-1.5 text-amber-500 mb-1">
                      <AlertTriangle size={12} />
                      <span className="text-[8px] font-black uppercase tracking-widest">Perhatian Bunyi</span>
                   </div>
                   <ul className="text-[8px] text-amber-200/60 space-y-0.5 font-medium leading-normal">
                      <li>• Matikan Mod Senyap</li>
                      <li>• Kuatkan Audio</li>
                      <li>• Jangan tutup halaman ini</li>
                   </ul>
                </div>
              )}
            </div>
          )}

          <p className="text-[8px] text-slate-700 font-black uppercase tracking-[0.4em] pt-2 text-center w-full mt-2">
            Beepme.pro — Virtual Paging System
          </p>
        </footer>
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
      \`}</style>
    </div>
  )
}
`;

const newContent = content.substring(0, returnStart) + newReturn;
fs.writeFileSync(file, newContent, 'utf8');
console.log('Layout patched successfully.');
