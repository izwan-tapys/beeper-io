'use client'

import React, { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Image as ImageIcon, Save, Link as LinkIcon } from 'lucide-react'

export function AdsBuilder({ merchant, onUpdate }: { merchant: any, onUpdate: (merchant: any) => void }) {
  const supabase = createClient()
  
  const [imageUrl, setImageUrl] = useState(merchant?.upsell_image_url || '')
  const [title, setTitle] = useState(merchant?.upsell_title || '')
  const [linkUrl, setLinkUrl] = useState(merchant?.upsell_link_url || '')
  
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !merchant) return

    setUploading(true)
    try {
      // Compress to WebP (vertical format for pager)
      const img = new Image()
      const reader = new FileReader()

      const compressedFile = await new Promise<Blob>((resolve, reject) => {
        reader.onload = (event) => {
          img.onload = () => {
            const canvas = document.createElement('canvas')
            // Standardize vertical size (9:16 approx)
            const MAX_WIDTH = 720
            const MAX_HEIGHT = 1280
            
            let width = img.width
            let height = img.height

            // Calculate new dimensions maintaining aspect ratio
            if (width > MAX_WIDTH || height > MAX_HEIGHT) {
              const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height)
              width = width * ratio
              height = height * ratio
            }

            canvas.width = width
            canvas.height = height
            
            const ctx = canvas.getContext('2d')
            if (!ctx) return reject(new Error('Failed to get canvas context'))

            ctx.drawImage(img, 0, 0, width, height)
            
            canvas.toBlob((blob) => {
              if (blob) resolve(blob)
              else reject(new Error('Canvas to Blob failed'))
            }, 'image/webp', 0.8) // High quality webp
          }
          img.src = event.target?.result as string
        }
        reader.readAsDataURL(file)
      })

      const fileName = `ads/${merchant.id}/${Date.now()}.webp`
      
      const { error: uploadError } = await supabase.storage
        .from('merchant-logos') // Reusing existing bucket
        .upload(fileName, compressedFile, { 
          upsert: true,
          contentType: 'image/webp'
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('merchant-logos')
        .getPublicUrl(fileName)

      setImageUrl(publicUrl)
    } catch (error: any) {
      console.error('Error uploading ad image:', error)
      alert('Error uploading: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (!merchant) return
    setSaving(true)
    
    const { error } = await supabase
      .from('merchants')
      .update({
        upsell_image_url: imageUrl.trim() || null,
        upsell_title: title.trim() || null,
        upsell_link_url: linkUrl.trim() || null,
        upsell_video_url: null, // Clear old video to ensure image takes priority
      })
      .eq('id', merchant.id)

    if (error) {
      alert('Gagal menyimpan iklan: ' + error.message)
    } else {
      alert('Iklan berjaya disimpan!')
      onUpdate({
        ...merchant,
        upsell_image_url: imageUrl.trim() || null,
        upsell_title: title.trim() || null,
        upsell_link_url: linkUrl.trim() || null,
        upsell_video_url: null,
      })
    }
    setSaving(false)
  }

  return (
    <div className="flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Visual Ads Editor</h2>
          <p className="text-sm text-slate-400">Edit terus atas skrin (WYSIWYG).</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || uploading}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Simpan Iklan
        </button>
      </div>

      {/* Editor & Preview Area */}
      <div className="w-full max-w-sm mx-auto relative rounded-[40px] overflow-hidden border-[8px] border-[#1e1e24] aspect-[9/16] bg-black shadow-2xl flex flex-col justify-between group">
        
        {/* Background Image / Upload Area */}
        <div className="absolute inset-0 z-0 cursor-pointer">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            id="ad-bg-upload"
            className="hidden"
            disabled={uploading}
          />
          <label 
            htmlFor="ad-bg-upload" 
            className="w-full h-full flex flex-col items-center justify-center cursor-pointer relative"
          >
            {imageUrl ? (
              <img src={imageUrl} alt="Ad Background" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center text-slate-500 p-6 text-center">
                <ImageIcon size={48} className="mb-4 opacity-50" />
                <p className="text-sm font-bold uppercase tracking-widest mb-2">Klik untuk Muat Naik</p>
                <p className="text-xs">Gambar Promosi Menegak (9:16)</p>
              </div>
            )}

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
              {uploading ? (
                <Loader2 size={32} className="animate-spin text-white" />
              ) : (
                <div className="px-4 py-2 bg-white/10 backdrop-blur rounded-lg text-white font-bold text-xs flex items-center gap-2 border border-white/20">
                  <ImageIcon size={14} /> Tukar Gambar Background
                </div>
              )}
            </div>
          </label>
        </div>

        {/* Top Gradient */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-black/80 to-transparent pointer-events-none z-10" />
        
        {/* Bottom Gradient */}
        <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-10" />

        {/* Ad Details Overlay (Editable) */}
        <div className="absolute left-4 bottom-[96px] right-16 z-20">
          <div className="space-y-2 drop-shadow-lg">
            {/* Title Input */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="@Tajuk Promosi Anda..."
              className="w-full bg-black/20 hover:bg-black/40 focus:bg-black/60 border border-transparent hover:border-white/20 focus:border-indigo-500 rounded-lg px-2 py-1 text-sm font-black text-white tracking-tight uppercase leading-tight outline-none transition-all"
            />
            
            {/* CTA Link Input */}
            <div className="relative group/link mt-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/20 backdrop-blur-md rounded-lg text-[9px] font-black text-white uppercase tracking-widest shadow-lg hover:bg-white/30 transition-colors border border-transparent group-hover/link:border-white/40 cursor-text">
                <LinkIcon size={10} /> Ketahui Lebih Lanjut
              </div>
              <div className="absolute top-full left-0 mt-2 w-full min-w-[200px] opacity-0 group-hover/link:opacity-100 transition-opacity pointer-events-none group-hover/link:pointer-events-auto">
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://link-ke-promosi.com"
                  className="w-full bg-black/80 backdrop-blur-md border border-indigo-500/50 rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:border-indigo-500 shadow-xl"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Fake Pager UI at the bottom (Read-only representation) */}
        <div className="absolute bottom-6 left-0 right-0 z-30 pointer-events-none flex justify-center">
          <div className="w-[90%] h-[64px] rounded-full bg-black/60 backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20" />
               <span className="text-white font-black tracking-tight text-sm">#001</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[#10b981] font-mono font-bold text-sm">05:00</span>
              <div className="w-8 h-1 bg-white/30 rounded-full" />
            </div>
          </div>
        </div>
        
      </div>

      <p className="text-center text-xs text-slate-500 mt-6 max-w-md">
        Klik pada gambar untuk menukar poster promosi. Edit teks dan link pautan terus pada paparan mockup. Iklan anda akan kelihatan tepat seperti ini di telefon pelanggan.
      </p>
    </div>
  )
}
