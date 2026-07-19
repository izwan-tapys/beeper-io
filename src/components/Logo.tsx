'use client'

import Image from 'next/image'

interface LogoProps {
  className?: string
  size?: number
  showText?: boolean
  textColor?: string
  iconColor?: string
}

export function Logo({ 
  className = "", 
  size = 40, 
  showText = true, 
  textColor = "text-white",
  iconColor = "text-white" 
}: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div style={{ width: size, height: size }} className="relative flex-shrink-0 overflow-hidden rounded-xl shadow-2xl border border-white/10 group">
        <Image 
          src="/logo.webp" 
          alt="Beepme Logo" 
          width={size} 
          height={size} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
        />
      </div>
      {showText && (
        <span className={`text-2xl font-black tracking-tighter uppercase italic ${textColor}`}>
          Beepme<span className="text-orange-500">.pro</span>
        </span>
      )}
    </div>
  )
}
