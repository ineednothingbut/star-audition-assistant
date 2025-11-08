'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { RANDOM_EVENT_CONFIG, RandomEventType } from '@/types/game'

interface Admin {
  role: 'junior' | 'mid' | 'senior'
  game_session_id: string | null
}

interface Location {
  id: string
  name: string
}

interface ActiveEvent {
  id: string
  event_type: string
  target_location_id: string | null
  parameters: any
  end_time: string | null
  created_at: string
}

interface GameSession {
  id: string
  name: string
  status: string
}

export default function EventsPage() {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [gameSessions, setGameSessions] = useState<GameSession[]>([])
  const [selectedGameSession, setSelectedGameSession] = useState('')
  const [locations, setLocations] = useState<Location[]>([])
  const [activeEvents, setActiveEvents] = useState<ActiveEvent[]>([])
  const [selectedEvent, setSelectedEvent] = useState<RandomEventType | ''>('')
  const [targetLocation, setTargetLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const router = useRouter()

  useEffect(() => {
    const adminData = localStorage.getItem('admin')
    if (!adminData) {
      router.push('/admin/login')
      return
    }

    const parsedAdmin = JSON.parse(adminData)

    if (parsedAdmin.role === 'junior') {
      alert('初级管理员无权发动突发事件')
      router.push('/admin/dashboard')
      return
    }

    setAdmin(parsedAdmin)
    loadGameSessions()
  }, [router])

  async function loadGameSessions() {
    const { data } = await supabase
      .from('game_sessions')
      .select('id, name, status')
      .eq('status', 'online')
      .order('created_at', { ascending: false })

    if (data && data.length > 0) {
      setGameSessions(data)
      setSelectedGameSession(data[0].id)
      loadData(data[0].id)
    }
  }

  useEffect(() => {
    if (selectedGameSession) {
      loadData(selectedGameSession)
    }
  }, [selectedGameSession])

  async function loadData(gameSessionId: string) {
    const { data: locationsData } = await supabase
      .from('locations')
      .select('*')
      .eq('game_session_id', gameSessionId)

    const { data: eventsData } = await supabase
      .from('random_events')
      .select('*')
      .eq('game_session_id', gameSessionId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (locationsData) setLocations(locationsData)
    if (eventsData) setActiveEvents(eventsData)

    // 订阅实时更新
    const channel = supabase
      .channel('random_events_admin')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'random_events',
          filter: `game_session_id=eq.${gameSessionId}`,
        },
        () => {
          loadData(gameSessionId)
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedEvent || !selectedGameSession) {
      setMessage({ type: 'error', text: '请选择事件类型' })
      return
    }

    const eventConfig = RANDOM_EVENT_CONFIG[selectedEvent]

    if (eventConfig.needsLocation && !targetLocation) {
      setMessage({ type: 'error', text: '请选择目标点位' })
      return
    }

    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const response = await fetch('/api/admin/trigger-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_session_id: selectedGameSession,
          event_type: selectedEvent,
          target_location_id: targetLocation || null,
          duration_minutes: eventConfig.duration || null
        })
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: 'success', text: '突发事件发动成功！' })
        setSelectedEvent('')
        setTargetLocation('')
      } else {
        setMessage({ type: 'error', text: data.message || '发动失败' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: '网络错误' })
    } finally {
      setLoading(false)
    }
  }

  async function closeEvent(eventId: string) {
    if (!confirm('确定要关闭此事件吗？')) return

    try {
      const response = await fetch('/api/admin/trigger-event', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId })
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: 'success', text: '事件已关闭' })
      } else {
        setMessage({ type: 'error', text: '关闭失败' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: '网络错误' })
    }
  }

  if (!admin) return null

  const eventConfig = selectedEvent ? RANDOM_EVENT_CONFIG[selectedEvent] : null

  return (
    <main className="min-h-screen bg-gradient-to-br from-royal-purple via-purple-400 to-royal-gold p-8">
      <div className="max-w-5xl mx-auto">
        <div className="elegant-card mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-royal-purple">
              💥 发动突发事件
            </h1>
            <button onClick={() => router.push('/admin/dashboard')} className="btn-secondary">
              ← 返回
            </button>
          </div>
        </div>

        {/* 游戏场选择器 */}
        <div className="elegant-card mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            选择游戏场
          </label>
          <select
            value={selectedGameSession}
            onChange={(e) => setSelectedGameSession(e.target.value)}
            className="w-full px-4 py-3 border-2 border-royal-gold rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-purple"
          >
            {gameSessions.map(session => (
              <option key={session.id} value={session.id}>
                {session.name}
              </option>
            ))}
          </select>
          {gameSessions.length === 0 && (
            <p className="text-sm text-red-600 mt-2">
              没有在线的游戏场。请先在游戏场管理中创建并上线游戏场。
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 发动表单 */}
          <div className="elegant-card">
            <h2 className="text-2xl font-bold text-royal-purple mb-4">发动新事件</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">事件类型</label>
                <select
                  value={selectedEvent}
                  onChange={(e) => setSelectedEvent(e.target.value as RandomEventType)}
                  className="w-full px-4 py-3 border-2 border-royal-gold rounded-lg"
                  required
                >
                  <option value="">-- 选择事件 --</option>
                  {Object.values(RANDOM_EVENT_CONFIG).map(event => (
                    <option key={event.type} value={event.type}>
                      {event.name}
                    </option>
                  ))}
                </select>
              </div>

              {eventConfig && (
                <div className="bg-blue-50 border-2 border-blue-500 p-4 rounded-lg">
                  <p className="text-sm text-blue-900 font-semibold mb-2">{eventConfig.name}</p>
                  <p className="text-sm text-blue-700">{eventConfig.description}</p>
                  {eventConfig.duration && (
                    <p className="text-sm text-blue-700 mt-2">⏱️ 持续时间: {eventConfig.duration}分钟</p>
                  )}
                </div>
              )}

              {eventConfig?.needsLocation && (
                <div>
                  <label className="block text-sm font-semibold mb-2">目标点位</label>
                  <select
                    value={targetLocation}
                    onChange={(e) => setTargetLocation(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-royal-gold rounded-lg"
                    required
                  >
                    <option value="">-- 选择点位 --</option>
                    {locations.map(location => (
                      <option key={location.id} value={location.id}>{location.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {message.text && (
                <div className={`p-4 rounded-lg border-2 ${
                  message.type === 'success'
                    ? 'bg-green-50 border-green-500 text-green-700'
                    : 'bg-red-50 border-red-500 text-red-700'
                }`}>
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 text-lg disabled:opacity-50"
              >
                {loading ? '发动中...' : '✓ 发动事件'}
              </button>
            </form>
          </div>

          {/* 活跃事件列表 */}
          <div className="elegant-card">
            <h2 className="text-2xl font-bold text-royal-purple mb-4">
              当前活跃事件 ({activeEvents.length})
            </h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {activeEvents.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  暂无活跃事件
                </div>
              ) : (
                activeEvents.map(event => {
                  const config = RANDOM_EVENT_CONFIG[event.event_type as RandomEventType]
                  const location = event.target_location_id
                    ? locations.find(l => l.id === event.target_location_id)
                    : null

                  return (
                    <div key={event.id} className="border-2 border-royal-gold rounded-lg p-4 bg-yellow-50">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-royal-purple">
                            {config?.name || event.event_type}
                          </h3>
                          {location && (
                            <p className="text-sm text-gray-600">
                              目标点位: {location.name}
                            </p>
                          )}
                          {event.parameters?.pairNames && (
                            <p className="text-sm text-gray-600 mt-1">
                              配对: {event.parameters.pairNames}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            发动时间: {new Date(event.created_at).toLocaleString('zh-CN')}
                          </p>
                        </div>
                        <button
                          onClick={() => closeEvent(event.id)}
                          className="btn-danger text-sm px-3 py-1"
                        >
                          关闭
                        </button>
                      </div>
                      {event.end_time && (
                        <div className="mt-2 bg-white px-3 py-1 rounded text-sm font-semibold">
                          剩余时间: <span className="text-royal-purple">
                            {Math.max(0, Math.floor((new Date(event.end_time).getTime() - Date.now()) / 60000))} 分钟
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
