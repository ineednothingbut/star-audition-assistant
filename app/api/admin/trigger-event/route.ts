import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calculateEndTime, generateRandomPairing } from '@/utils/calculations'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const {
      game_session_id,
      event_type,
      target_location_id,
      duration_minutes
    } = await request.json()

    if (!game_session_id || !event_type) {
      return NextResponse.json({ success: false, message: '参数不完整' })
    }

    let parameters: any = {}
    const end_time = duration_minutes ? calculateEndTime(duration_minutes) : null

    // 特殊任务：随机配对
    if (event_type === 'special_mission') {
      const { data: teams } = await supabase
        .from('teams')
        .select('id, name')
        .eq('game_session_id', game_session_id)

      if (teams && teams.length >= 2) {
        const teamIds = teams.map(t => t.id)
        const pairs = generateRandomPairing(teamIds)

        parameters.pairs = pairs
        parameters.pairNames = pairs.map(([id1, id2]) => {
          const team1 = teams.find(t => t.id === id1)
          const team2 = teams.find(t => t.id === id2)
          return `${team1?.name}+${team2?.name}`
        }).join(', ')
      }
    }

    // 插入突发事件记录
    const { data: event, error } = await supabase
      .from('random_events')
      .insert({
        game_session_id,
        event_type,
        target_location_id,
        parameters,
        duration_minutes,
        end_time,
        status: 'active'
      })
      .select()
      .single()

    if (error) {
      console.error('Event insert error:', error)
      return NextResponse.json({ success: false, message: '创建事件失败' })
    }

    // 为收益变化类事件创建 active_effects 记录
    if (end_time) {
      await createActiveEffectForEvent(event.id, event_type, game_session_id, target_location_id, parameters, end_time)
    }

    return NextResponse.json({ success: true, event })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ success: false, message: '服务器错误' })
  }
}

async function createActiveEffectForEvent(
  sourceEventId: string,
  eventType: string,
  gameSessionId: string,
  targetLocationId: string | null,
  parameters: any,
  endTime: string
) {
  let effectType = ''
  let effectValue: number | null = null

  switch (eventType) {
    case 'income_decrease':
      effectType = 'income_decrease'
      effectValue = 0.5
      break
    case 'income_increase':
      effectType = 'income_increase'
      effectValue = 1.5
      break
    case 'golden_time':
      effectType = 'golden_time'
      effectValue = 2.0
      break
    case 'low_time':
      effectType = 'low_time'
      effectValue = 0.5
      break
    case 'special_mission':
      effectType = 'special_mission'
      effectValue = 1.0 // 100%共享
      break
  }

  if (effectType) {
    await supabase.from('active_effects').insert({
      game_session_id: gameSessionId,
      team_id: null, // 突发事件不针对特定队伍
      effect_type: effectType,
      effect_value: effectValue,
      target_location_id: targetLocationId,
      source_event_id: sourceEventId,
      parameters: eventType === 'special_mission' ? parameters : null, // 特殊任务需要存储配对信息
      end_time: endTime,
      status: 'active'
    })
  }
}

// 关闭事件
export async function PATCH(request: NextRequest) {
  try {
    const { event_id } = await request.json()

    if (!event_id) {
      return NextResponse.json({ success: false, message: '缺少事件ID' })
    }

    // 关闭事件
    const { error } = await supabase
      .from('random_events')
      .update({ status: 'expired' })
      .eq('id', event_id)

    if (error) {
      return NextResponse.json({ success: false, message: '关闭事件失败' })
    }

    // 同时关闭对应的active_effects
    await supabase
      .from('active_effects')
      .update({ status: 'expired' })
      .eq('source_event_id', event_id)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, message: '服务器错误' })
  }
}
