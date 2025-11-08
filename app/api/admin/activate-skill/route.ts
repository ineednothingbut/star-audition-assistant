import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calculateEndTime } from '@/utils/calculations'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const {
      game_session_id,
      card_type,
      activator_team_id,
      target_team_id,
      target_location_id,
      parameters,
      duration_minutes
    } = await request.json()

    if (!game_session_id || !card_type) {
      return NextResponse.json({ success: false, message: '参数不完整' })
    }

    // 计算结束时间
    const end_time = duration_minutes ? calculateEndTime(duration_minutes) : null

    // 插入技能卡日志
    const { data: log, error: logError } = await supabase
      .from('skill_card_logs')
      .insert({
        game_session_id,
        card_type,
        activator_team_id,
        target_team_id,
        target_location_id,
        parameters,
        duration_minutes,
        end_time,
        status: 'active'
      })
      .select()
      .single()

    if (logError) {
      console.error('Log insert error:', logError)
      return NextResponse.json({ success: false, message: '创建日志失败' })
    }

    // 如果是持续效果，创建active_effects记录
    if (duration_minutes && end_time) {
      await createActiveEffect(log.id, card_type, game_session_id, activator_team_id, target_team_id, target_location_id, parameters, end_time)
    }

    // 处理即时效果
    if (['star_gift_3', 'star_gift_5', 'star_gift_10', 'star_eclipse_3', 'star_eclipse_5', 'star_eclipse_10', 'rank_steal'].includes(card_type)) {
      await applyInstantEffect(card_type, parameters)
    }

    return NextResponse.json({ success: true, log })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ success: false, message: '服务器错误' })
  }
}

async function createActiveEffect(
  sourceCardLogId: string,
  cardType: string,
  gameSessionId: string,
  activatorTeamId: string | null,
  targetTeamId: string | null,
  targetLocationId: string | null,
  parameters: any,
  endTime: string
) {
  let effectType = ''
  let effectValue: number | null = null
  let teamId = activatorTeamId

  switch (cardType) {
    case 'efficiency_curse_5':
      effectType = 'efficiency_curse'
      effectValue = 0.3
      teamId = targetTeamId
      break
    case 'efficiency_curse_10':
      effectType = 'efficiency_curse'
      effectValue = 0.5
      teamId = targetTeamId
      break
    case 'efficiency_curse_15':
      effectType = 'efficiency_curse'
      effectValue = 0.7
      teamId = targetTeamId
      break
    case 'morale_boost_5':
      effectType = 'morale_boost'
      effectValue = 2.0
      break
    case 'morale_boost_10':
      effectType = 'morale_boost'
      effectValue = 1.5
      break
    case 'morale_boost_15':
      effectType = 'morale_boost'
      effectValue = 1.3
      break
    case 'lucky_focus':
      effectType = 'lucky_focus'
      effectValue = 2.0
      break
    case 'skill_block':
      effectType = 'skill_block'
      teamId = targetTeamId
      break
    case 'strategic_alliance':
      effectType = 'alliance'
      effectValue = 0.2
      break
  }

  if (effectType && teamId) {
    await supabase.from('active_effects').insert({
      game_session_id: gameSessionId,
      team_id: teamId,
      effect_type: effectType,
      effect_value: effectValue,
      target_location_id: targetLocationId,
      alliance_team_id: cardType === 'strategic_alliance' ? targetTeamId : null,
      source_card_log_id: sourceCardLogId,
      end_time: endTime
    })
  }
}

async function applyInstantEffect(cardType: string, parameters: any) {
  // 星辉馈赠和星蚀
  if (parameters && parameters.allocations) {
    for (const allocation of parameters.allocations) {
      const { team_id, location_id, amount } = allocation

      // 获取当前星星数
      const { data: current } = await supabase
        .from('star_records')
        .select('stars')
        .eq('team_id', team_id)
        .eq('location_id', location_id)
        .single()

      if (current) {
        const newStars = Math.max(0, current.stars + amount) // 确保不为负数

        await supabase
          .from('star_records')
          .update({ stars: newStars })
          .eq('team_id', team_id)
          .eq('location_id', location_id)
      }
    }
  }

  // 排名窃取
  if (cardType === 'rank_steal' && parameters) {
    const { team1_id, team2_id, location_id } = parameters

    const { data: records } = await supabase
      .from('star_records')
      .select('*')
      .in('team_id', [team1_id, team2_id])
      .eq('location_id', location_id)

    if (records && records.length === 2) {
      const [record1, record2] = records

      // 交换星星数
      await supabase
        .from('star_records')
        .update({ stars: record2.stars })
        .eq('id', record1.id)

      await supabase
        .from('star_records')
        .update({ stars: record1.stars })
        .eq('id', record2.id)
    }
  }
}
