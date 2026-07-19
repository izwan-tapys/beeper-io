'use client'

import React, { useState } from 'react'

export default function SavingsCalculator() {
  const [pagerCount, setPagerCount] = useState(15)

  const physicalCost = (pagerCount * 250) + 600
  const beepmeCost = 0
  const savings = physicalCost - beepmeCost

  return (
    <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-md space-y-8">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <label htmlFor="pager-slider" className="text-sm font-bold text-slate-300">
            Anggaran Bilangan Pager Fizikal Diperlukan:
          </label>
          <span className="text-2xl font-black text-orange-300">{pagerCount} Pager</span>
        </div>
        
        {/* Slider Input */}
        <input 
          id="pager-slider"
          type="range" 
          min="5" 
          max="50" 
          value={pagerCount} 
          onChange={(e) => setPagerCount(parseInt(e.target.value))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500" 
          aria-label="Bilangan Pager Fizikal"
        />
        
        <div className="flex justify-between text-xs text-slate-400 font-bold">
          <span>5 Pager</span>
          <span>25 Pager</span>
          <span>50 Pager</span>
        </div>
      </div>

      {/* Calculations Output */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/5">
        <div className="space-y-2">
          <p className="text-xs text-slate-400 font-bold uppercase">Harga Set Pager Fizikal:</p>
          <p className="text-2xl font-black text-red-500">
            RM {physicalCost.toLocaleString()}
            <span className="text-xs text-slate-400 font-medium block">
              (Anggaran RM250/pager + RM600 Transmitter base)
            </span>
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-slate-400 font-bold uppercase">Harga Beepme.pro:</p>
          <p className="text-2xl font-black text-green-400">
            RM 0 <span className="text-xs text-slate-400 font-medium">/ Selamanya Percuma</span>
            <span className="text-xs text-slate-400 font-medium block">
              (Atau upgrade ke Premium serendah RM49/bulan)
            </span>
          </p>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 text-center space-y-1">
        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Anda Menjimatkan Kos Setup Sebanyak:</p>
        <p className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-300">
          RM {savings.toLocaleString()}
        </p>
      </div>
    </div>
  )
}
