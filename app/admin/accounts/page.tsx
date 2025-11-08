'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Admin {
  role: 'junior' | 'mid' | 'senior'
}

interface AdminAccount {
  id: string
  username: string
  role: 'junior' | 'mid' | 'senior'
  game_session_id: string | null
  assigned_location_id: string | null
  created_at: string
}

interface GameSession {
  id: string
  name: string
}

interface Location {
  id: string
  name: string
  game_session_id: string
}

export default function AccountsPage() {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [accounts, setAccounts] = useState<AdminAccount[]>([])
  const [gameSessions, setGameSessions] = useState<GameSession[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)

  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState<'junior' | 'mid' | 'senior'>('mid')
  const [selectedGameSession, setSelectedGameSession] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('')

  const [message, setMessage] = useState({ type: '', text: '' })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const adminData = localStorage.getItem('admin')
    if (!adminData) {
      router.push('/admin/login')
      return
    }

    const parsedAdmin = JSON.parse(adminData)

    if (parsedAdmin.role !== 'senior') {
      alert('只有高级管理员可以管理账号')
      router.push('/admin/dashboard')
      return
    }

    setAdmin(parsedAdmin)
    loadData()
  }, [router])

  async function loadData() {
    const { data: accountsData } = await supabase
      .from('admins')
      .select('id, username, role, game_session_id, assigned_location_id, created_at')
      .order('created_at', { ascending: false })

    const { data: sessionsData } = await supabase
      .from('game_sessions')
      .select('id, name')

    const { data: locationsData } = await supabase
      .from('locations')
      .select('id, name, game_session_id')

    if (accountsData) setAccounts(accountsData)
    if (sessionsData) setGameSessions(sessionsData)
    if (locationsData) setLocations(locationsData)
  }

  function getGameSessionName(sessionId: string | null): string {
    if (!sessionId) return '-'
    const session = gameSessions.find(s => s.id === sessionId)
    return session?.name || '未知'
  }

  function getLocationName(locationId: string | null): string {
    if (!locationId) return '-'
    const location = locations.find(l => l.id === locationId)
    return location?.name || '未知'
  }

  const roleNames = {
    junior: '初级管理员',
    mid: '中级管理员',
    senior: '高级管理员'
  }

  async function createAccount() {
    if (!newUsername.trim() || !newPassword.trim()) {
      setMessage({ type: 'error', text: '请填写用户名和密码' })
      return
    }

    if (newRole === 'mid' && !selectedGameSession) {
      setMessage({ type: 'error', text: '请选择游戏场' })
      return
    }

    if (newRole === 'junior' && (!selectedGameSession || !selectedLocation)) {
      setMessage({ type: 'error', text: '请选择游戏场和点位' })
      return
    }

    setLoading(true)

    try {
      // 调用API创建账号（密码会在服务端使用bcrypt哈希）
      const response = await fetch('/api/admin/create-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          role: newRole,
          game_session_id: (newRole === 'junior' || newRole === 'mid') ? selectedGameSession : null,
          assigned_location_id: newRole === 'junior' ? selectedLocation : null
        })
      })

      const result = await response.json()

      if (result.success) {
        setMessage({ type: 'success', text: '账号创建成功！' })
        setNewUsername('')
        setNewPassword('')
        setNewRole('mid')
        setSelectedGameSession('')
        setSelectedLocation('')
        setShowCreateForm(false)
        loadData()
      } else {
        setMessage({ type: 'error', text: result.message || '创建失败' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: '创建失败' })
    } finally {
      setLoading(false)
    }
  }

  async function deleteAccount(accountId: string, username: string) {
    if (!confirm(`确定要删除账号"${username}"吗？`)) return

    try {
      const { error } = await supabase
        .from('admins')
        .delete()
        .eq('id', accountId)

      if (!error) {
        setMessage({ type: 'success', text: '账号已删除' })
        loadData()
      } else {
        setMessage({ type: 'error', text: '删除失败' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: '删除失败' })
    }
  }

  const availableLocations = locations.filter(
    l => l.game_session_id === selectedGameSession
  )

  if (!admin) return null

  return (
    <main className="min-h-screen bg-gradient-to-br from-royal-purple via-purple-400 to-royal-gold p-8">
      <div className="max-w-7xl mx-auto">
        <div className="elegant-card mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h1 className="text-3xl font-bold text-royal-purple">
              👥 账号管理
            </h1>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="btn-primary"
              >
                {showCreateForm ? '取消' : '+ 创建账号'}
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
              创建新账号
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">用户名</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-royal-gold rounded-lg"
                  placeholder="输入用户名"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">密码</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-royal-gold rounded-lg"
                  placeholder="输入密码"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">角色</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full px-4 py-2 border-2 border-royal-gold rounded-lg"
                >
                  <option value="junior">初级管理员</option>
                  <option value="mid">中级管理员</option>
                  <option value="senior">高级管理员</option>
                </select>
              </div>
              {(newRole === 'junior' || newRole === 'mid') && (
                <div>
                  <label className="block text-sm font-semibold mb-2">游戏场</label>
                  <select
                    value={selectedGameSession}
                    onChange={(e) => setSelectedGameSession(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-royal-gold rounded-lg"
                  >
                    <option value="">-- 选择游戏场 --</option>
                    {gameSessions.map(session => (
                      <option key={session.id} value={session.id}>{session.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {newRole === 'junior' && selectedGameSession && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2">分配点位</label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-royal-gold rounded-lg"
                  >
                    <option value="">-- 选择点位 --</option>
                    {availableLocations.map(location => (
                      <option key={location.id} value={location.id}>{location.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <button
              onClick={createAccount}
              disabled={loading}
              className="mt-4 w-full btn-primary py-3 disabled:opacity-50"
            >
              {loading ? '创建中...' : '创建账号'}
            </button>
          </div>
        )}

        <div className="elegant-card">
          <h2 className="text-2xl font-bold text-royal-purple mb-4">
            现有账号 ({accounts.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-royal-purple text-white">
                <tr>
                  <th className="p-3 text-left">用户名</th>
                  <th className="p-3 text-left">角色</th>
                  <th className="p-3 text-left">游戏场</th>
                  <th className="p-3 text-left">分配点位</th>
                  <th className="p-3 text-left">创建时间</th>
                  <th className="p-3 text-center">操作</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map(account => (
                  <tr key={account.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-semibold">{account.username}</td>
                    <td className="p-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        account.role === 'senior'
                          ? 'bg-red-500 text-white'
                          : account.role === 'mid'
                          ? 'bg-blue-500 text-white'
                          : 'bg-green-500 text-white'
                      }`}>
                        {roleNames[account.role]}
                      </span>
                    </td>
                    <td className="p-3">{getGameSessionName(account.game_session_id)}</td>
                    <td className="p-3">{getLocationName(account.assigned_location_id)}</td>
                    <td className="p-3 text-sm text-gray-600">
                      {new Date(account.created_at).toLocaleString('zh-CN')}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => deleteAccount(account.id, account.username)}
                        className="btn-danger px-3 py-1 text-sm"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="elegant-card mt-6">
          <div className="bg-green-50 border-2 border-green-500 p-4 rounded-lg">
            <h3 className="font-bold text-green-900 mb-2">🔒 安全信息</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• ✅ 密码使用bcrypt进行安全哈希存储</li>
              <li>• ✅ 所有新账号密码自动加密处理</li>
              <li>• 建议使用强密码（至少8位，包含字母、数字）</li>
              <li>• 建议定期更换管理员密码</li>
              <li>• 初级管理员只能修改指定点位的星星数</li>
              <li>• 中级管理员可以发动技能卡和突发事件</li>
              <li>• 高级管理员拥有完全控制权限</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  )
}
