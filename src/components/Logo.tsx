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
      <div style={{ width: size, height: size }} className="relative flex-shrink-0 overflow-hidden rounded-xl shadow-2xl border border-white/10 group">
        <img src="/logo.png" alt="Beepme Logo" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
      </div>
      {showText && (
        <span className={`text-2xl font-black tracking-tighter uppercase italic ${textColor}`}>
          Beepme<span className="text-indigo-500">.pro</span>
        </span>
      )}
    </div>
  )
}
