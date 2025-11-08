import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '星光璀璨：总裁的试镜会',
  description: '游戏辅助网站 - 实时得分跟踪与技能卡管理系统',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="font-serif">{children}</body>
    </html>
  )
}
