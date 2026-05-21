const fs = require('fs');
const file = 'src/app/pager/[sessionId]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldAlarmStart = "  if (status === 'called' || isFlashing) {";
const oldAlarmEndRegex = /return \([\s\S]*?\}\s*<\/div>\s*\)\s*\}/;

const startIndex = content.indexOf(oldAlarmStart);
if (startIndex === -1) {
    console.error("Could not find the alarm block.");
    process.exit(1);
}

const match = content.slice(startIndex).match(oldAlarmEndRegex);
if (!match) {
    console.error("Could not find end of alarm block.");
    process.exit(1);
}

const endIndex = startIndex + match.index + match[0].length;

const newAlarmBlock = `  if (status === 'called' || isFlashing) {
    return (
      <div 
        className="h-[100dvh] w-screen fixed inset-0 flex flex-col items-center justify-center p-6 text-center cursor-pointer overflow-hidden bg-black select-none z-[999]" 
        onClick={stopAlert}
      >
        {/* Dynamic Background */}
        <motion.div
          animate={{ backgroundColor: ['#000000', themeColor || '#10b981', '#000000'] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 opacity-40"
        />

        {/* Hypnotic Ripples */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{ 
              width: '40vw', 
              height: '40vw', 
              minWidth: '300px', 
              minHeight: '300px', 
              border: \`4px solid \${themeColor || '#10b981'}\`,
              backgroundColor: \`\${themeColor || '#10b981'}10\`
            }}
            animate={{ 
              scale: [0.5, 3], 
              opacity: [0.8, 0] 
            }}
            transition={{ 
              duration: 2.5, 
              repeat: Infinity, 
              delay: i * 0.8, 
              ease: "easeOut" 
            }}
          />
        ))}

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-md">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
            className="mb-8"
          >
            <span className="text-7xl drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]">🔔</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl font-black text-white mb-2 tracking-widest uppercase"
          >
            Pesanan
          </motion.h1>

          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="mb-16"
          >
            <p 
              className="text-white font-black leading-none drop-shadow-[0_0_30px_rgba(255,255,255,0.6)]"
              style={{ fontSize: 'clamp(5rem, 25vw, 12rem)' }}
            >
              #{receiptNumber}
            </p>
          </motion.div>

          <motion.div 
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="mt-8 px-8 py-4 rounded-full border border-white/20 bg-black/40 backdrop-blur-md"
          >
            <span className="text-white font-bold text-sm tracking-widest uppercase">
              Ketik Di Mana-mana Untuk Berhenti
            </span>
          </motion.div>
        </div>
      </div>
    )
  }`;

content = content.slice(0, startIndex) + newAlarmBlock + content.slice(endIndex);

fs.writeFileSync(file, content, 'utf8');
console.log('Alarm block patched successfully.');
