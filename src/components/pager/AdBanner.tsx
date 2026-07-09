'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'

interface AdBannerProps {
  ad: any
  lang: 'bm' | 'en'
  isDescExpanded: boolean
  onToggleDesc: () => void
  onAdClick: () => void
  onGmbClick: (url: string) => void
  gmbUrl: string | null
  isGmbQuotaExceeded: boolean
  isMultiSession: boolean
  activeStallsCount: number
}

export function AdBanner({
  ad,
  lang,
  isDescExpanded,
  onToggleDesc,
  onAdClick,
  onGmbClick,
  gmbUrl,
  isGmbQuotaExceeded,
  isMultiSession,
  activeStallsCount,
}: AdBannerProps) {
  return (
    <div className="h-1/2 relative overflow-hidden flex-shrink-0 animate-fade-in">
      {ad ? (
        <>
          {ad.media_url ? (
            (() => {
              const ytMatch = ad.media_url.match(
                /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/
              )
              const ytId = ytMatch && ytMatch[2].length === 11 ? ytMatch[2] : null
              if (ytId) {
                return (
                  <iframe
                    src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&modestbranding=1&rel=0&playsinline=1`}
                    className="w-full h-full object-cover pointer-events-none"
                    allow="autoplay; encrypted-media"
                  />
                )
              }

              const tiktokMatch = ad.media_url.match(/tiktok\.com\/@.*\/video\/(\d+)/)
              const tiktokId = tiktokMatch ? tiktokMatch[1] : null
              if (tiktokId) {
                return (
                  <iframe
                    src={`https://www.tiktok.com/embed/v2/${tiktokId}`}
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
            <img src={ad.fallback_image_url} alt={ad.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#0c0d12] via-[#020203] to-[#1e1b4b] flex flex-col items-center justify-center text-center p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-indigo-500/5 blur-[50px] rounded-full pointer-events-none" />
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 mb-3">
                  <span className="text-white font-black text-xl">B</span>
                </div>
                <h4 className="text-lg font-black text-white uppercase tracking-tight mb-1">Beepme.pro</h4>
                <p className="text-xs text-slate-400 leading-relaxed font-medium max-w-[200px]">
                  Gantikan Pager Perkakasan Mahal. Daftar Percuma.
                </p>
              </div>
            </div>
          )}

          {/* Ad overlay */}
          <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-10" />
          {(ad.title || ad.cta_text) && (
            <div className="absolute bottom-3 left-3 right-3 z-20 flex items-end justify-between">
              <div className="flex-1 mr-2">
                {ad.title && (
                  <a
                    href={ad.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={onAdClick}
                    className="text-sm font-black text-white uppercase tracking-tight leading-tight line-clamp-1 drop-shadow-lg block"
                  >
                    @{ad.title}
                  </a>
                )}
                {ad.description && (
                  <p
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleDesc()
                    }}
                    className={`text-xs text-slate-200 hover:text-white font-medium leading-snug drop-shadow-md mt-0.5 cursor-pointer select-none transition-all ${
                      isDescExpanded ? 'line-clamp-none max-h-24 overflow-y-auto' : 'line-clamp-2'
                    }`}
                  >
                    {ad.description}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                {ad.cta_text && (
                  <a
                    href={ad.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={onAdClick}
                    className="px-2.5 py-1 bg-white/25 backdrop-blur-md rounded-md text-[9px] font-black text-white uppercase tracking-widest shadow-lg active:scale-95 transition-all whitespace-nowrap"
                  >
                    {ad.cta_text}
                  </a>
                )}
                {gmbUrl && !isGmbQuotaExceeded && (
                  <button
                    onClick={() => onGmbClick(gmbUrl)}
                    className="w-9 h-9 rounded-full bg-white flex flex-col items-center justify-center gap-0.5 shadow-lg active:scale-95 transition-transform relative"
                  >
                    <span className="text-sm leading-none">⭐</span>
                    <span className="text-[6px] font-black uppercase text-black">Rate</span>
                    <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping opacity-75" />
                    <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full" />
                  </button>
                )}
              </div>
            </div>
          )}
          {/* Sponsored label */}
          <div className="absolute top-2 right-2 z-20">
            <span className="text-[8px] text-white/50 font-bold uppercase tracking-widest bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded-full">
              Sponsored
            </span>
          </div>

          {/* Multi-session indicator badge (top-left) */}
          {isMultiSession && (
            <div className="absolute top-2 left-2 z-20">
              <span className="text-[8px] text-white font-black uppercase tracking-widest bg-indigo-600/80 backdrop-blur-sm px-2 py-0.5 rounded-full">
                {activeStallsCount} {lang === 'bm' ? 'Pesanan' : 'Orders'}
              </span>
            </div>
          )}
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-[#020203]">
          <Loader2 className="animate-spin text-slate-700" />
        </div>
      )}
    </div>
  )
}
