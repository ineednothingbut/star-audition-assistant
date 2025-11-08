import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

console.log('🔍 检查收益效果系统...\n')

// 获取在线的游戏场
const { data: sessions } = await supabase
  .from('game_sessions')
  .select('id, name, status')
  .eq('status', 'online')

if (!sessions || sessions.length === 0) {
  console.log('❌ 没有在线的游戏场')
  process.exit(1)
}

console.log('📋 在线游戏场:')
sessions.forEach(s => console.log(`   - ${s.name} (${s.id})`))
console.log()

const gameSessionId = sessions[0].id

// 检查 active_effects 表
console.log('🔍 检查 active_effects 表结构...')
const { data: effects, error: effectsError } = await supabase
  .from('active_effects')
  .select('*')
  .eq('game_session_id', gameSessionId)
  .limit(1)

if (effectsError) {
  console.error('❌ 查询 active_effects 出错:', effectsError.message)
  console.log('💡 请确保已执行 add-source-event-id.sql')
} else {
  console.log('✅ active_effects 表可以访问')
  if (effects && effects.length > 0) {
    console.log('📊 示例效果记录:')
    console.log(JSON.stringify(effects[0], null, 2))
  } else {
    console.log('ℹ️ 当前没有活跃的效果')
  }
}
console.log()

// 检查所有效果
const { data: allEffects } = await supabase
  .from('active_effects')
  .select('*')
  .eq('game_session_id', gameSessionId)

console.log(`📊 游戏场 ${sessions[0].name} 的所有效果 (${allEffects?.length || 0} 条):`)
if (allEffects && allEffects.length > 0) {
  allEffects.forEach(effect => {
    console.log(`   - ${effect.effect_type}: 倍数=${effect.effect_value}, 状态=${effect.status || 'active'}, 结束时间=${effect.end_time}`)
  })
} else {
  console.log('   (无效果)')
}
console.log()

// 检查技能卡日志
const { data: skillLogs } = await supabase
  .from('skill_card_logs')
  .select('*')
  .eq('game_session_id', gameSessionId)
  .eq('status', 'active')

console.log(`🃏 活跃的技能卡 (${skillLogs?.length || 0} 张):`)
if (skillLogs && skillLogs.length > 0) {
  skillLogs.forEach(log => {
    console.log(`   - ${log.card_type}, 结束时间=${log.end_time}`)
  })
} else {
  console.log('   (无活跃技能卡)')
}
console.log()

// 检查随机事件
const { data: events } = await supabase
  .from('random_events')
  .select('*')
  .eq('game_session_id', gameSessionId)
  .eq('status', 'active')

console.log(`💥 活跃的随机事件 (${events?.length || 0} 个):`)
if (events && events.length > 0) {
  events.forEach(event => {
    console.log(`   - ${event.event_type}, 结束时间=${event.end_time}`)
  })
} else {
  console.log('   (无活跃事件)')
}
