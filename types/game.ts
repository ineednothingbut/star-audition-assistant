// 技能卡类型枚举
export enum SkillCardType {
  // 效率诅咒系列
  EFFICIENCY_CURSE_5 = 'efficiency_curse_5',
  EFFICIENCY_CURSE_10 = 'efficiency_curse_10',
  EFFICIENCY_CURSE_15 = 'efficiency_curse_15',

  // 士气高涨系列
  MORALE_BOOST_5 = 'morale_boost_5',
  MORALE_BOOST_10 = 'morale_boost_10',
  MORALE_BOOST_15 = 'morale_boost_15',

  // 其他技能卡
  LUCKY_FOCUS = 'lucky_focus',
  STAR_GIFT_3 = 'star_gift_3',
  STAR_GIFT_5 = 'star_gift_5',
  STAR_GIFT_10 = 'star_gift_10',
  STAR_ECLIPSE_3 = 'star_eclipse_3',
  STAR_ECLIPSE_5 = 'star_eclipse_5',
  STAR_ECLIPSE_10 = 'star_eclipse_10',
  SKILL_BLOCK = 'skill_block',
  PURIFY = 'purify',
  THORN_ARMOR = 'thorn_armor',
  STRATEGIC_ALLIANCE = 'strategic_alliance',
  TIME_FREEZE = 'time_freeze',
  RANK_STEAL = 'rank_steal'
}

// 技能卡信息定义
export interface SkillCardInfo {
  type: SkillCardType
  name: string
  description: string
  duration?: number // 持续时间(分钟)
  effectValue?: number // 效果数值
  category: 'debuff' | 'buff' | 'instant' | 'special'
  needsTarget: boolean // 是否需要选择目标队伍
  needsLocation: boolean // 是否需要选择目标点位
}

