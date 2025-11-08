// 积分计算工具函数
export interface TeamStarsAtLocation {
  teamId: string
  teamName: string
  stars: number
  points: number
}

/**
 * 计算每个点位的排名积分
 * 规则:
 * - 第一名: 10分
 * - 第二名: 9分
 * - 第三名: 8分
 * - 以此类推
 * - 星星数相同则并列排名,积分相同
 * - 下一名积分比上一名少1分(不考虑跳过)
 */
export function calculatePointsForLocation(
  teamsData: TeamStarsAtLocation[]
): TeamStarsAtLocation[] {
  // 按星星数降序排序
  const sorted = [...teamsData].sort((a, b) => b.stars - a.stars)

  let currentRank = 1
  let currentPoints = 10
  let previousStars = -1

  return sorted.map((team, index) => {
    // 如果星星数与上一名不同,更新排名
    if (team.stars !== previousStars) {
      currentRank = index + 1
      // 积分 = 11 - 排名
      currentPoints = 11 - currentRank
      // 确保积分不低于0
      if (currentPoints < 0) currentPoints = 0
      previousStars = team.stars
    }

    return {
      ...team,
      points: currentPoints
    }
  })
}

/**
 * 计算队伍的总积分
 */
export function calculateTotalPoints(
  teamId: string,
  starRecords: { location_id: string; points: number }[]
): number {
  return starRecords
    .filter(record => record)
    .reduce((total, record) => total + record.points, 0)
}

/**
 * 应用技能卡效果到星星数
 */
export function applyEffectsToStars(
  baseStars: number,
  effects: {
    effect_type: string
    effect_value: number | null
  }[]
): number {
  let multiplier = 1.0

  for (const effect of effects) {
    switch (effect.effect_type) {
      case 'efficiency_curse':
        // 效率诅咒:星星收益减少
        multiplier *= effect.effect_value || 1.0
        break
      case 'morale_boost':
        // 士气高涨:星星收益增加
        multiplier *= effect.effect_value || 1.0
        break
      case 'lucky_focus':
        // 幸运聚焦:特定点位星星翻倍
        multiplier *= effect.effect_value || 1.0
        break
    }
  }

  return Math.round(baseStars * multiplier * 100) / 100 // 保留两位小数
}

/**
 * 格式化时间差(用于倒计时显示)
 */
export function formatTimeRemaining(endTime: string): string {
  const now = new Date()
  const end = new Date(endTime)
  const diff = end.getTime() - now.getTime()

  if (diff <= 0) return '00:00'

  const minutes = Math.floor(diff / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

/**
 * 检查效果是否仍然有效
 */
export function isEffectActive(endTime: string | null): boolean {
  if (!endTime) return false
  return new Date(endTime) > new Date()
}

/**
 * 计算效果结束时间
 */
export function calculateEndTime(durationMinutes: number): string {
  const endTime = new Date()
  endTime.setMinutes(endTime.getMinutes() + durationMinutes)
  return endTime.toISOString()
}

/**
 * 生成随机队伍配对(用于特殊任务事件)
 */
export function generateRandomPairing(teamIds: string[]): [string, string][] {
  const shuffled = [...teamIds].sort(() => Math.random() - 0.5)
  const pairs: [string, string][] = []

  for (let i = 0; i < shuffled.length - 1; i += 2) {
    pairs.push([shuffled[i], shuffled[i + 1]])
  }

  return pairs
}
