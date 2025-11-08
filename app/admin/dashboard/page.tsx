'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Admin {
  id: string
  username: string
  role: 'junior' | 'mid' | 'senior'
  game_session_id: string | null
  assigned_location_id: string | null
}

export default function AdminDashboard() {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const router = useRouter()

  useEffect(() => {
    // 检查登录状态
    const adminData = localStorage.getItem('admin')
    if (!adminData) {
      router.push('/admin/login')
      return
    }

    setAdmin(JSON.parse(adminData))
  }, [router])

  function handleLogout() {
    localStorage.removeItem('admin')
    router.push('/admin/login')
  }

  if (!admin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-royal-purple border-t-transparent"></div>
      </div>
    )
  }

  const roleNames = {
    junior: '初级管理员',
    mid: '中级管理员',
    senior: '高级管理员'
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-royal-purple via-purple-400 to-royal-gold p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="elegant-card mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold text-royal-purple mb-2">
                🎮 管理员中控台
              </h1>
              <p className="text-gray-600">
                欢迎, <span className="font-semibold">{admin.username}</span> ({roleNames[admin.role]})
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="btn-danger"
            >
              🚪 退出登录
            </button>
          </div>
        </div>

        {/* 功能卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 修改星星数 */}
          {(admin.role === 'junior' || admin.role === 'mid' || admin.role === 'senior') && (
            <Link
              href="/admin/edit-stars"
              className="elegant-card hover:scale-105 transition-transform cursor-pointer"
            >
              <div className="text-5xl mb-4">⭐</div>
              <h2 className="text-2xl font-bold text-royal-purple mb-2">
                修改星星数
              </h2>
              <p className="text-gray-600">
                {admin.role === 'junior'
                  ? '修改指定点位的星星数'
                  : '修改任意单元格的星星数'}
              </p>
            </Link>
          )}

          {/* 发动技能卡 */}
          {(admin.role === 'mid' || admin.role === 'senior') && (
            <Link
              href="/admin/skill-cards"
              className="elegant-card hover:scale-105 transition-transform cursor-pointer"
            >
              <div className="text-5xl mb-4">🃏</div>
              <h2 className="text-2xl font-bold text-royal-purple mb-2">
                发动技能卡
              </h2>
              <p className="text-gray-600">
                帮助玩家发动各种技能卡效果
              </p>
            </Link>
          )}

          {/* 发动突发事件 */}
          {(admin.role === 'mid' || admin.role === 'senior') && (
            <Link
              href="/admin/events"
              className="elegant-card hover:scale-105 transition-transform cursor-pointer"
            >
              <div className="text-5xl mb-4">💥</div>
              <h2 className="text-2xl font-bold text-royal-purple mb-2">
                发动突发事件
              </h2>
              <p className="text-gray-600">
                触发各种突发事件影响游戏
              </p>
            </Link>
          )}

          {/* 游戏场管理 */}
          {admin.role === 'senior' && (
            <Link
              href="/admin/game-sessions"
              className="elegant-card hover:scale-105 transition-transform cursor-pointer"
            >
              <div className="text-5xl mb-4">🏰</div>
              <h2 className="text-2xl font-bold text-royal-purple mb-2">
                游戏场管理
              </h2>
              <p className="text-gray-600">
                创建/删除游戏场,设置队伍和点位
              </p>
            </Link>
          )}

          {/* 账号管理 */}
          {admin.role === 'senior' && (
            <Link
              href="/admin/accounts"
              className="elegant-card hover:scale-105 transition-transform cursor-pointer"
            >
              <div className="text-5xl mb-4">👥</div>
              <h2 className="text-2xl font-bold text-royal-purple mb-2">
                账号管理
              </h2>
              <p className="text-gray-600">
                创建/删除管理员账号
              </p>
            </Link>
          )}

          {/* 查看游戏 */}
          <Link
            href="/select-game"
            className="elegant-card hover:scale-105 transition-transform cursor-pointer"
          >
            <div className="text-5xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-royal-purple mb-2">
              查看游戏
            </h2>
            <p className="text-gray-600">
              查看实时得分和游戏状态
            </p>
          </Link>
        </div>

        {/* 返回首页 */}
        <div className="mt-8 text-center">
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
