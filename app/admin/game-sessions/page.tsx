'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Admin {
  role: 'junior' | 'mid' | 'senior'
}

interface GameSession {
  id: string
  name: string
  status: string
  team_count: number
  location_count: number
  created_at: string
}

export default function GameSessionsPage() {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [gameSessions, setGameSessions] = useState<GameSession[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newGameName, setNewGameName] = useState('')
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

    if (parsedAdmin.role !== 'senior') {
      alert('只有高级管理员可以管理游戏场')
      router.push('/admin/dashboard')
      return
    }

    setAdmin(parsedAdmin)
    loadGameSessions()
  }, [router])

  async function loadGameSessions() {
    const { data } = await supabase
      .from('game_sessions')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) setGameSessions(data)
  }

  async function createGameSession() {
    if (!newGameName.trim()) {
      setMessage({ type: 'error', text: '请输入游戏场名称' })
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('game_sessions')
        .insert({
          name: newGameName,
          status: 'offline',
          team_count: 0,
          location_count: 0
        })
        .select()
        .single()

      if (error) throw error

      setMessage({ type: 'success', text: '游戏场创建成功！' })
      setNewGameName('')
      setShowCreateForm(false)
      loadGameSessions()
    } catch (error) {
      setMessage({ type: 'error', text: '创建失败' })
    } finally {
      setLoading(false)
    }
  }

  async function toggleStatus(sessionId: string, currentStatus: string) {
    const newStatus = currentStatus === 'online' ? 'offline' : 'online'

    const { error } = await supabase
      .from('game_sessions')
      .update({ status: newStatus })
      .eq('id', sessionId)

    if (!error) {
      setMessage({ type: 'success', text: `游戏场已${newStatus === 'online' ? '上线' : '下线'}` })
      loadGameSessions()
    }
  }

  async function deleteGameSession(sessionId: string, sessionName: string) {
    if (!confirm(`确定要删除游戏场"${sessionName}"吗？此操作将删除所有相关数据且无法恢复！`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('game_sessions')
        .delete()
        .eq('id', sessionId)

      if (!error) {
        setMessage({ type: 'success', text: '游戏场已删除' })
        loadGameSessions()
      } else {
        setMessage({ type: 'error', text: '删除失败' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: '删除失败' })
    }
  }

  if (!admin) return null

  return (
    <main className="min-h-screen bg-gradient-to-br from-royal-purple via-purple-400 to-royal-gold p-8">
      <div className="max-w-7xl mx-auto">
        <div className="elegant-card mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h1 className="text-3xl font-bold text-royal-purple">
              🏰 游戏场管理
            </h1>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="btn-primary"
              >
                {showCreateForm ? '取消' : '+ 创建游戏场'}
              </button>
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="btn-secondary"
              >
                ← 返回
              </button>
            </div>
          </div>
        </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded-lg border-2 ${
            message.type === 'success'
              ? 'bg-green-50 border-green-500 text-green-700'
              : 'bg-red-50 border-red-500 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        {showCreateForm && (
          <div className="elegant-card mb-6">
            <h2 className="text-2xl font-bold text-royal-purple mb-4">
              创建新游戏场
            </h2>
            <div className="flex gap-4">
              <input
                type="text"
                value={newGameName}
                onChange={(e) => setNewGameName(e.target.value)}
                className="flex-1 px-4 py-3 border-2 border-royal-gold rounded-lg"
                placeholder="输入游戏场名称"
              />
              <button
                onClick={createGameSession}
                disabled={loading}
                className="btn-primary px-8 disabled:opacity-50"
              >
                {loading ? '创建中...' : '创建'}
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              创建后需要在游戏场详情页面添加队伍和点位
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gameSessions.map(session => (
            <div key={session.id} className="elegant-card">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-2xl font-bold text-royal-purple">
                  {session.name}
                </h2>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  session.status === 'online'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-400 text-white'
                }`}>
                  {session.status === 'online' ? '🟢 在线' : '⚫ 离线'}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2">
                  <span>👥</span>
                  <span className="text-gray-700">{session.team_count} 支队伍</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📍</span>
                  <span className="text-gray-700">{session.location_count} 个点位</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>🕐</span>
                  <span>{new Date(session.created_at).toLocaleString('zh-CN')}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => router.push(`/admin/game-sessions/${session.id}/edit`)}
                  className="w-full btn-primary py-2 text-sm"
                >
                  ✏️ 编辑队伍和点位
                </button>
                <button
                  onClick={() => toggleStatus(session.id, session.status)}
                  className={`w-full py-2 rounded-lg font-semibold text-sm ${
                    session.status === 'online'
                      ? 'bg-gray-500 hover:bg-gray-600 text-white'
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  {session.status === 'online' ? '📴 下线' : '🟢 上线'}
                </button>
                <button
                  onClick={() => deleteGameSession(session.id, session.name)}
                  className="w-full btn-danger py-2 text-sm"
                >
                  🗑️ 删除游戏场
                </button>
              </div>
            </div>
          ))}
        </div>

        {gameSessions.length === 0 && (
          <div className="elegant-card text-center py-12">
            <p className="text-gray-600 text-xl mb-4">
              还没有游戏场
            </p>
            <p className="text-gray-500">
              点击"创建游戏场"按钮开始创建
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
