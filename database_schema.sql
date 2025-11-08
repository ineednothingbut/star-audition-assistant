-- 星光璀璨：总裁的试镜会 - 数据库表结构设计
-- 使用 Supabase/PostgreSQL

-- 1. 游戏场表
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'offline', -- 'online', 'offline'
  team_count INTEGER DEFAULT 0,
  location_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 队伍表
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(20) NOT NULL, -- hex color code
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 点位表
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 星星记录表 (每个队伍在每个点位的星星数)
CREATE TABLE star_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  stars DECIMAL(10, 2) DEFAULT 0, -- 使用 DECIMAL 支持小数
  points INTEGER DEFAULT 0, -- 该点位获得的积分(排名分)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, location_id)
);

-- 5. 技能卡日志表
CREATE TABLE skill_card_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  card_type VARCHAR(50) NOT NULL, -- 技能卡类型
  activator_team_id UUID REFERENCES teams(id), -- 发动队伍
  target_team_id UUID REFERENCES teams(id), -- 目标队伍(可为空)
  target_location_id UUID REFERENCES locations(id), -- 目标点位(可为空)
  parameters JSONB, -- 存储技能卡的参数(如星辉馈赠的分配详情)
  duration_minutes INTEGER, -- 持续时间(分钟)
  end_time TIMESTAMP WITH TIME ZONE, -- 结束时间
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'expired', 'cancelled'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 突发事件记录表
CREATE TABLE random_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- 事件类型
  target_location_id UUID REFERENCES locations(id), -- 目标点位(可为空)
  parameters JSONB, -- 事件参数(如队伍配对信息)
  duration_minutes INTEGER, -- 持续时间(分钟)
  end_time TIMESTAMP WITH TIME ZONE, -- 结束时间
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'expired'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 管理员账号表
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL, -- 'junior', 'mid', 'senior'
  game_session_id UUID REFERENCES game_sessions(id) ON DELETE SET NULL,
  assigned_location_id UUID REFERENCES locations(id) ON DELETE SET NULL, -- 初级管理员的分配点位
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 活跃效果表 (用于跟踪正在生效的buff/debuff)
CREATE TABLE active_effects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  effect_type VARCHAR(50) NOT NULL, -- 'efficiency_curse', 'morale_boost', 'lucky_focus', 'skill_block', 'alliance'
  effect_value DECIMAL(10, 2), -- 效果数值(如倍率)
  target_location_id UUID REFERENCES locations(id), -- 特定点位效果(如幸运聚焦)
  alliance_team_id UUID REFERENCES teams(id), -- 同盟队伍ID(用于战略同盟)
  source_card_log_id UUID REFERENCES skill_card_logs(id), -- 来源技能卡日志
  end_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引优化
CREATE INDEX idx_teams_game_session ON teams(game_session_id);
CREATE INDEX idx_locations_game_session ON locations(game_session_id);
CREATE INDEX idx_star_records_game_session ON star_records(game_session_id);
CREATE INDEX idx_star_records_team ON star_records(team_id);
CREATE INDEX idx_star_records_location ON star_records(location_id);
CREATE INDEX idx_skill_card_logs_game_session ON skill_card_logs(game_session_id);
CREATE INDEX idx_skill_card_logs_status ON skill_card_logs(status);
CREATE INDEX idx_random_events_game_session ON random_events(game_session_id);
CREATE INDEX idx_random_events_status ON random_events(status);
CREATE INDEX idx_active_effects_team ON active_effects(team_id);
CREATE INDEX idx_active_effects_game_session ON active_effects(game_session_id);

-- 创建更新时间戳触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_game_sessions_updated_at BEFORE UPDATE ON game_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_star_records_updated_at BEFORE UPDATE ON star_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 启用 Row Level Security (RLS)
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE star_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_card_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE random_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_effects ENABLE ROW LEVEL SECURITY;

-- 创建公开读取策略 (所有人都可以查看)
CREATE POLICY "Enable read access for all users" ON game_sessions FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON teams FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON locations FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON star_records FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON skill_card_logs FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON random_events FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON active_effects FOR SELECT USING (true);

-- 管理员表只允许认证用户读取
CREATE POLICY "Enable read access for authenticated users" ON admins FOR SELECT USING (auth.role() = 'authenticated');

-- 写入策略需要认证 (后续可以根据具体权限细化)
CREATE POLICY "Enable insert for authenticated users" ON game_sessions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON game_sessions FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON game_sessions FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON teams FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON teams FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON teams FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON locations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON locations FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON locations FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON star_records FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON star_records FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON star_records FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON skill_card_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON skill_card_logs FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON random_events FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON random_events FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON active_effects FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON active_effects FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON active_effects FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON admins FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON admins FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON admins FOR DELETE USING (auth.role() = 'authenticated');
