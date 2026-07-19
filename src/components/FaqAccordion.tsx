'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'

interface FaqItem {
  q_bm: string
  q_en: string
  a_bm: string
  a_en: string
}

interface FaqAccordionProps {
  faqs: FaqItem[]
}

export default function FaqAccordion({ faqs }: FaqAccordionProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null)

  return (
    <div className="space-y-4">
      {faqs.map((faq, idx) => (
        <div 
          key={idx} 
          className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-all cursor-pointer"
          onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
        >
          <div className="flex justify-between items-center gap-4">
            <div className="text-left">
              <h4 className="font-bold text-white text-sm sm:text-base">{faq.q_bm}</h4>
              <p className="text-[10px] text-slate-400 italic font-medium mt-0.5">{faq.q_en}</p>
            </div>
            <div className="text-slate-400 flex-shrink-0">
              {activeFaq === idx ? <Minus size={18} /> : <Plus size={18} />}
            </div>
          </div>

          <AnimatePresence>
            {activeFaq === idx && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden mt-4 pt-4 border-t border-white/5 text-left text-xs sm:text-sm text-slate-400 space-y-2 leading-relaxed"
              >
                <p>{faq.a_bm}</p>
                <p className="text-slate-400 italic">{faq.a_en}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}
