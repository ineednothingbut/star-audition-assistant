'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface GameSession {
  id: string
  name: string
  status: string
  team_count: number
  location_count: number
  created_at: string
}

export default function SelectGame() {
  const [gameSessions, setGameSessions] = useState<GameSession[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadGameSessions()

    // 订阅游戏场变化
    const channel = supabase
      .channel('game_sessions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_sessions',
        },
        () => {
          loadGameSessions()
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  async function loadGameSessions() {
    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .order('created_at', { ascending: false })

    if (data && !error) {
      setGameSessions(data)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-royal-purple via-purple-400 to-royal-gold">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4"></div>
          <p className="text-xl">加载中...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-royal-purple via-purple-400 to-royal-gold">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8 text-white">
          <h1 className="text-5xl font-bold mb-4">🏰 选择游戏场</h1>
          <p className="text-xl">请选择一个游戏场进入</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {gameSessions.map(session => (
            <button
              key={session.id}
              onClick={() => router.push(`/game/${session.id}`)}
              className="elegant-card hover:scale-105 transition-transform cursor-pointer text-left"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-royal-purple">
                  {session.name}
                </h2>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    session.status === 'online'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-400 text-white'
                  }`}
                >
                  {session.status === 'online' ? '🟢 在线' : '⚫ 离线'}
                </span>
              </div>

              <div className="space-y-2 text-gray-600">
                <div className="flex items-center gap-2">
                  <span>👥</span>
                  <span>{session.team_count} 支队伍</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📍</span>
                  <span>{session.location_count} 个点位</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span>🕐</span>
                  <span>
                    创建于 {new Date(session.created_at).toLocaleString('zh-CN')}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t-2 border-royal-gold text-center">
                <span className="text-royal-purple font-semibold">
                  点击进入 →
                </span>
              </div>
            </button>
          ))}
        </div>

        {gameSessions.length === 0 && (
          <div className="elegant-card text-center py-12">
            <p className="text-gray-600 text-xl mb-4">
              暂无可用的游戏场
            </p>
            <p className="text-gray-500">
              请联系管理员创建游戏场
            </p>
          </div>
        )}

        <div className="text-center">
          <Link
            href="/"
            className="inline-block btn-secondary text-lg px-8 py-3"
          >
            ← 返回首页
          </Link>
        </div>
      </div>
    </main>
  )
}
