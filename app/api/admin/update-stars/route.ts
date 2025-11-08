import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { team_id, location_id, change, admin_id } = body

    console.log('🔵 API 收到请求:', body)

    if (!team_id || !location_id || change === undefined || !admin_id) {
      console.error('❌ 参数不完整:', { team_id, location_id, change, admin_id })
      return NextResponse.json({ success: false, message: '参数不完整' })
    }

    console.log('🔄 开始更新数据库...')

    // 获取当前记录（包含 game_session_id）
    const { data: oldRecord } = await supabase
      .from('star_records')
      .select('stars, game_session_id')
      .eq('team_id', team_id)
      .eq('location_id', location_id)
      .single()

    if (!oldRecord) {
      console.error('❌ 未找到记录')
      return NextResponse.json({ success: false, message: '未找到记录' })
    }

    const oldStars = oldRecord.stars

    // 查询该点位的活跃效果，计算收益倍数
    const { data: effects } = await supabase
      .from('active_effects')
      .select('*')
      .eq('game_session_id', oldRecord.game_session_id)
      .eq('status', 'active')
      .gte('end_time', new Date().toISOString())

    let multiplier = 1.0
    const multipliers: number[] = [] // 记录所有应用的倍率
    const now = new Date()

    if (effects) {
      effects.forEach(effect => {
        const effectEndTime = new Date(effect.end_time)
        if (effectEndTime <= now) return
        if (!effect.effect_value) return

        // 效率诅咒：针对特定队伍
        if (effect.effect_type === 'efficiency_curse' && effect.team_id === team_id) {
          multiplier *= effect.effect_value
          multipliers.push(effect.effect_value)
        }

        // 士气高涨：针对特定队伍
        if (effect.effect_type === 'morale_boost' && effect.team_id === team_id) {
          multiplier *= effect.effect_value
          multipliers.push(effect.effect_value)
        }

        // 幸运聚焦：针对特定队伍+特定点位
        if (effect.effect_type === 'lucky_focus' &&
            effect.team_id === team_id &&
            effect.target_location_id === location_id) {
          multiplier *= effect.effect_value
          multipliers.push(effect.effect_value)
        }

        // 突发事件-收益波动（点位）
        if ((effect.effect_type === 'income_increase' || effect.effect_type === 'income_decrease') &&
            effect.target_location_id === location_id) {
          multiplier *= effect.effect_value
          multipliers.push(effect.effect_value)
        }

        // 突发事件-黄金时间/低谷时间（全局）
        if (effect.effect_type === 'golden_time' || effect.effect_type === 'low_time') {
          multiplier *= effect.effect_value
          multipliers.push(effect.effect_value)
        }
      })
    }

    // 基于数据库值计算新值
    const actualChange = change * multiplier
    const newStars = Math.max(0, oldStars + actualChange)
    const changeAmount = newStars - oldStars

    console.log(`⭐ 倍数: ${multiplier}x, 原始变化: ${change}, 实际变化: ${actualChange}, 旧值: ${oldStars}, 新值: ${newStars}`)

    // 更新星星数
    const { data: record, error } = await supabase
      .from('star_records')
      .update({ stars: newStars })
      .eq('team_id', team_id)
      .eq('location_id', location_id)
      .select()
      .single()

    if (error) {
      console.error('❌ 数据库更新错误:', error)
      return NextResponse.json({ success: false, message: '更新失败: ' + error.message })
    }

    console.log('✅ 数据库更新成功:', record)

    // 创建修改日志
    console.log('📝 创建修改日志...')
    await supabase.from('star_change_logs').insert({
      game_session_id: oldRecord.game_session_id,
      admin_id: admin_id,
      team_id: team_id,
      location_id: location_id,
      old_stars: oldStars,
      new_stars: newStars,
      change_amount: changeAmount
      // TODO: 添加 base_change 和 multipliers 字段需要先在数据库中创建这些列
      // base_change: change,
      // multipliers: multipliers.length > 0 ? multipliers : null
    })

    // 处理同盟星星共享
    if (changeAmount > 0) {
      console.log('🤝 检查是否有同盟效果...')
      await handleAllianceSharing(
        oldRecord.game_session_id,
        team_id,
        location_id,
        changeAmount,
        admin_id
      )
    }

    // 重新计算该点位所有队伍的积分
    console.log('🔄 开始重新计算积分...')
    await recalculatePoints(record.location_id, record.game_session_id)
    console.log('✅ 积分重新计算完成')

    // 重新获取更新后的记录（包含新的积分）
    const { data: updatedRecord } = await supabase
      .from('star_records')
      .select('*')
      .eq('id', record.id)
      .single()

    return NextResponse.json({ success: true, record: updatedRecord || record })
  } catch (error) {
    console.error('❌ 服务器错误:', error)
    return NextResponse.json({ success: false, message: '服务器错误: ' + String(error) })
  }
}

