'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import ScoreTable from '@/components/ScoreTable'
import EventBanner from '@/components/EventBanner'
import SkillCardLog from '@/components/SkillCardLog'
import Sidebar from '@/components/Sidebar'

interface GameSession {
  id: string
  name: string
  status: string
}

export default function GamePage({ params }: { params: { id: string } }) {
  const [gameSession, setGameSession] = useState<GameSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGameSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  async function loadGameSession() {
    const { data } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('id', params.id)
      .single()

    if (data) {
      setGameSession(data)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-royal-purple border-t-transparent mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (!gameSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="elegant-card text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            游戏场不存在
          </h2>
          <a href="/select-game" className="btn-primary">
            返回选择游戏场
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar gameSessionId={params.id} />

      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <div>
              <h1 className="text-4xl font-bold text-royal-purple mb-2">
                {gameSession.name}
              </h1>
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    gameSession.status === 'online'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-400 text-white'
                  }`}
                >
                  {gameSession.status === 'online' ? '🟢 游戏进行中' : '⚫ 游戏已结束'}
                </span>
              </div>
            </div>
          </div>

          {/* 突发事件横幅 */}
          <EventBanner gameSessionId={params.id} />
        </div>

        {/* 得分表格 */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-royal-purple mb-4">
            📊 实时得分榜
          </h2>
          <ScoreTable gameSessionId={params.id} />
        </div>

        {/* 技能卡使用日志 */}
        <div>
          <SkillCardLog gameSessionId={params.id} />
        </div>
      </main>
    </div>
  )
}
