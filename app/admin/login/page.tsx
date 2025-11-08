'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // 由于Supabase不支持直接查询password_hash,我们需要创建一个API端点或edge function
      // 这里暂时简化处理,实际应该使用服务端API
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      const data = await response.json()

      if (data.success) {
        // 存储管理员信息到localStorage
        localStorage.setItem('admin', JSON.stringify(data.admin))
        router.push('/admin/dashboard')
      } else {
        setError(data.message || '登录失败')
      }
    } catch (err) {
      setError('登录失败,请检查网络连接')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-royal-purple via-purple-400 to-royal-gold p-4">
      <div className="elegant-card max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🔐</div>
          <h1 className="text-3xl font-bold text-royal-purple mb-2">
            管理员登录
          </h1>
          <p className="text-gray-600">
            请使用管理员账号登录中控台
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              用户名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border-2 border-royal-gold rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-purple"
              placeholder="请输入用户名"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-royal-gold rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-purple"
              placeholder="请输入密码"
              required
            />
          </div>

          {error && (
            <div className="bg-red-100 border-2 border-red-500 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-royal-purple hover:underline font-semibold"
          >
            ← 返回首页
          </a>
        </div>

        <div className="mt-8 pt-6 border-t-2 border-gray-200 text-sm text-gray-600">
          <p className="font-semibold mb-2">权限说明:</p>
          <ul className="space-y-1 text-xs">
            <li>• <strong>初级管理员:</strong> 只能修改指定点位的星星数</li>
            <li>• <strong>中级管理员:</strong> 可修改任意单元格、发动技能卡和突发事件</li>
            <li>• <strong>高级管理员:</strong> 完全控制权限,管理游戏场和账号</li>
          </ul>
        </div>
      </div>
    </main>
  )
}