// 技能卡配置
export const SKILL_CARD_CONFIG: Record<SkillCardType, SkillCardInfo> = {
  [SkillCardType.EFFICIENCY_CURSE_5]: {
    type: SkillCardType.EFFICIENCY_CURSE_5,
    name: '效率诅咒5分钟',
    description: '指定一个队伍,使其在接下来的5分钟内,星星收益减少为原来的30%',
    duration: 5,
    effectValue: 0.3,
    category: 'debuff',
    needsTarget: true,
    needsLocation: false,
  },
  [SkillCardType.EFFICIENCY_CURSE_10]: {
    type: SkillCardType.EFFICIENCY_CURSE_10,
    name: '效率诅咒10分钟',
    description: '指定一个队伍,使其在接下来的10分钟内,星星收益减少为原来的50%',
    duration: 10,
    effectValue: 0.5,
    category: 'debuff',
    needsTarget: true,
    needsLocation: false,
  },
  [SkillCardType.EFFICIENCY_CURSE_15]: {
    type: SkillCardType.EFFICIENCY_CURSE_15,
    name: '效率诅咒15分钟',
    description: '指定一个队伍,使其在接下来的15分钟内,星星收益减少为原来的70%',
    duration: 15,
    effectValue: 0.7,
    category: 'debuff',
    needsTarget: true,
    needsLocation: false,
  },
  [SkillCardType.MORALE_BOOST_5]: {
    type: SkillCardType.MORALE_BOOST_5,
    name: '士气高涨5分钟',
    description: '让自己的队伍在接下来的5分钟内,星星收益提升至原来的2倍',
    duration: 5,
    effectValue: 2.0,
    category: 'buff',
    needsTarget: false,
    needsLocation: false,
  },
  [SkillCardType.MORALE_BOOST_10]: {
    type: SkillCardType.MORALE_BOOST_10,
    name: '士气高涨10分钟',
    description: '让自己的队伍在接下来的10分钟内,星星收益提升至原来的1.5倍',
    duration: 10,
    effectValue: 1.5,
    category: 'buff',
    needsTarget: false,
    needsLocation: false,
  },
  [SkillCardType.MORALE_BOOST_15]: {
    type: SkillCardType.MORALE_BOOST_15,
    name: '士气高涨15分钟',
    description: '让自己的队伍在接下来的15分钟内,星星收益提升至原来的1.3倍',
    duration: 15,
    effectValue: 1.3,
    category: 'buff',
    needsTarget: false,
    needsLocation: false,
  },
  [SkillCardType.LUCKY_FOCUS]: {
    type: SkillCardType.LUCKY_FOCUS,
    name: '幸运聚焦',
    description: '指定一个幸运点位,自己队伍在接下来10分钟内于该点位获得的星星翻倍',
    duration: 10,
    effectValue: 2.0,
    category: 'buff',
    needsTarget: false,
    needsLocation: true,
  },
  [SkillCardType.STAR_GIFT_3]: {
    type: SkillCardType.STAR_GIFT_3,
    name: '星辉馈赠×3',
    description: '你获得了3颗星星的分配权,可以增加任意队伍在任意点位处的星星,总计可分配3颗',
    category: 'instant',
    needsTarget: false,
    needsLocation: false,
  },
  [SkillCardType.STAR_GIFT_5]: {
    type: SkillCardType.STAR_GIFT_5,
    name: '星辉馈赠×5',
    description: '你获得了5颗星星的分配权,可以增加任意队伍在任意点位处的星星,总计可分配5颗',
    category: 'instant',
    needsTarget: false,
    needsLocation: false,
  },
  [SkillCardType.STAR_GIFT_10]: {
    type: SkillCardType.STAR_GIFT_10,
    name: '星辉馈赠×10',
    description: '你获得了10颗星星的分配权,可以增加任意队伍在任意点位处的星星,总计可分配10颗',
    category: 'instant',
    needsTarget: false,
    needsLocation: false,
  },
  [SkillCardType.STAR_ECLIPSE_3]: {
    type: SkillCardType.STAR_ECLIPSE_3,
    name: '星蚀×3',
    description: '你获得了3颗星星的削减权,可以减少任意队伍在任意点位处的星星,总计可移除3颗',
    category: 'instant',
    needsTarget: false,
    needsLocation: false,
  },
  [SkillCardType.STAR_ECLIPSE_5]: {
    type: SkillCardType.STAR_ECLIPSE_5,
    name: '星蚀×5',
    description: '你获得了5颗星星的削减权,可以减少任意队伍在任意点位处的星星,总计可移除5颗',
    category: 'instant',
    needsTarget: false,
    needsLocation: false,
  },
  [SkillCardType.STAR_ECLIPSE_10]: {
    type: SkillCardType.STAR_ECLIPSE_10,
    name: '星蚀×10',
    description: '你获得了10颗星星的削减权,可以减少任意队伍在任意点位处的星星,总计可移除10颗',
    category: 'instant',
    needsTarget: false,
    needsLocation: false,
  },
  [SkillCardType.SKILL_BLOCK]: {
    type: SkillCardType.SKILL_BLOCK,
    name: '技能封锁',
    description: '指定一个队伍,使其在接下来10分钟内无法使用任何技能卡',
    duration: 10,
    category: 'debuff',
    needsTarget: true,
    needsLocation: false,
  },
  [SkillCardType.PURIFY]: {
    type: SkillCardType.PURIFY,
    name: '净化',
    description: '为你的队伍解除一张技能卡带来的负面影响(仅对"效率诅咒"、"技能封锁"有效)',
    category: 'instant',
    needsTarget: false,
    needsLocation: false,
  },
  [SkillCardType.THORN_ARMOR]: {
    type: SkillCardType.THORN_ARMOR,
    name: '荆棘护甲',
    description: '当有队伍对你使用负面效果技能卡时,可以打出此卡进行反制,该负面效果将完全反弹给原本的使用者',
    category: 'special',
    needsTarget: false,
    needsLocation: false,
  },
  [SkillCardType.STRATEGIC_ALLIANCE]: {
    type: SkillCardType.STRATEGIC_ALLIANCE,
    name: '战略同盟',
    description: '在20分钟内,可以与另一支队伍结盟。结盟期间,双方在任何点位获得的星星,结盟方都能获得20%',
    duration: 20,
    effectValue: 0.2,
    category: 'buff',
    needsTarget: true,
    needsLocation: false,
  },
  [SkillCardType.TIME_FREEZE]: {
    type: SkillCardType.TIME_FREEZE,
    name: '时光凝滞',
    description: '在玩完一场游戏后使出该技能卡,可使该场游戏除你队伍外所有玩家强制在该点位滞留8分钟',
    duration: 8,
    category: 'special',
    needsTarget: false,
    needsLocation: true,
  },
  [SkillCardType.RANK_STEAL]: {
    type: SkillCardType.RANK_STEAL,
    name: '排名窃取',
    description: '选择一个点位,你可以与排名比你高一位的队伍互换星星总数',
    category: 'instant',
    needsTarget: false,
    needsLocation: true,
  },
}

