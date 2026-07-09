// ─── Dashboard Types ─────────────────────────────────────────────────────────

export type Session = {
  id: string
  receipt_number: string
  status: 'waiting' | 'called' | 'completed' | 'archived'
  is_confirmed: boolean
  created_at: string
}

export type Merchant = {
  id: string
  name: string
  is_open: boolean
  logo_url: string | null
  loyverse_token: string | null
  gmb_url: string | null
  phone: string | null
  is_verified: boolean
  plan_type: 'free' | 'basic' | 'pro'
  subscription_status: 'active' | 'expired' | 'trial'
  expiry_date: string | null
  theme_color: string | null
  upsell_video_url: string | null
  upsell_image_url: string | null
  upsell_title: string | null
  upsell_description: string | null
  upsell_cta_text: string | null
  upsell_link_url: string | null
  state: string | null
  category: string | null
}

// ─── Pager Types ─────────────────────────────────────────────────────────────

export type PagerStatus = 'loading' | 'confirm' | 'waiting' | 'called' | 'completed' | 'error'

export interface SessionRecord {
  id: string
  status: string
  is_confirmed: boolean
  updated_at: string
  created_at: string
  receipt_number: string
  merchant_id: string
  client_uuid: string | null
  merchants: {
    name: string
    logo_url: string | null
    gmb_url: string | null
    theme_color: string | null
    plan_type: string | null
    subscription_status: string | null
    expiry_date: string | null
    upsell_title: string | null
    upsell_description: string | null
    upsell_link_url: string | null
    upsell_video_url: string | null
    upsell_image_url: string | null
    upsell_cta_text: string | null
    latitude: number | null
    longitude: number | null
    category: string | null
    state: string | null
  } | null
}
