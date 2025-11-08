-- 为 active_effects 表添加必要的字段

-- 1. 添加 source_event_id 字段
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'active_effects' AND column_name = 'source_event_id'
    ) THEN
        ALTER TABLE active_effects ADD COLUMN source_event_id UUID;
        ALTER TABLE active_effects ADD CONSTRAINT fk_source_event
        FOREIGN KEY (source_event_id) REFERENCES random_events(id) ON DELETE CASCADE;
        CREATE INDEX idx_active_effects_source_event ON active_effects(source_event_id);
        RAISE NOTICE '✅ 已添加 source_event_id 字段';
    ELSE
        RAISE NOTICE 'ℹ️ source_event_id 字段已存在';
    END IF;
END $$;

-- 2. 添加 status 字段
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'active_effects' AND column_name = 'status'
    ) THEN
        ALTER TABLE active_effects ADD COLUMN status TEXT DEFAULT 'active';
        CREATE INDEX idx_active_effects_status ON active_effects(status);
        RAISE NOTICE '✅ 已添加 status 字段';
    ELSE
        RAISE NOTICE 'ℹ️ status 字段已存在';
    END IF;
END $$;

-- 3. 更新所有现有记录的 status 为 active
UPDATE active_effects SET status = 'active' WHERE status IS NULL;

-- 4. 将过期的效果标记为 expired
UPDATE active_effects
SET status = 'expired'
WHERE end_time < NOW() AND status = 'active';

-- 5. 查看结果
SELECT
    effect_type,
    COUNT(*) as count,
    status,
    COUNT(*) FILTER (WHERE end_time > NOW()) as active_count
FROM active_effects
GROUP BY effect_type, status
ORDER BY effect_type;
