'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatTimeRemaining } from '@/utils/calculations'

interface RandomEvent {
  id: string
  event_type: string
  target_location_id: string | null
  parameters: any
  end_time: string | null
  created_at: string
}

interface Location {
  id: string
  name: string
}

export default function EventBanner({ gameSessionId }: { gameSessionId: string }) {
  const [events, setEvents] = useState<RandomEvent[]>([])
  const [locations, setLocations] = useState<Record<string, string>>({})
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    loadEvents()
    loadLocations()

    // 订阅事件变化
    const channel = supabase
      .channel('random_events_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'random_events',
          filter: `game_session_id=eq.${gameSessionId}`,
        },
        () => {
          loadEvents()
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
  }, [gameSessionId])

  async function loadEvents() {
    const { data } = await supabase
      .from('random_events')
      .select('*')
      .eq('game_session_id', gameSessionId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (data) {
      // 过滤掉已过期的事件
      const activeEvents = data.filter(event => {
        if (!event.end_time) return true
        return new Date(event.end_time) > currentTime
      })
      setEvents(activeEvents)

      // 自动更新过期事件状态
      data.forEach(async (event) => {
        if (event.end_time && new Date(event.end_time) <= currentTime && event.status === 'active') {
          await supabase
            .from('random_events')
            .update({ status: 'expired' })
            .eq('id', event.id)
        }
      })
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

  function getEventMessage(event: RandomEvent): string {
    const locationName = event.target_location_id ? locations[event.target_location_id] : ''

    switch (event.event_type) {
      case 'income_decrease':
        return `🚨 收益波动!点位${locationName},在接下来的15分钟内,星星收益减少为原来的50%`
      case 'income_increase':
        return `✨ 收益波动!点位${locationName},在接下来的15分钟内,星星收益提升至原来的1.5倍`
      case 'supply_drop':
        return `🎁 天降甘霖!地图上随机出现3个补给箱,找到场上带红色帽子的NPC可获得技能卡补给`
      case 'golden_time':
        return `💰 黄金时间到!所有点位收益翻倍,持续10分钟!`
      case 'low_time':
        return `📉 低谷时间到!所有点位收益减半,持续10分钟!`
      case 'special_mission':
        const pairNames = event.parameters?.pairNames || '未知'
        return `🤝 侦测到特殊任务！发布组队挑战！所有队伍将随机两两配对，在接下来的8分钟内，结为同盟的两个队伍，彼此共享在一个点位获得的星星，即A队在某个点位得1星，B队也自动获得1星。同盟队伍为：${pairNames}`
      default:
        return '突发事件'
    }
  }

  if (events.length === 0) {
    return null
  }

  return (
    <div className="w-full space-y-2">
      {events.map(event => (
        <div
          key={event.id}
          className="bg-gradient-to-r from-royal-red to-royal-purple text-white p-4 rounded-lg shadow-lg animate-pulse"
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex-1 font-semibold text-lg">
              {getEventMessage(event)}
            </div>
            {event.end_time && (
              <div className="bg-white text-royal-purple px-4 py-2 rounded-md font-bold text-xl">
                ⏱️ {formatTimeRemaining(event.end_time)}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
