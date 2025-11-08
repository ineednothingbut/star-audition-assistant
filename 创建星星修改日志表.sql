-- 创建星星修改日志表
CREATE TABLE star_change_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  old_stars DECIMAL(10, 2) NOT NULL,
  new_stars DECIMAL(10, 2) NOT NULL,
  change_amount DECIMAL(10, 2) NOT NULL, -- 正数表示增加，负数表示减少
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX idx_star_change_logs_game_session ON star_change_logs(game_session_id);
CREATE INDEX idx_star_change_logs_admin ON star_change_logs(admin_id);
CREATE INDEX idx_star_change_logs_created_at ON star_change_logs(created_at DESC);

-- 启用 RLS
ALTER TABLE star_change_logs ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略（允许所有操作）
CREATE POLICY "Allow all operations on star_change_logs" ON star_change_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 启用 Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE star_change_logs;

-- 查看表结构
\d star_change_logs;
