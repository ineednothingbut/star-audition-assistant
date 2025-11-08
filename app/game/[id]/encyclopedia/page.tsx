'use client'

import Sidebar from '@/components/Sidebar'
import SkillCardEncyclopedia from '@/components/SkillCardEncyclopedia'

export default function EncyclopediaPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar gameSessionId={params.id} />

      <main className="flex-1 p-8">
        <SkillCardEncyclopedia />
      </main>
    </div>
  )
}
