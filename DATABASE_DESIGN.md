# 数据库设计说明

## 表结构概述

### 1. game_sessions (游戏场表)
存储游戏场的基本信息。
- `id`: 主键
- `name`: 游戏场名称
- `status`: 状态 (online/offline)
- `team_count`: 队伍数量
- `location_count`: 点位数量

### 2. teams (队伍表)
存储队伍信息。
- `id`: 主键
- `game_session_id`: 所属游戏场
- `name`: 队伍名称
- `color`: 背景颜色 (hex格式)
- `display_order`: 显示顺序

### 3. locations (点位表)
存储点位信息。
- `id`: 主键
- `game_session_id`: 所属游戏场
- `name`: 点位名称
- `display_order`: 显示顺序

### 4. star_records (星星记录表)
存储每个队伍在每个点位的星星数和积分。
- `id`: 主键
- `team_id`: 队伍ID
- `location_id`: 点位ID
- `stars`: 星星数量 (DECIMAL支持小数,如技能卡效果)
- `points`: 该点位获得的排名积分
- 唯一约束: (team_id, location_id)

### 5. skill_card_logs (技能卡日志表)
记录技能卡的使用历史。
- `id`: 主键
- `card_type`: 技能卡类型
- `activator_team_id`: 发动队伍
- `target_team_id`: 目标队伍
- `target_location_id`: 目标点位
- `parameters`: JSONB格式的参数
- `duration_minutes`: 持续时间
- `end_time`: 结束时间
- `status`: 状态 (active/expired/cancelled)

### 6. random_events (突发事件表)
记录突发事件。
- `id`: 主键
- `event_type`: 事件类型
- `target_location_id`: 目标点位
- `parameters`: JSONB格式的参数
- `duration_minutes`: 持续时间
- `end_time`: 结束时间
- `status`: 状态 (active/expired)

### 7. admins (管理员表)
存储管理员账号信息。
- `id`: 主键
- `username`: 用户名
- `password_hash`: 密码哈希
- `role`: 角色 (junior/mid/senior)
- `game_session_id`: 所属游戏场
- `assigned_location_id`: 分配的点位 (仅初级管理员)

### 8. active_effects (活跃效果表)
跟踪正在生效的buff/debuff。
- `id`: 主键
- `team_id`: 受影响队伍
- `effect_type`: 效果类型
- `effect_value`: 效果数值
- `target_location_id`: 目标点位 (如幸运聚焦)
- `alliance_team_id`: 同盟队伍ID
- `source_card_log_id`: 来源技能卡日志
- `end_time`: 结束时间

## 技能卡类型枚举

```typescript
enum SkillCardType {
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
```

## 突发事件类型枚举

```typescript
enum RandomEventType {
  INCOME_DECREASE = 'income_decrease', // 收益波动-减少
  INCOME_INCREASE = 'income_increase', // 收益波动-增加
  SUPPLY_DROP = 'supply_drop', // 天降甘霖
  GOLDEN_TIME = 'golden_time', // 黄金时间
  LOW_TIME = 'low_time', // 低谷时间
  SPECIAL_MISSION = 'special_mission' // 侦测到特殊任务
}
```

## 效果类型枚举

```typescript
enum EffectType {
  EFFICIENCY_CURSE = 'efficiency_curse', // 效率诅咒
  MORALE_BOOST = 'morale_boost', // 士气高涨
  LUCKY_FOCUS = 'lucky_focus', // 幸运聚焦
  SKILL_BLOCK = 'skill_block', // 技能封锁
  ALLIANCE = 'alliance' // 战略同盟
}
```

## 权限级别

- `junior`: 初级管理员 (点位考核官) - 只能修改指定点位的星星数
- `mid`: 中级管理员 - 可修改任意单元格、控制中控台、发动技能卡和突发事件
- `senior`: 高级管理员 - 完全控制权限,管理游戏场和账号

## 数据流程

### 积分计算流程
1. 更新 `star_records` 表中的 `stars` 字段
2. 触发积分计算:按点位分组,根据星星数排名
3. 更新 `star_records` 表中的 `points` 字段
4. 前端实时订阅变化并重新排序显示

### 技能卡效果应用
1. 管理员在中控台发动技能卡
2. 插入记录到 `skill_card_logs` 表
3. 如果是持续效果,插入记录到 `active_effects` 表
4. 当玩家获得星星时,查询 `active_effects` 计算最终星星数
5. 倒计时结束后,更新 `active_effects` 和 `skill_card_logs` 状态

### 实时同步
使用 Supabase Realtime 订阅以下表的变化:
- `star_records` - 星星数变化
- `skill_card_logs` - 技能卡使用日志
- `random_events` - 突发事件
- `active_effects` - 效果状态变化
