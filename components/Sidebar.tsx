'use client'

import { useState } from 'react'
import Link from 'next/link'

interface SidebarProps {
  gameSessionId: string
}

export default function Sidebar({ gameSessionId }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <>
      {/* 移动端切换按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-royal-purple text-white p-3 rounded-lg shadow-lg"
      >
        {isOpen ? '✕' : '☰'}
      </button>

      {/* 侧边栏 */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen bg-white shadow-xl z-40
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          w-72 overflow-y-auto
        `}
      >
        <div className="p-6 space-y-6">
          {/* Logo */}
          <div className="text-center pb-6 border-b-2 border-royal-gold">
            <div className="text-4xl mb-2">🏰</div>
            <h1 className="text-xl font-bold text-royal-purple">
              星光璀璨
            </h1>
            <p className="text-sm text-gray-600">总裁的试镜会</p>
          </div>

          {/* 导航菜单 */}
          <nav className="space-y-2">
            <Link
              href={`/game/${gameSessionId}`}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-royal-purple hover:text-white transition-colors font-semibold"
            >
              <span>🏠</span>
              <span>主页</span>
            </Link>

            <Link
              href={`/game/${gameSessionId}/encyclopedia`}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-royal-purple hover:text-white transition-colors font-semibold"
            >
              <span>📚</span>
              <span>技能卡图鉴</span>
            </Link>

            <Link
              href={`/game/${gameSessionId}/logs`}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-royal-purple hover:text-white transition-colors font-semibold"
            >
              <span>📜</span>
              <span>使用日志</span>
            </Link>

            <Link
              href={`/admin/login`}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-royal-gold hover:text-white transition-colors font-semibold border-t-2 border-gray-200 mt-4 pt-4"
            >
              <span>🔐</span>
              <span>管理员登录</span>
            </Link>
          </nav>

          {/* 装饰花纹 */}
          <div className="pt-6 border-t-2 border-royal-gold">
            <div className="text-center text-gray-400 text-sm">
              <p>实时更新</p>
              <p className="text-xs mt-1">Powered by Supabase</p>
            </div>
          </div>
        </div>
      </aside>

      {/* 移动端遮罩 */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
