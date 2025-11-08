-- 为 active_effects 表添加必要的字段
-- 注意：如果字段已存在，会报错但不影响

-- 1. 添加 source_event_id 字段
ALTER TABLE active_effects ADD COLUMN source_event_id UUID;

-- 2. 添加外键约束
ALTER TABLE active_effects ADD CONSTRAINT fk_source_event
FOREIGN KEY (source_event_id) REFERENCES random_events(id) ON DELETE CASCADE;

-- 3. 添加索引
CREATE INDEX idx_active_effects_source_event ON active_effects(source_event_id);

-- 4. 添加 status 字段
ALTER TABLE active_effects ADD COLUMN status TEXT DEFAULT 'active';

-- 5. 添加索引
CREATE INDEX idx_active_effects_status ON active_effects(status);

-- 6. 更新所有现有记录的 status 为 active
UPDATE active_effects SET status = 'active' WHERE status IS NULL;

-- 7. 将过期的效果标记为 expired
UPDATE active_effects
SET status = 'expired'
WHERE end_time < NOW() AND status = 'active';

-- 8. 查看结果
SELECT
    effect_type,
    COUNT(*) as count,
    status,
    COUNT(*) FILTER (WHERE end_time > NOW()) as active_count
FROM active_effects
GROUP BY effect_type, status
ORDER BY effect_type;