// 突发事件类型枚举
export enum RandomEventType {
  INCOME_DECREASE = 'income_decrease', // 收益波动-减少
  INCOME_INCREASE = 'income_increase', // 收益波动-增加
  SUPPLY_DROP = 'supply_drop', // 天降甘霖
  GOLDEN_TIME = 'golden_time', // 黄金时间
  LOW_TIME = 'low_time', // 低谷时间
  SPECIAL_MISSION = 'special_mission' // 侦测到特殊任务
}

// 突发事件信息定义
export interface RandomEventInfo {
  type: RandomEventType
  name: string
  description: string
  duration?: number
  needsLocation: boolean
}

// 突发事件配置
export const RANDOM_EVENT_CONFIG: Record<RandomEventType, RandomEventInfo> = {
  [RandomEventType.INCOME_DECREASE]: {
    type: RandomEventType.INCOME_DECREASE,
    name: '收益波动(减少)',
    description: '点位xx,在接下来的15分钟内,星星收益减少为原来的50%',
    duration: 15,
    needsLocation: true,
  },
  [RandomEventType.INCOME_INCREASE]: {
    type: RandomEventType.INCOME_INCREASE,
    name: '收益波动(增加)',
    description: '点位xx,在接下来的15分钟内,星星收益提升至原来的1.5倍',
    duration: 15,
    needsLocation: true,
  },
  [RandomEventType.SUPPLY_DROP]: {
    type: RandomEventType.SUPPLY_DROP,
    name: '天降甘霖',
    description: '地图上随机出现3个补给箱,找到场上带红色帽子的npc可获得技能卡补给',
    needsLocation: false,
  },
  [RandomEventType.GOLDEN_TIME]: {
    type: RandomEventType.GOLDEN_TIME,
    name: '黄金时间',
    description: '黄金时间到!所有点位收益翻倍,持续10分钟!',
    duration: 10,
    needsLocation: false,
  },
  [RandomEventType.LOW_TIME]: {
    type: RandomEventType.LOW_TIME,
    name: '低谷时间',
    description: '低谷时间到!所有点位收益减半,持续10分钟!',
    duration: 10,
    needsLocation: false,
  },
  [RandomEventType.SPECIAL_MISSION]: {
    type: RandomEventType.SPECIAL_MISSION,
    name: '侦测到特殊任务',
    description: '发布组队挑战!所有队伍将随机两两配对,在接下来的8分钟内,结为同盟',
    duration: 8,
    needsLocation: false,
  },
}

// 效果类型枚举
export enum EffectType {
  EFFICIENCY_CURSE = 'efficiency_curse', // 效率诅咒
  MORALE_BOOST = 'morale_boost', // 士气高涨
  LUCKY_FOCUS = 'lucky_focus', // 幸运聚焦
  SKILL_BLOCK = 'skill_block', // 技能封锁
  ALLIANCE = 'alliance' // 战略同盟
}

// 管理员角色类型
export type AdminRole = 'junior' | 'mid' | 'senior'

// 游戏状态类型
export type GameStatus = 'online' | 'offline'

// 技能卡状态类型
export type SkillCardStatus = 'active' | 'expired' | 'cancelled'

// 突发事件状态类型
export type RandomEventStatus = 'active' | 'expired'