async function handleAllianceSharing(
  gameSessionId: string,
  teamId: string,
  locationId: string,
  changeAmount: number,
  adminId: string
) {
  // 查询活跃的同盟效果
  const { data: effects } = await supabase
    .from('active_effects')
    .select('*')
    .eq('game_session_id', gameSessionId)
    .eq('status', 'active')
    .gte('end_time', new Date().toISOString())
    .in('effect_type', ['alliance', 'special_mission'])

  if (!effects || effects.length === 0) {
    console.log('   ℹ️ 没有活跃的同盟效果')
    return
  }

  for (const effect of effects) {
    let allianceTeamId: string | null = null
    let shareRatio = 0

    if (effect.effect_type === 'alliance') {
      // 战略同盟：检查是否是该效果的参与队伍
      if (effect.team_id === teamId) {
        // 当前队伍是发起者，同盟方是 alliance_team_id
        allianceTeamId = effect.alliance_team_id
        shareRatio = effect.effect_value || 0.2 // 默认20%
      } else if (effect.alliance_team_id === teamId) {
        // 当前队伍是同盟方，发起者是 team_id
        allianceTeamId = effect.team_id
        shareRatio = effect.effect_value || 0.2
      }
    } else if (effect.effect_type === 'special_mission') {
      // 特殊任务：查找配对
      const pairs = effect.parameters?.pairs || []
      for (const [team1Id, team2Id] of pairs) {
        if (team1Id === teamId) {
          allianceTeamId = team2Id
          shareRatio = 1.0 // 100%共享
          break
        } else if (team2Id === teamId) {
          allianceTeamId = team1Id
          shareRatio = 1.0
          break
        }
      }
    }

    if (allianceTeamId && shareRatio > 0) {
      const sharedStars = changeAmount * shareRatio
      console.log(`   🤝 为同盟队伍 ${allianceTeamId} 增加 ${sharedStars} 颗星星 (${shareRatio * 100}%)`)

      // 获取同盟队伍的当前星星数
      const { data: allianceRecord } = await supabase
        .from('star_records')
        .select('stars')
        .eq('team_id', allianceTeamId)
        .eq('location_id', locationId)
        .single()

      if (allianceRecord) {
        const oldAllianceStars = allianceRecord.stars
        const newAllianceStars = oldAllianceStars + sharedStars

        // 更新同盟队伍的星星数
        await supabase
          .from('star_records')
          .update({ stars: newAllianceStars })
          .eq('team_id', allianceTeamId)
          .eq('location_id', locationId)

        // 记录同盟队伍的日志
        await supabase.from('star_change_logs').insert({
          game_session_id: gameSessionId,
          admin_id: adminId,
          team_id: allianceTeamId,
          location_id: locationId,
          old_stars: oldAllianceStars,
          new_stars: newAllianceStars,
          change_amount: sharedStars,
          base_change: changeAmount, // 基础变化量是主队伍的实际变化
          multipliers: [shareRatio] // 同盟倍率
        })

        console.log(`   ✅ 同盟队伍星星数已更新: ${oldAllianceStars} -> ${newAllianceStars}`)
      }
    }
  }
}

async function recalculatePoints(locationId: string, gameSessionId: string) {
  // 获取该点位所有队伍的星星数
  const { data: records } = await supabase
    .from('star_records')
    .select('id, team_id, stars')
    .eq('location_id', locationId)
    .eq('game_session_id', gameSessionId)
    .order('stars', { ascending: false })

  if (!records) return

  // 计算积分
  let currentRank = 1
  let currentPoints = 10
  let previousStars = -1

  for (let i = 0; i < records.length; i++) {
    const record = records[i]

    if (record.stars !== previousStars) {
      currentRank = i + 1
      currentPoints = 11 - currentRank
      if (currentPoints < 0) currentPoints = 0
      previousStars = record.stars
    }

    // 更新积分
    await supabase
      .from('star_records')
      .update({ points: currentPoints })
      .eq('id', record.id)
  }
}
