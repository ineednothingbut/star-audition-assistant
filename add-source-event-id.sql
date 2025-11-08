-- 为 active_effects 表添加 source_event_id 字段（如果还没有）

-- 检查是否已存在该列
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'active_effects' AND column_name = 'source_event_id'
    ) THEN
        -- 添加列
        ALTER TABLE active_effects ADD COLUMN source_event_id UUID;

        -- 添加外键约束
        ALTER TABLE active_effects ADD CONSTRAINT fk_source_event
        FOREIGN KEY (source_event_id) REFERENCES random_events(id) ON DELETE CASCADE;

        -- 添加索引以提高查询性能
        CREATE INDEX idx_active_effects_source_event ON active_effects(source_event_id);

        RAISE NOTICE '✅ 已添加 source_event_id 字段';
    ELSE
        RAISE NOTICE 'ℹ️ source_event_id 字段已存在';
    END IF;
END $$;

-- 同时添加 status 列（如果还没有）
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
