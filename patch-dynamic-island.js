const fs = require('fs');
const file = 'src/app/pager/[sessionId]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add imports
const importInsertion = `import { motion, AnimatePresence, useAnimation, PanInfo } from 'framer-motion'\n`;
content = content.replace("import { useState", importInsertion + "import { useState");

// 2. Add isExpanded state
const stateInsertion = `  const [isExpanded, setIsExpanded] = useState(false)\n  const controls = useAnimation()\n`;
content = content.replace("  const [clientUuid, setClientUuid]", stateInsertion + "  const [clientUuid, setClientUuid]");

// 3. Add drag end handler
const dragHandlerInsertion = `
  const handleDragEnd = (event: any, info: PanInfo) => {
    if (info.offset.y < -30) {
      setIsExpanded(true)
    } else if (info.offset.y > 30) {
      setIsExpanded(false)
    }
  }
`;
content = content.replace("const handleTouchStart", dragHandlerInsertion + "const handleTouchStart");

// 4. Update the Bottom Section Wrapper
const oldWrapperStart = `{/* 3. Bottom Section Wrapper */}`;
const oldWrapperEndRegex = /<\/footer>\s*<\/div>/g;

const startIndex = content.indexOf(oldWrapperStart);
const match = [...content.matchAll(oldWrapperEndRegex)][0];
const endIndex = match.index + match[0].length;

const newBottomWrapper = `{/* 3. Bottom Section Wrapper (Dynamic Island) */}
            <div className="relative z-50 w-full flex flex-col justify-end items-center pointer-events-none">
              
              {/* Overlays (Hidden when expanded so it doesn't clutter) */}
              <AnimatePresence>
                {!isExpanded && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="w-full relative pointer-events-auto"
                  >
                    {/* Right Sidebar */}
                    <div className="absolute right-4 bottom-28 flex flex-col items-center gap-4">
                      <button 
                        onClick={() => setShowInstructions(true)}
                        className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex flex-col items-center justify-center gap-1 shadow-xl active:scale-95 transition-transform"
                      >
                        <AlertTriangle size={20} className="text-amber-400 drop-shadow-md" />
                        <span className="text-[8px] font-black uppercase text-amber-100">Amaran</span>
                      </button>
                    </div>

                    {/* Left Ad Details */}
                    {ad && (
                      <a
                        href={ad.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handleAdClick}
                        className="absolute left-4 bottom-28 max-w-[70%] text-left"
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
                  </motion.div>
                )}
              </AnimatePresence>

              {/* The Dynamic Island / Pager Drawer */}
              <motion.div 
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
                animate={{
                  height: isExpanded ? 'auto' : '64px',
                  borderRadius: isExpanded ? '32px 32px 0 0' : '9999px',
                  width: isExpanded ? '100%' : '90%',
                  marginBottom: isExpanded ? '0px' : '24px',
                  backgroundColor: isExpanded ? '#ffffff' : 'rgba(0,0,0,0.65)',
                  backdropFilter: isExpanded ? 'none' : 'blur(16px)',
                }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="pointer-events-auto overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-white/10 dark:border-white/5 relative z-50"
                onClick={() => !isExpanded && setIsExpanded(true)}
              >
                {/* Ensure dark mode support for expanded state via class injection if needed, but hardcoded #fff is fine if we inject standard classes inside */}
                <div className={isExpanded ? 'dark:bg-[#0c0d12] w-full h-full' : 'w-full h-full'}>
                  <AnimatePresence mode="wait">
                    {!isExpanded ? (
                      /* COLLAPSED STATE (PILL) */
                      <motion.div 
                        key="collapsed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full h-full flex items-center justify-between px-6 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          {merchantLogo ? (
                            <img src={merchantLogo} alt={merchantName} className="w-8 h-8 rounded-full object-cover border border-white/20 shadow-sm" />
                          ) : (
                            <Logo size={24} showText={false} />
                          )}
                          <span className="text-white font-black tracking-tight text-sm">#{receiptNumber}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[#10b981] font-mono font-bold text-sm">{formatWaitTime()}</span>
                          <div className="w-8 h-1 bg-white/30 rounded-full" />
                        </div>
                      </motion.div>
                    ) : (
                      /* EXPANDED STATE (FULL CARD) */
                      <motion.div 
                        key="expanded"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full p-6 pt-5 bg-white dark:bg-[#0c0d12]"
                      >
                        {/* Pull indicator / handle */}
                        <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mb-5 cursor-pointer" onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }} />

                        {/* Baris 1: Logo, Nama Kedai & Status */}
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800/50">
                          <div className="flex items-center gap-2.5">
                            {merchantLogo ? (
                              <img src={merchantLogo} alt={merchantName} className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-sm" />
                            ) : (
                              <Logo size={28} showText={false} />
                            )}
                            <h2 className="font-black text-slate-800 dark:text-white text-base tracking-tight uppercase">{merchantName}</h2>
                          </div>
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#10b981]/10 rounded-full border border-[#10b981]/20">
                            <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-[#10b981]">Disediakan</span>
                          </div>
                        </div>

                        {/* Baris 2: Nombor Pesanan & Masa */}
                        <div className="flex items-end justify-between mb-6">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">No. Pesanan</p>
                            <p className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                              #{receiptNumber}
                            </p>
                          </div>
                          <div className="text-right">
                            {isGhostActive() ? (
                              <>
                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Status</p>
                                <p className="text-sm font-bold text-slate-500 italic animate-pulse leading-tight">Sibuk</p>
                              </>
                            ) : (
                              <>
                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Masa Menunggu</p>
                                <p className="text-3xl font-black font-mono tracking-tight text-[#10b981] leading-none">{formatWaitTime()}</p>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Baris 3: Butang Uji Bunyi */}
                        <button 
                          onClick={(e) => { e.stopPropagation(); initAudio(); }}
                          className="w-full flex flex-col items-center justify-center gap-1 py-3.5 rounded-2xl transition-all active:scale-95 border border-slate-200 dark:border-white/5 relative overflow-hidden group"
                          style={{ backgroundColor: themeColor, boxShadow: \`0 8px 24px \${themeColor}40\` }}
                        >
                          <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                          <div className="relative z-10 flex items-center gap-2 text-white font-black text-sm uppercase tracking-wider">
                            <Volume2 size={16} />
                            Uji Bunyi Pager
                          </div>
                          <span className="relative z-10 text-[9px] text-white/80 font-medium">Pastikan 'Silent Mode' dimatikan</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>`;

content = content.slice(0, startIndex) + newBottomWrapper + content.slice(endIndex);

fs.writeFileSync(file, content, 'utf8');
console.log('Dynamic Island patched successfully.');
