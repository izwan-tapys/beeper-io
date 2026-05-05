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
  iconColor = "text-indigo-500" 
}: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div style={{ width: size, height: size }} className={`relative flex-shrink-0 ${iconColor}`}>
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Signal Lines Left */}
          <path d="M30 35C22 42 22 58 30 65" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
          <path d="M20 30C10 40 10 60 20 70" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
          <path d="M10 25C-5 40 -5 60 10 75" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
          
          {/* Stylized 'b' */}
          <path d="M45 20V60C45 68 52 75 60 75C68 75 75 68 75 60C75 52 68 45 60 45H45" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
          
          {/* Signal Lines Right */}
          <path d="M70 35C78 42 78 58 70 65" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
          <path d="M80 30C90 40 90 60 80 70" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
          <path d="M90 25C105 40 105 60 90 75" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
        </svg>
      </div>
      {showText && (
        <span className={`text-2xl font-black tracking-tighter uppercase ${textColor}`}>
          Beepme<span className="text-indigo-500">.pro</span>
        </span>
      )}
    </div>
  )
}
