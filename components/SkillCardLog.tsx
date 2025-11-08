'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { SKILL_CARD_CONFIG } from '@/types/game'
import { formatTimeRemaining } from '@/utils/calculations'

interface SkillCardLog {
  id: string
  card_type: string
  activator_team_id: string | null
  target_team_id: string | null
  target_location_id: string | null
  parameters: any
  end_time: string | null
  status: string
  created_at: string
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

export default function SkillCardLog({ gameSessionId }: { gameSessionId: string }) {
  const [logs, setLogs] = useState<SkillCardLog[]>([])
  const [teams, setTeams] = useState<Record<string, { name: string, color: string }>>({})
  const [locations, setLocations] = useState<Record<string, string>>({})
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    loadLogs()
    loadTeams()
    loadLocations()

    // 订阅日志变化
    const channel = supabase
      .channel('skill_card_logs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'skill_card_logs',
          filter: `game_session_id=eq.${gameSessionId}`,
        },
        () => {
          loadLogs()
        }
      )
      .subscribe()

    // 每秒更新倒计时
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => {
      channel.unsubscribe()
      clearInterval(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameSessionId])

  async function loadLogs() {
    const { data } = await supabase
      .from('skill_card_logs')
      .select('*')
      .eq('game_session_id', gameSessionId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (data) {
      setLogs(data)

      // 自动更新过期日志状态
      data.forEach(async (log) => {
        if (log.end_time && new Date(log.end_time) <= currentTime && log.status === 'active') {
          await supabase
            .from('skill_card_logs')
            .update({ status: 'expired' })
            .eq('id', log.id)
        }
      })
    }
  }

  async function loadTeams() {
    const { data } = await supabase
      .from('teams')
      .select('id, name, color')
      .eq('game_session_id', gameSessionId)

    if (data) {
      const teamMap: Record<string, { name: string, color: string }> = {}
      data.forEach((team: Team) => {
        teamMap[team.id] = { name: team.name, color: team.color }
      })
      setTeams(teamMap)
    }
  }

  async function loadLocations() {
    const { data } = await supabase
      .from('locations')
      .select('id, name')
      .eq('game_session_id', gameSessionId)

    if (data) {
      const locationMap: Record<string, string> = {}
      data.forEach((loc: Location) => {
        locationMap[loc.id] = loc.name
      })
      setLocations(locationMap)
    }
  }

  function formatLogTime(log: SkillCardLog): string {
    return new Date(log.created_at).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  function renderTeamName(teamId: string | null) {
    if (!teamId) return <span>系统</span>
    const team = teams[teamId]
    if (!team) return <span>未知队伍</span>
    return (
      <span
        className="font-semibold px-2 py-0.5 rounded text-white"
        style={{ backgroundColor: team.color }}
      >
        {team.name}
      </span>
    )
  }

  function renderLogMessage(log: SkillCardLog) {
    const cardConfig = SKILL_CARD_CONFIG[log.card_type as keyof typeof SKILL_CARD_CONFIG]
    const cardName = cardConfig?.name || log.card_type
    const time = formatLogTime(log)
    const locationName = log.target_location_id ? locations[log.target_location_id] : ''

    if (log.target_team_id) {
      return (
        <span>
          [{time}] {renderTeamName(log.activator_team_id)}对{renderTeamName(log.target_team_id)}发动{cardName}
        </span>
      )
    } else if (log.target_location_id) {
      return (
        <span>
          [{time}] {renderTeamName(log.activator_team_id)}对点位{locationName}发动{cardName}
        </span>
      )
    } else {
      return (
        <span>
          [{time}] {renderTeamName(log.activator_team_id)}使用了{cardName}
        </span>
      )
    }
  }

  function isLogActive(log: SkillCardLog): boolean {
    if (!log.end_time) return false
    return new Date(log.end_time) > currentTime && log.status === 'active'
  }

  return (
    <div className="elegant-card h-full overflow-y-auto">
      <h2 className="text-2xl font-bold text-royal-purple mb-4 flex items-center gap-2">
        <span>📜</span>
        技能卡使用日志
      </h2>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="text-gray-400 text-center py-8">
            暂无技能卡使用记录
          </div>
        ) : (
          logs.map(log => (
            <div
              key={log.id}
              className={`p-3 rounded-lg border-2 ${
                isLogActive(log)
                  ? 'border-royal-gold bg-yellow-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex-1 text-sm">
                  {renderLogMessage(log)}
                </div>
                {isLogActive(log) && log.end_time && (
                  <div className="bg-royal-purple text-white px-3 py-1 rounded-md font-semibold text-sm">
                    剩余 {formatTimeRemaining(log.end_time)}
                  </div>
                )}
              </div>
              {log.parameters && log.parameters.details && (
                <div className="mt-2 text-xs text-gray-600">
                  {log.parameters.details}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
