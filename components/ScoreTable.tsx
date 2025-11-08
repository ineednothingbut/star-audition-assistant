'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'

type Team = Database['public']['Tables']['teams']['Row']
type Location = Database['public']['Tables']['locations']['Row']
type StarRecord = Database['public']['Tables']['star_records']['Row']

interface ScoreData {
  team: Team
  records: Record<string, StarRecord>
  totalPoints: number
}

export default function ScoreTable({ gameSessionId }: { gameSessionId: string }) {
  const [teams, setTeams] = useState<Team[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [scoreData, setScoreData] = useState<ScoreData[]>([])
  const [loading, setLoading] = useState(true)

  // 加载数据
  useEffect(() => {
    loadData()

    // 订阅实时更新
    const starRecordsChannel = supabase
      .channel('star_records_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'star_records',
          filter: `game_session_id=eq.${gameSessionId}`,
        },
        () => {
          loadData()
        }
      )
      .subscribe()

    const teamsChannel = supabase
      .channel('teams_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'teams',
          filter: `game_session_id=eq.${gameSessionId}`,
        },
        () => {
          loadData()
        }
      )
      .subscribe()

    return () => {
      starRecordsChannel.unsubscribe()
      teamsChannel.unsubscribe()
    }
  }, [gameSessionId])

  async function loadData() {
    try {
      // 加载队伍
      const { data: teamsData } = await supabase
        .from('teams')
        .select('*')
        .eq('game_session_id', gameSessionId)
        .order('display_order', { ascending: true })

      // 加载点位
      const { data: locationsData } = await supabase
        .from('locations')
        .select('*')
        .eq('game_session_id', gameSessionId)
        .order('display_order', { ascending: true })

      // 加载星星记录
      const { data: recordsData } = await supabase
        .from('star_records')
        .select('*')
        .eq('game_session_id', gameSessionId)

      if (teamsData && locationsData && recordsData) {
        setTeams(teamsData)
        setLocations(locationsData)

        // 组织数据
        const organized = teamsData.map(team => {
          const teamRecords: Record<string, StarRecord> = {}
          let totalPoints = 0

          locationsData.forEach(location => {
            const record = recordsData.find(
              r => r.team_id === team.id && r.location_id === location.id
            )
            if (record) {
              teamRecords[location.id] = record
              totalPoints += record.points
            }
          })

          return {
            team,
            records: teamRecords,
            totalPoints
          }
        })

        // 按总积分降序排序
        organized.sort((a, b) => b.totalPoints - a.totalPoints)
        setScoreData(organized)
      }

      setLoading(false)
    } catch (error) {
      console.error('Error loading data:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-royal-gold border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse elegant-card">
        <thead>
          <tr className="bg-royal-purple text-white">
            <th className="p-3 text-left font-semibold border-2 border-royal-gold">
              组别
            </th>
            {locations.map(location => (
              <th
                key={location.id}
                className="p-3 text-center font-semibold border-2 border-royal-gold"
              >
                {location.name}
              </th>
            ))}
            <th className="p-3 text-center font-semibold border-2 border-royal-gold">
              总积分
            </th>
          </tr>
        </thead>
        <tbody>
          {scoreData.map(({ team, records, totalPoints }) => (
            <tr
              key={team.id}
              className="transition-colors hover:opacity-90"
            >
              <td className="p-3 border-2 border-gray-300">
                <span
                  className="font-semibold px-3 py-1 rounded text-white inline-block"
                  style={{ backgroundColor: team.color }}
                >
                  {team.name}
                </span>
              </td>
              {locations.map(location => {
                const record = records[location.id]
                return (
                  <td
                    key={location.id}
                    className="p-3 text-center border-2 border-gray-300"
                  >
                    {record ? (
                      <div className="flex flex-col items-center">
                        <span className="flex items-center gap-1">
                          <span>⭐</span>
                          <span className="font-semibold">{record.stars}</span>
                        </span>
                        <span className="flex items-center gap-1 text-sm">
                          <span>👑</span>
                          <span className="font-semibold">{record.points}</span>
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-gray-400">
                        <span>⭐0</span>
                        <span className="text-sm">👑0</span>
                      </div>
                    )}
                  </td>
                )
              })}
              <td className="p-3 text-center font-bold text-xl border-2 border-gray-300">
                {totalPoints}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
