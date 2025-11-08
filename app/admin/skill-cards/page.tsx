'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { SKILL_CARD_CONFIG, SkillCardType } from '@/types/game'

interface Admin {
  role: 'junior' | 'mid' | 'senior'
  game_session_id: string | null
}

interface Team {
  id: string
  name: string
  color: string
}

interface Location {
  id: string
  name: string
}

interface StarRecord {
  team_id: string
  location_id: string
  stars: number
}

interface GameSession {
  id: string
  name: string
  status: string
}

export default function SkillCardsPage() {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [gameSessions, setGameSessions] = useState<GameSession[]>([])
  const [selectedGameSession, setSelectedGameSession] = useState('')
  const [teams, setTeams] = useState<Team[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [starRecords, setStarRecords] = useState<StarRecord[]>([])
  const [selectedCard, setSelectedCard] = useState<SkillCardType | ''>('')
  const [activatorTeam, setActivatorTeam] = useState('')
  const [targetTeam, setTargetTeam] = useState('')
  const [targetLocation, setTargetLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  // 星辉馈赠/星蚀分配
  const [allocations, setAllocations] = useState<Array<{team_id: string, location_id: string, amount: number}>>([])
  const [totalAllocated, setTotalAllocated] = useState(0)

  const router = useRouter()

  useEffect(() => {
    const adminData = localStorage.getItem('admin')
    if (!adminData) {
      router.push('/admin/login')
      return
    }

    const parsedAdmin = JSON.parse(adminData)

    if (parsedAdmin.role === 'junior') {
      alert('初级管理员无权发动技能卡')
      router.push('/admin/dashboard')
      return
    }

    setAdmin(parsedAdmin)
    loadGameSessions()
  }, [router])

  async function loadGameSessions() {
    const { data } = await supabase
      .from('game_sessions')
      .select('id, name, status')
      .eq('status', 'online')
      .order('created_at', { ascending: false })

    if (data && data.length > 0) {
      setGameSessions(data)
      setSelectedGameSession(data[0].id)
      loadData(data[0].id)
    }
  }

  useEffect(() => {
    if (selectedGameSession) {
      loadData(selectedGameSession)
    }
  }, [selectedGameSession])

  async function loadData(gameSessionId: string) {
    const { data: teamsData } = await supabase
      .from('teams')
      .select('*')
      .eq('game_session_id', gameSessionId)

    const { data: locationsData } = await supabase
      .from('locations')
      .select('*')
      .eq('game_session_id', gameSessionId)

    const { data: recordsData } = await supabase
      .from('star_records')
      .select('team_id, location_id, stars')
      .eq('game_session_id', gameSessionId)

    if (teamsData) setTeams(teamsData)
    if (locationsData) setLocations(locationsData)
    if (recordsData) setStarRecords(recordsData)
  }

  function getMaxAllocation(): number {
    if (!selectedCard) return 0
    if (selectedCard === SkillCardType.STAR_GIFT_3 || selectedCard === SkillCardType.STAR_ECLIPSE_3) return 3
    if (selectedCard === SkillCardType.STAR_GIFT_5 || selectedCard === SkillCardType.STAR_ECLIPSE_5) return 5
    if (selectedCard === SkillCardType.STAR_GIFT_10 || selectedCard === SkillCardType.STAR_ECLIPSE_10) return 10
    return 0
  }

  function handleAllocation(teamId: string, locationId: string, amount: number) {
    const maxAlloc = getMaxAllocation()
    const existingIndex = allocations.findIndex(
      a => a.team_id === teamId && a.location_id === locationId
    )

    let newAllocations = [...allocations]
    let newTotal = totalAllocated

    if (existingIndex >= 0) {
      newTotal -= newAllocations[existingIndex].amount
      if (amount === 0) {
        newAllocations.splice(existingIndex, 1)
      } else {
        newAllocations[existingIndex].amount = amount
        newTotal += amount
      }
    } else if (amount > 0) {
      newAllocations.push({ team_id: teamId, location_id: locationId, amount })
      newTotal += amount
    }

    if (newTotal <= maxAlloc) {
      setAllocations(newAllocations)
      setTotalAllocated(newTotal)
    } else {
      alert(`总分配不能超过${maxAlloc}颗`)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedCard || !activatorTeam || !selectedGameSession) {
      setMessage({ type: 'error', text: '请填写必要信息' })
      return
    }

    const cardConfig = SKILL_CARD_CONFIG[selectedCard]

    // 验证必填参数
    if (cardConfig.needsTarget && !targetTeam) {
      setMessage({ type: 'error', text: '请选择目标队伍' })
      return
    }

    if (cardConfig.needsLocation && !targetLocation) {
      setMessage({ type: 'error', text: '请选择目标点位' })
      return
    }

    // 验证分配
    const isAllocationCard = [
      SkillCardType.STAR_GIFT_3, SkillCardType.STAR_GIFT_5, SkillCardType.STAR_GIFT_10,
      SkillCardType.STAR_ECLIPSE_3, SkillCardType.STAR_ECLIPSE_5, SkillCardType.STAR_ECLIPSE_10
    ].includes(selectedCard)

    if (isAllocationCard && totalAllocated !== getMaxAllocation()) {
      setMessage({ type: 'error', text: `请分配完所有${getMaxAllocation()}颗星星` })
      return
    }

    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      // 准备参数
      let parameters: any = {}

      if (isAllocationCard) {
        const isEclipse = selectedCard.includes('eclipse')
        parameters.allocations = allocations.map(a => ({
          ...a,
          amount: isEclipse ? -a.amount : a.amount // 星蚀为负数
        }))
        parameters.details = allocations.map(a => {
          const team = teams.find(t => t.id === a.team_id)
          const location = locations.find(l => l.id === a.location_id)
          return `${team?.name}(${location?.name})${isEclipse ? '-' : '+'}${a.amount}`
        }).join(', ')
      }

      const response = await fetch('/api/admin/activate-skill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_session_id: selectedGameSession,
          card_type: selectedCard,
          activator_team_id: activatorTeam,
          target_team_id: targetTeam || null,
          target_location_id: targetLocation || null,
          parameters,
          duration_minutes: cardConfig.duration || null
        })
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: 'success', text: '技能卡发动成功！' })
        // 重置表单
        setSelectedCard('')
        setActivatorTeam('')
        setTargetTeam('')
        setTargetLocation('')
        setAllocations([])
        setTotalAllocated(0)
      } else {
        setMessage({ type: 'error', text: data.message || '发动失败' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: '网络错误' })
    } finally {
      setLoading(false)
    }
  }

  if (!admin) return null

  const cardConfig = selectedCard ? SKILL_CARD_CONFIG[selectedCard] : null
  const isAllocationCard = selectedCard && [
    SkillCardType.STAR_GIFT_3, SkillCardType.STAR_GIFT_5, SkillCardType.STAR_GIFT_10,
    SkillCardType.STAR_ECLIPSE_3, SkillCardType.STAR_ECLIPSE_5, SkillCardType.STAR_ECLIPSE_10
  ].includes(selectedCard)

  return (
    <main className="min-h-screen bg-gradient-to-br from-royal-purple via-purple-400 to-royal-gold p-8">
      <div className="max-w-6xl mx-auto">
        <div className="elegant-card mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-royal-purple">
              🃏 发动技能卡
            </h1>
            <button onClick={() => router.push('/admin/dashboard')} className="btn-secondary">
              ← 返回
            </button>
          </div>
        </div>

        {/* 游戏场选择器 */}
        <div className="elegant-card mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            选择游戏场
          </label>
          <select
            value={selectedGameSession}
            onChange={(e) => setSelectedGameSession(e.target.value)}
            className="w-full px-4 py-3 border-2 border-royal-gold rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-purple"
          >
            {gameSessions.map(session => (
              <option key={session.id} value={session.id}>
                {session.name}
              </option>
            ))}
          </select>
          {gameSessions.length === 0 && (
            <p className="text-sm text-red-600 mt-2">
              没有在线的游戏场。请先在游戏场管理中创建并上线游戏场。
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="elegant-card">
            <h2 className="text-2xl font-bold text-royal-purple mb-4">选择技能卡</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">技能卡类型</label>
                <select
                  value={selectedCard}
                  onChange={(e) => setSelectedCard(e.target.value as SkillCardType)}
                  className="w-full px-4 py-3 border-2 border-royal-gold rounded-lg"
                  required
                >
                  <option value="">-- 选择技能卡 --</option>
                  {Object.values(SKILL_CARD_CONFIG).map(card => (
                    <option key={card.type} value={card.type}>
                      {card.name}
                    </option>
                  ))}
                </select>
              </div>

              {cardConfig && (
                <div className="bg-blue-50 border-2 border-blue-500 p-4 rounded-lg">
                  <p className="text-sm text-blue-900 font-semibold mb-2">{cardConfig.name}</p>
                  <p className="text-sm text-blue-700">{cardConfig.description}</p>
                  {cardConfig.duration && (
                    <p className="text-sm text-blue-700 mt-2">⏱️ 持续时间: {cardConfig.duration}分钟</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold mb-2">发动队伍</label>
                <select
                  value={activatorTeam}
                  onChange={(e) => setActivatorTeam(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-royal-gold rounded-lg"
                  required
                >
                  <option value="">-- 选择队伍 --</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>

              {cardConfig?.needsTarget && (
                <div>
                  <label className="block text-sm font-semibold mb-2">目标队伍</label>
                  <select
                    value={targetTeam}
                    onChange={(e) => setTargetTeam(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-royal-gold rounded-lg"
                    required
                  >
                    <option value="">-- 选择目标队伍 --</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {cardConfig?.needsLocation && (
                <div>
                  <label className="block text-sm font-semibold mb-2">目标点位</label>
                  <select
                    value={targetLocation}
                    onChange={(e) => setTargetLocation(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-royal-gold rounded-lg"
                    required
                  >
                    <option value="">-- 选择点位 --</option>
                    {locations.map(location => (
                      <option key={location.id} value={location.id}>{location.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {message.text && (
                <div className={`p-4 rounded-lg border-2 ${
                  message.type === 'success'
                    ? 'bg-green-50 border-green-500 text-green-700'
                    : 'bg-red-50 border-red-500 text-red-700'
                }`}>
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 text-lg disabled:opacity-50"
              >
                {loading ? '发动中...' : '✓ 发动技能卡'}
              </button>
            </form>
          </div>

          {isAllocationCard && (
            <div className="elegant-card">
              <h2 className="text-2xl font-bold text-royal-purple mb-4">
                星星分配 ({totalAllocated}/{getMaxAllocation()})
              </h2>
              <div className="overflow-auto max-h-[600px]">
                <table className="w-full text-sm">
                  <thead className="bg-royal-purple text-white sticky top-0">
                    <tr>
                      <th className="p-2">队伍</th>
                      <th className="p-2">点位</th>
                      <th className="p-2">数量</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teams.flatMap(team =>
                      locations.map(location => {
                        const alloc = allocations.find(
                          a => a.team_id === team.id && a.location_id === location.id
                        )
                        return (
                          <tr key={`${team.id}-${location.id}`} className="border-b">
                            <td className="p-2">
                              <span
                                className="font-semibold px-2 py-0.5 rounded text-white"
                                style={{ backgroundColor: team.color }}
                              >
                                {team.name}
                              </span>
                            </td>
                            <td className="p-2">{location.name}</td>
                            <td className="p-2">
                              <input
                                type="number"
                                min="0"
                                max={getMaxAllocation()}
                                value={alloc?.amount || 0}
                                onChange={(e) => handleAllocation(
                                  team.id,
                                  location.id,
                                  parseInt(e.target.value) || 0
                                )}
                                className="w-20 px-2 py-1 border rounded"
                              />
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
