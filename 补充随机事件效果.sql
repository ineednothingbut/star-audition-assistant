-- 为现有的随机事件补充 active_effects 记录

-- 1. 收益减少事件
INSERT INTO active_effects (game_session_id, team_id, effect_type, effect_value, target_location_id, source_event_id, end_time, status)
SELECT
    game_session_id,
    NULL as team_id,
    'income_decrease' as effect_type,
    0.5 as effect_value,
    target_location_id,
    id as source_event_id,
    end_time,
    CASE WHEN end_time > NOW() THEN 'active' ELSE 'expired' END as status
FROM random_events
WHERE event_type = 'income_decrease'
AND NOT EXISTS (
    SELECT 1 FROM active_effects WHERE source_event_id = random_events.id
);

-- 2. 收益增加事件
INSERT INTO active_effects (game_session_id, team_id, effect_type, effect_value, target_location_id, source_event_id, end_time, status)
SELECT
    game_session_id,
    NULL as team_id,
    'income_increase' as effect_type,
    1.5 as effect_value,
    target_location_id,
    id as source_event_id,
    end_time,
    CASE WHEN end_time > NOW() THEN 'active' ELSE 'expired' END as status
FROM random_events
WHERE event_type = 'income_increase'
AND NOT EXISTS (
    SELECT 1 FROM active_effects WHERE source_event_id = random_events.id
);

-- 3. 黄金时间事件
INSERT INTO active_effects (game_session_id, team_id, effect_type, effect_value, target_location_id, source_event_id, end_time, status)
SELECT
    game_session_id,
    NULL as team_id,
    'golden_time' as effect_type,
    2.0 as effect_value,
    NULL as target_location_id,
    id as source_event_id,
    end_time,
    CASE WHEN end_time > NOW() THEN 'active' ELSE 'expired' END as status
FROM random_events
WHERE event_type = 'golden_time'
AND NOT EXISTS (
    SELECT 1 FROM active_effects WHERE source_event_id = random_events.id
);

-- 4. 低谷时间事件
INSERT INTO active_effects (game_session_id, team_id, effect_type, effect_value, target_location_id, source_event_id, end_time, status)
SELECT
    game_session_id,
    NULL as team_id,
    'low_time' as effect_type,
    0.5 as effect_value,
    NULL as target_location_id,
    id as source_event_id,
    end_time,
    CASE WHEN end_time > NOW() THEN 'active' ELSE 'expired' END as status
FROM random_events
WHERE event_type = 'low_time'
AND NOT EXISTS (
    SELECT 1 FROM active_effects WHERE source_event_id = random_events.id
);

-- 查看补充结果
SELECT
    effect_type,
    COUNT(*) as count,
    COUNT(*) FILTER (WHERE status = 'active') as active_count,
    COUNT(*) FILTER (WHERE status = 'expired') as expired_count
FROM active_effects
WHERE source_event_id IS NOT NULL
GROUP BY effect_type;
