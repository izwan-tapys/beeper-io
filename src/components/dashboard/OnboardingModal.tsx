'use client'

import { useState } from 'react'
import { Smartphone, ArrowRight, Phone, Clock, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Merchant = {
  id: string
  name: string
  phone: string | null
  is_verified: boolean
  [key: string]: unknown
}

interface OnboardingModalProps {
  merchant: Merchant
  onPhoneSaved: (updatedMerchant: Merchant) => void
}

const supabase = createClient()

export function OnboardingModal({ merchant, onPhoneSaved }: OnboardingModalProps) {
  const [onboardingPhone, setOnboardingPhone] = useState('')
  const [savingOnboarding, setSavingOnboarding] = useState(false)

  const saveOnboarding = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!onboardingPhone.trim()) return

    const phoneRegex = /^(01)[0-46-9]-*[0-9]{7,8}$/
    const cleanedPhone = onboardingPhone.replace(/-/g, '').trim()

    if (!phoneRegex.test(cleanedPhone)) {
      alert('Please enter a valid Malaysian phone number (e.g. 0123456789)')
      return
    }

    setSavingOnboarding(true)
    const { error } = await supabase
      .from('merchants')
      .update({ phone: cleanedPhone })
      .eq('id', merchant.id)

    if (error) {
      if (error.message.includes('unique')) {
        alert('This phone number is already registered with another account. Please use a different number.')
      } else {
        alert('Failed to save: ' + error.message)
      }
    } else {
      onPhoneSaved({ ...merchant, phone: cleanedPhone, is_verified: false })
    }
    setSavingOnboarding(false)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-black/60 animate-fade-in">
      <div className="w-full max-w-md bg-[#0a0b0f] border border-white/10 rounded-[40px] p-8 md:p-12 shadow-2xl shadow-indigo-500/20 animate-bounce-in">
        <div className="w-20 h-20 rounded-3xl bg-indigo-600 flex items-center justify-center mb-8 shadow-xl shadow-indigo-600/40 mx-auto">
          <Smartphone size={40} className="text-white" />
        </div>

        <h2 className="text-3xl font-black text-white text-center mb-2">Welcome to Beepme!</h2>

        {!merchant.phone ? (
          <>
            <p className="text-slate-400 text-center mb-10 text-sm leading-relaxed">
              To keep our community safe and fair, we require a valid phone number to get started.
            </p>

            <form onSubmit={saveOnboarding} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-2">Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. 0123456789"
                  value={onboardingPhone}
                  onChange={(e) => setOnboardingPhone(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold outline-none focus:border-indigo-500 transition-all text-lg"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={savingOnboarding || !onboardingPhone.trim()}
                className="w-full py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-lg transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {savingOnboarding ? <Loader2 className="animate-spin" /> : <ArrowRight />}
                Next Step
              </button>
            </form>
          </>
        ) : (
          <div className="text-center animate-fade-in">
            <p className="text-slate-400 mb-8 text-sm leading-relaxed">
              Last step! Please click the button below to send a verification message to our team via WhatsApp.
            </p>

            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 mb-8">
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Your Verified Phone</p>
              <p className="text-xl font-bold text-white tracking-widest">{merchant.phone}</p>
            </div>

            <div className="space-y-4">
              <a
                href={`https://wa.me/60194696158?text=${encodeURIComponent(`Salam Beepme, sila sahkan akaun saya.\n\nStore: ${merchant.name}\nPhone: ${merchant.phone}\nID: ${merchant.id}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-5 rounded-2xl bg-[#25D366] hover:bg-[#128C7E] text-white font-black text-lg transition-all shadow-xl shadow-green-500/20 flex items-center justify-center gap-3"
              >
                <Phone size={20} />
                Verify via WhatsApp
              </a>

              <div className="pt-4 flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold animate-pulse">
                  <Clock size={14} />
                  Waiting for Admin Approval...
                </div>
                <p className="text-[9px] text-slate-500 italic text-center">
                  Once sent, we will approve your account within 10-15 minutes. <br /> You can refresh this page after a while.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="text-[10px] text-slate-400 hover:text-white underline mt-2"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          </div>
        )}

        <p className="mt-8 text-[9px] text-slate-600 text-center uppercase tracking-tighter">
          By continuing, you agree to our terms and fair usage policy.
        </p>
      </div>
    </div>
  )
}
