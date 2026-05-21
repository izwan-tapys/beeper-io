const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/app/pager/[sessionId]/page.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add swipe state and touch handlers
const stateInsertionPoint = content.indexOf('const audioCtxRef = useRef');
const stateCode = `  const [touchStartY, setTouchStartY] = useState<number | null>(null)

  const resetSlideTimer = useCallback(() => {
    if (slideTimerRef.current) clearInterval(slideTimerRef.current)
    if (adsList.length > 1) {
      slideTimerRef.current = setInterval(() => {
        setCurrentAdIndex((prev) => (prev + 1) % adsList.length)
      }, 15000)
    }
  }, [adsList.length])

  useEffect(() => {
    if (status === 'waiting' && adsList.length > 1) {
      resetSlideTimer()
    }
    return () => {
      if (slideTimerRef.current) clearInterval(slideTimerRef.current)
    }
  }, [status, adsList.length, resetSlideTimer])

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY === null || adsList.length <= 1) return
    const touchEndY = e.changedTouches[0].clientY
    const deltaY = touchStartY - touchEndY
    
    if (deltaY > 50) {
      setCurrentAdIndex((prev) => (prev + 1) % adsList.length)
      resetSlideTimer()
    } else if (deltaY < -50) {
      setCurrentAdIndex((prev) => (prev - 1 + adsList.length) % adsList.length)
      resetSlideTimer()
    }
    setTouchStartY(null)
  }

  `;
content = content.slice(0, stateInsertionPoint) + stateCode + content.slice(stateInsertionPoint);

// 2. Add touch handlers to waiting container
const containerSearch = `<div className="w-full h-full relative flex flex-col justify-between">`;
const containerReplace = `<div className="w-full h-full relative flex flex-col justify-between" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>`;
content = content.replace(containerSearch, containerReplace);

// 3. Add fade animation key to ad background so it transitions on change
const adBackgroundSearch = `<div className="absolute inset-0 z-0">`;
const adBackgroundReplace = `<div className="absolute inset-0 z-0 animate-fade-in" key={currentAdIndex}>`;
content = content.replace(adBackgroundSearch, adBackgroundReplace);

fs.writeFileSync(file, content, 'utf8');
console.log('Slide logic patched successfully.');
