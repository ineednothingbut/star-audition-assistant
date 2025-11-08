'use client'

import Sidebar from '@/components/Sidebar'
import SkillCardLog from '@/components/SkillCardLog'

export default function LogsPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar gameSessionId={params.id} />

      <main className="flex-1 p-8">
        <div className="elegant-card">
          <h1 className="text-4xl font-bold text-royal-purple mb-8">
            📜 技能卡使用日志
          </h1>
          <SkillCardLog gameSessionId={params.id} />
        </div>
      </main>
    </div>
  )
}
