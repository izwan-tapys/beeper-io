'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  Clock, 
  Star, 
  Calendar, 
  Loader2, 
  TrendingUp, 
  AlertTriangle,
  ArrowUpRight,
  Info
} from 'lucide-react'

interface AnalyticsDashboardProps {
  supabase: any
  merchantId: string
  merchantPlan: string
}

type DatePreset = 'today' | '7days' | 'month' | 'custom'

interface Stats {
  totalSessions: number
  avgWaitTime: number // in minutes
  gmbClicks: number
  gmbRate: number // percentage
}

export default function AnalyticsDashboard({ supabase, merchantId, merchantPlan }: AnalyticsDashboardProps) {
  const [preset, setPreset] = useState<DatePreset>('7days')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [stats, setStats] = useState<Stats>({
    totalSessions: 0,
    avgWaitTime: 0,
    gmbClicks: 0,
    gmbRate: 0
  })

  const [hourlyData, setHourlyData] = useState<{ hour: string; count: number }[]>([])
  const [dailyData, setDailyData] = useState<{ day: string; count: number }[]>([])

  useEffect(() => {
    fetchData()
  }, [preset, customStartDate, customEndDate])

  const getDateRange = () => {
    const now = new Date()
    let startDate = new Date()
    let endDate = new Date()

    if (preset === 'today') {
      startDate.setHours(0, 0, 0, 0)
      endDate.setHours(23, 59, 59, 999)
    } else if (preset === '7days') {
      startDate.setDate(now.getDate() - 7)
      startDate.setHours(0, 0, 0, 0)
    } else if (preset === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    } else if (preset === 'custom' && customStartDate && customEndDate) {
      startDate = new Date(customStartDate)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(customEndDate)
      endDate.setHours(23, 59, 59, 999)
    } else {
      // Default fallback to 7 days
      startDate.setDate(now.getDate() - 7)
      startDate.setHours(0, 0, 0, 0)
    }

    return { startDate: startDate.toISOString(), endDate: endDate.toISOString() }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const { startDate, endDate } = getDateRange()

      // 1. Fetch sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select('created_at, updated_at, status')
        .eq('merchant_id', merchantId)
        .gte('created_at', startDate)
        .lte('created_at', endDate)

      if (sessionsError) throw sessionsError

      // 2. Fetch GMB clicks
      const { data: gmbClicks, error: gmbError } = await supabase
        .from('ad_analytics')
        .select('created_at')
        .eq('merchant_id', merchantId)
        .eq('event_type', 'gmb_click')
        .gte('created_at', startDate)
        .lte('created_at', endDate)

      // Note: If merchant RLS policy is not configured yet, this might fail or return empty.
      // We catch this gracefully so the dashboard doesn't crash.
      const gmbCount = gmbError ? 0 : (gmbClicks?.length ?? 0)
      if (gmbError) {
        console.warn('GMB Analytics read failed, probably missing RLS policy. Defaulting to 0.', gmbError)
      }

      // --- CALCULATE STATS ---
      const totalSessions = sessions?.length ?? 0

      // Average wait time (only for called or completed sessions)
      let totalWaitMs = 0
      let waitCount = 0
      sessions?.forEach((session: any) => {
        if ((session.status === 'called' || session.status === 'completed') && session.updated_at) {
          const waitTime = new Date(session.updated_at).getTime() - new Date(session.created_at).getTime()
          if (waitTime > 0) {
            totalWaitMs += waitTime
            waitCount++
          }
        }
      })
      const avgWaitMin = waitCount > 0 ? Math.round((totalWaitMs / waitCount) / 60000 * 10) / 10 : 0
      const gmbRate = totalSessions > 0 ? Math.round((gmbCount / totalSessions) * 100 * 10) / 10 : 0

      setStats({
        totalSessions,
        avgWaitTime: avgWaitMin,
        gmbClicks: gmbCount,
        gmbRate
      })

      // --- PROCESS CHARTS DATA ---
      
      // Hourly Data (8:00 AM - 10:00 PM)
      const hourlyCounts: { [key: number]: number } = {}
      for (let h = 8; h <= 22; h++) hourlyCounts[h] = 0
      
      sessions?.forEach((s: any) => {
        const hour = new Date(s.created_at).getHours()
        if (hour >= 8 && hour <= 22) {
          hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1
        }
      })

      const processedHourly = Object.keys(hourlyCounts).map(h => {
        const hourNum = parseInt(h)
        const suffix = hourNum >= 12 ? 'PM' : 'AM'
        const displayHour = hourNum > 12 ? hourNum - 12 : hourNum
        return {
          hour: `${displayHour}${suffix}`,
          count: hourlyCounts[hourNum]
        }
      })
      setHourlyData(processedHourly)

      // Daily Data
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const dailyCounts: { [key: string]: number } = {
        'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0, 'Sun': 0
      }

      sessions?.forEach((s: any) => {
        const dayName = days[new Date(s.created_at).getDay()]
        if (dailyCounts[dayName] !== undefined) {
          dailyCounts[dayName]++
        }
      })

      const processedDaily = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
        day,
        count: dailyCounts[day]
      }))
      setDailyData(processedDaily)

    } catch (err: any) {
      console.error('Error fetching analytics:', err)
      setError(err.message || 'Gagal memuatkan data analitis.')
    } finally {
      setLoading(false)
    }
  }

  // Find max value in charts to scale them
  const maxHourCount = Math.max(...hourlyData.map(d => d.count), 1)
  const maxDayCount = Math.max(...dailyData.map(d => d.count), 1)

  return (
    <div className="space-y-6">
      {/* Date Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-2xl">
        <div className="flex gap-2 p-1 bg-black/20 rounded-xl w-full sm:w-auto">
          {(['today', '7days', 'month', 'custom'] as DatePreset[]).map(p => (
            <button
              key={p}
              onClick={() => setPreset(p)}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all capitalize ${
                preset === p 
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {p === 'today' ? 'Hari Ini' : p === '7days' ? '7 Hari Lalu' : p === 'month' ? 'Bulan Ini' : 'Kustom'}
            </button>
          ))}
        </div>

        {preset === 'custom' && (
          <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
            <input
              type="date"
              value={customStartDate}
              onChange={e => setCustomStartDate(e.target.value)}
              className="bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 w-full sm:w-auto"
            />
            <span className="text-slate-500 text-xs">to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={e => setCustomEndDate(e.target.value)}
              className="bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 w-full sm:w-auto"
            />
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 size={32} className="animate-spin text-indigo-500 mb-4" />
          <p className="text-slate-500 animate-pulse text-sm">Memuatkan data analitis...</p>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl text-center">
          <AlertTriangle size={32} className="text-red-400 mx-auto mb-2" />
          <p className="text-red-200 text-sm mb-4">{error}</p>
          <button onClick={fetchData} className="px-4 py-2 bg-red-500 text-white text-xs font-bold rounded-xl hover:bg-red-600">
            Cuba Lagi
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Total Sessions */}
            <motion.div 
              whileHover={{ y: -4 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                  <Users size={22} className="text-indigo-400" />
                </div>
                <div className="flex items-center gap-1 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  <TrendingUp size={12} /> Live
                </div>
              </div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Jumlah Pelanggan</p>
              <h3 className="text-3xl font-black text-white mt-1">{stats.totalSessions}</h3>
              <p className="text-slate-500 text-[10px] mt-2">Sesi pager yang aktif dan selesai</p>
            </motion.div>

            {/* Card 2: Avg Wait Time */}
            <motion.div 
              whileHover={{ y: -4 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-violet-500/10 rounded-2xl border border-violet-500/20">
                  <Clock size={22} className="text-violet-400" />
                </div>
              </div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Purata Menunggu</p>
              <h3 className="text-3xl font-black text-white mt-1">
                {stats.avgWaitTime} <span className="text-lg font-bold text-slate-400">min</span>
              </h3>
              <p className="text-slate-500 text-[10px] mt-2">Dari pesanan dicetak ke panggilan pesanan</p>
            </motion.div>

            {/* Card 3: GMB clicks & Conversion */}
            <motion.div 
              whileHover={{ y: -4 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                    <Star size={22} className="text-emerald-400" />
                  </div>
                  <div className="flex items-center gap-0.5 text-xs text-indigo-400 font-bold">
                    Con. Rate: {stats.gmbRate}% <ArrowUpRight size={14} />
                  </div>
                </div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Klik Google Review</p>
                <h3 className="text-3xl font-black text-white mt-1">{stats.gmbClicks}</h3>
              </div>

              {/* Free Plan Progress Limit Indicator */}
              {merchantPlan === 'free' && (
                <div className="mt-4 pt-3 border-t border-white/5">
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>Had Percuma Bulanan</span>
                    <span className="font-bold text-white">{stats.gmbClicks} / 30 klik</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${stats.gmbClicks >= 30 ? 'bg-red-500' : stats.gmbClicks >= 24 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min((stats.gmbClicks / 30) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Peak Hours (Waktu Puncak) CSS Chart */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3Icon size={18} className="text-indigo-400" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Waktu Puncak (Peak Hours)</h4>
              </div>
              
              {/* CSS Bar Chart container */}
              <div className="flex items-end justify-between h-[180px] gap-1 px-2 border-b border-white/10 pb-2">
                {hourlyData.map((d, index) => {
                  const barHeight = (d.count / maxHourCount) * 100
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                      {/* Tooltip on hover */}
                      <div className="absolute -top-10 scale-0 group-hover:scale-100 transition-all bg-indigo-500 text-white font-bold text-[10px] px-2 py-1 rounded-md z-30 shadow-lg pointer-events-none">
                        {d.count} pesanan
                      </div>
                      
                      {/* Bar */}
                      <div 
                        className="w-full bg-gradient-to-t from-indigo-600/20 to-indigo-500 hover:to-indigo-400 rounded-t-sm transition-all duration-500 relative"
                        style={{ height: `${barHeight}%`, minHeight: d.count > 0 ? '4px' : '0px' }}
                      />
                    </div>
                  )
                })}
              </div>
              {/* Hourly labels */}
              <div className="flex justify-between px-2 pt-2 text-[8px] sm:text-[10px] text-slate-500">
                <span>8:00 AM</span>
                <span>12:00 PM</span>
                <span>4:00 PM</span>
                <span>8:00 PM</span>
                <span>10:00 PM</span>
              </div>
              <p className="text-slate-500 text-[10px] mt-4 flex items-center gap-1"><Info size={12} /> Busiest hour metrics are gathered based on order print times.</p>
            </div>

            {/* Peak Days (Hari Puncak) CSS Chart */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3Icon size={18} className="text-violet-400" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Hari Puncak (Peak Days)</h4>
              </div>

              {/* CSS Bar Chart container */}
              <div className="flex items-end justify-between h-[180px] gap-4 px-4 border-b border-white/10 pb-2">
                {dailyData.map((d, index) => {
                  const barHeight = (d.count / maxDayCount) * 100
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                      {/* Tooltip */}
                      <div className="absolute -top-10 scale-0 group-hover:scale-100 transition-all bg-violet-500 text-white font-bold text-[10px] px-2 py-1 rounded-md z-30 shadow-lg pointer-events-none">
                        {d.count} pesanan
                      </div>

                      {/* Bar */}
                      <div 
                        className="w-full bg-gradient-to-t from-violet-600/20 to-violet-500 hover:to-violet-400 rounded-t-md transition-all duration-500"
                        style={{ height: `${barHeight}%`, minHeight: d.count > 0 ? '4px' : '0px' }}
                      />
                      
                      {/* Label */}
                      <span className="text-[10px] text-slate-400 group-hover:text-white mt-2 font-semibold">{d.day}</span>
                    </div>
                  )
                })}
              </div>
              <p className="text-slate-500 text-[10px] mt-4 flex items-center gap-1"><Info size={12} /> Helps identify which days require more floor staff.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Custom wrapper icon for BarChart3 to avoid lucide issues
function BarChart3Icon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
      style={{ width: props.size, height: props.size }}
    >
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  )
}
