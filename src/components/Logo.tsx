'use client'

import React from 'react'

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
      <div style={{ width: size, height: size }} className={`relative flex-shrink-0 ${iconColor}`}>
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
          {/* Signal Left 1 */}
          <path d="M25 40C20 45 20 55 25 60" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
          {/* Signal Left 2 */}
          <path d="M15 30C5 40 5 60 15 70" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
          {/* Signal Left 3 */}
          <path d="M5 20C-10 35 -10 65 5 80" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
          
          {/* The Stylized 'b' */}
          <path d="M40 15V85" stroke="currentColor" strokeWidth="9" strokeLinecap="round" />
          <path d="M40 50C40 38 52 32 62 32C75 32 85 42 85 58C85 74 75 84 62 84C52 84 40 78 40 66" stroke="currentColor" strokeWidth="9" strokeLinecap="round" />
          
          {/* Signal Right 1 */}
          <path d="M75 40C80 45 80 55 75 60" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
          {/* Signal Right 2 */}
          <path d="M85 30C95 40 95 60 85 70" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
          {/* Signal Right 3 */}
          <path d="M95 20C110 35 110 65 95 80" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
        </svg>
      </div>
      {showText && (
        <span className={`text-2xl font-black tracking-tighter uppercase italic ${textColor}`}>
          Beepme<span className="text-indigo-500">.pro</span>
        </span>
      )}
    </div>
  )
}
