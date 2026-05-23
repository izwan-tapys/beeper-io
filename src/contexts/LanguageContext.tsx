'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

type Language = 'bm' | 'en'

interface LanguageContextType {
  lang: Language
  setLang: (lang: Language) => void
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('en')

  useEffect(() => {
    // Try to load language preference from localStorage
    try {
      const saved = localStorage.getItem('beepme_language') as Language
      if (saved === 'bm' || saved === 'en') {
        setLangState(saved)
      } else {
        // Default to BM for Malaysian users based on generic preference
        setLangState('bm')
      }
    } catch (err) {
      // Ignore localStorage errors
    }
  }, [])

  const setLang = (newLang: Language) => {
    setLangState(newLang)
    try {
      localStorage.setItem('beepme_language', newLang)
    } catch (err) {}
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
