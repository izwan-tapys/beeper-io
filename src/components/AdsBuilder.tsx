'use client'

import React, { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Image as ImageIcon, Save, Link as LinkIcon, Check, X } from 'lucide-react'
import Cropper from 'react-easy-crop'

// Helper function to create an Image from a URL
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.src = url
  })

// Utility to crop image and return a WebP blob
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  rotation = 0
): Promise<Blob | null> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    return null
  }

  // Set canvas size to the cropped size
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  // Draw the cropped image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  // As a Blob
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(blob)
      },
      'image/webp',
      0.8
    )
  })
}

export function AdsBuilder({ merchant, onUpdate }: { merchant: any, onUpdate: (merchant: any) => void }) {
  const supabase = createClient()
  
  const [imageUrl, setImageUrl] = useState(merchant?.upsell_image_url || '')
  const [title, setTitle] = useState(merchant?.upsell_title || '')
  const [description, setDescription] = useState(merchant?.upsell_description || '')
  const [ctaText, setCtaText] = useState(merchant?.upsell_cta_text || '')
  const [linkUrl, setLinkUrl] = useState(merchant?.upsell_link_url || '')
  
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Cropper states
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.addEventListener('load', () => {
        setCropImageSrc(reader.result?.toString() || null)
      })
      reader.readAsDataURL(file)
    }
  }

  const handleConfirmCrop = async () => {
    if (!cropImageSrc || !croppedAreaPixels || !merchant) return
    
    setUploading(true)
    try {
      const croppedBlob = await getCroppedImg(cropImageSrc, croppedAreaPixels)
      if (!croppedBlob) throw new Error('Failed to crop image')

      const fileName = `ads/${merchant.id}/${Date.now()}.webp`
      
      // Delete old image if it exists to save space
      if (merchant.upsell_image_url) {
        const oldUrl = merchant.upsell_image_url;
        const bucketMatch = oldUrl.split('/merchant-logos/');
        if (bucketMatch.length === 2) {
          const oldPath = bucketMatch[1];
          await supabase.storage.from('merchant-logos').remove([oldPath]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('merchant-logos')
        .upload(fileName, croppedBlob, { 
          upsert: true,
          contentType: 'image/webp'
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('merchant-logos')
        .getPublicUrl(fileName)

      setImageUrl(publicUrl)
      setCropImageSrc(null) // Close cropper
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
        upsell_description: description.trim() || null,
        upsell_cta_text: ctaText.trim() || null,
        upsell_link_url: linkUrl.trim() || null,
        upsell_video_url: null, // Clear old video
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
        upsell_description: description.trim() || null,
        upsell_cta_text: ctaText.trim() || null,
        upsell_link_url: linkUrl.trim() || null,
        upsell_video_url: null,
      })
    }
    setSaving(false)
  }

  return (
    <div className="flex flex-col items-center">
      {/* CROPPER MODAL (Overlays the whole page) */}
      {cropImageSrc && (
        <div className="fixed inset-0 z-[9999] bg-black/90 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#1e1e24] rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-white/10">
            <div className="p-4 flex justify-between items-center border-b border-white/10">
              <h3 className="text-white font-bold">Potong & Laraskan Gambar</h3>
              <button onClick={() => setCropImageSrc(null)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white">
                <X size={16} />
              </button>
            </div>
            
            <div className="relative w-full h-[60vh] bg-black">
              <Cropper
                image={cropImageSrc}
                crop={crop}
                zoom={zoom}
                aspect={9 / 16}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                showGrid={true}
              />
            </div>

            <div className="p-6 bg-[#1e1e24] space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-xs text-white/50 font-bold uppercase">Zum</span>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>
              <button
                onClick={handleConfirmCrop}
                disabled={uploading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
              >
                {uploading ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
                {uploading ? 'Memuat naik...' : 'Sahkan Potongan'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Visual Ads Editor</h2>
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
            onChange={handleFileChange}
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
              <div className="px-4 py-2 bg-white/10 backdrop-blur rounded-lg text-white font-bold text-xs flex items-center gap-2 border border-white/20">
                <ImageIcon size={14} /> Tukar Gambar Background
              </div>
            </div>
          </label>
        </div>

        {/* Top Gradient */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-black/80 to-transparent pointer-events-none z-10" />
        
        {/* Bottom Gradient */}
        <div className="absolute bottom-0 inset-x-0 h-56 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none z-10" />

        {/* Ad Details Overlay (Editable) */}
        <div className="absolute left-4 bottom-[84px] right-16 z-40">
          <div className="space-y-1.5 drop-shadow-lg">
            {/* Title Input */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="@Tajuk Promosi Anda..."
              className="w-full bg-black/20 hover:bg-black/40 focus:bg-black/60 border border-transparent hover:border-white/20 focus:border-indigo-500 rounded-lg px-2 py-1 text-sm font-black text-white tracking-tight uppercase leading-tight outline-none transition-all"
            />
            
            {/* Description Input */}
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Taip penerangan iklan di sini (max 2-3 baris)..."
              rows={2}
              className="w-full bg-black/20 hover:bg-black/40 focus:bg-black/60 border border-transparent hover:border-white/20 focus:border-indigo-500 rounded-lg px-2 py-1 text-[11px] text-slate-100 font-medium leading-snug outline-none transition-all resize-none"
            />

            {/* CTA Button & Link Input */}
            <div className="mt-3 flex flex-col items-start gap-2">
              <input
                type="text"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                placeholder="Ketahui Lebih Lanjut"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 focus:bg-white/40 backdrop-blur-md rounded-lg text-[9px] font-black text-white uppercase tracking-widest shadow-lg border border-transparent focus:border-white/50 outline-none transition-colors w-auto"
                style={{ width: `${Math.max(ctaText.length || 20, 20)}ch` }}
              />
              <input
                type="text"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://link-ke-promosi.com"
                className="w-full bg-black/60 backdrop-blur-md border border-white/20 focus:border-indigo-500 rounded-lg px-3 py-2 text-[10px] font-mono text-white outline-none shadow-xl transition-all"
              />
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
        Klik pada gambar untuk muat naik dan memotong (crop) poster promosi. Edit teks dan link pautan terus pada paparan mockup. Iklan anda akan kelihatan tepat seperti ini di telefon pelanggan.
      </p>
    </div>
  )
}
