# 使用指南

## 📋 目录

1. [快速开始](#快速开始)
2. [配置Supabase](#配置supabase)
3. [初始化数据](#初始化数据)
4. [创建管理员账号](#创建管理员账号)
5. [创建游戏场](#创建游戏场)
6. [开始游戏](#开始游戏)
7. [常见问题](#常见问题)

## 🚀 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

复制环境变量示例文件:

```bash
cp .env.local.example .env.local
```

编辑 `.env.local` 文件,填入你的Supabase配置(下一步会获取)。

## 🗄️ 配置Supabase

### 1. 创建Supabase项目

1. 访问 https://supabase.com
2. 注册/登录账号
3. 点击 "New Project" 创建新项目
4. 记录下:
   - Project URL (类似: https://xxxxx.supabase.co)
   - Anon/Public Key (在 Settings -> API 中找到)

### 2. 更新环境变量

编辑 `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=你的Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的Anon Key
```

### 3. 执行数据库脚本

1. 在Supabase控制台,点击左侧 "SQL Editor"
2. 点击 "New query"
3. 复制 `database_schema.sql` 文件的全部内容
4. 粘贴到编辑器中
5. 点击 "Run" 执行

这将创建所有必要的数据表、索引和安全策略。

## 💾 初始化数据

### 创建第一个游戏场

在Supabase的SQL Editor中执行:

```sql
-- 创建游戏场
INSERT INTO game_sessions (name, status, team_count, location_count)
VALUES ('测试游戏场', 'offline', 0, 0);
```

记录返回的游戏场ID,或者在 Table Editor 中查看 game_sessions 表获取ID。

### 创建队伍

```sql
-- 假设游戏场ID为: abc-123-def
INSERT INTO teams (game_session_id, name, color, display_order) VALUES
('abc-123-def', 'A队', '#FF6B6B', 1),
('abc-123-def', 'B队', '#4ECDC4', 2),
('abc-123-def', 'C队', '#45B7D1', 3),
('abc-123-def', 'D队', '#FFA07A', 4);
```

### 创建点位

```sql
INSERT INTO locations (game_session_id, name, display_order) VALUES
('abc-123-def', '点位A', 1),
('abc-123-def', '点位B', 2),
('abc-123-def', '点位C', 3),
('abc-123-def', '点位D', 4);
```

### 初始化星星记录

```sql
-- 为每个队伍在每个点位创建初始记录
-- 需要替换实际的team_id和location_id
INSERT INTO star_records (game_session_id, team_id, location_id, stars, points)
SELECT
  'abc-123-def',
  t.id,
  l.id,
  0,
  0
FROM teams t
CROSS JOIN locations l
WHERE t.game_session_id = 'abc-123-def'
AND l.game_session_id = 'abc-123-def';
```

### 更新游戏场状态

```sql
-- 更新队伍和点位数量
UPDATE game_sessions
SET team_count = 4, location_count = 4
WHERE id = 'abc-123-def';

-- 上线游戏场
UPDATE game_sessions
SET status = 'online'
WHERE id = 'abc-123-def';
```

## 👤 创建管理员账号

### 高级管理员

```sql
INSERT INTO admins (username, password_hash, role)
VALUES ('admin', 'admin123', 'senior');
```

### 中级管理员

```sql
INSERT INTO admins (username, password_hash, role, game_session_id)
VALUES ('manager', 'manager123', 'mid', 'abc-123-def');
```

### 初级管理员

```sql
-- 需要指定分配的点位ID
INSERT INTO admins (username, password_hash, role, game_session_id, assigned_location_id)
VALUES ('officer', 'officer123', 'junior', 'abc-123-def', '点位ID');
```

**⚠️ 安全提示**: 示例中的密码是明文,生产环境必须使用bcrypt哈希!

## 🎮 创建游戏场

使用高级管理员账号登录后:

1. 访问 http://localhost:3000/admin/login
2. 使用高级管理员账号登录
3. 点击"游戏场管理"
4. 创建新游戏场并设置:
   - 游戏场名称
   - 队伍数量和名称
   - 点位数量和名称
5. 上线游戏场

## 🎯 开始游戏

### 玩家端

1. 访问 http://localhost:3000
2. 点击"选择游戏场"
3. 选择在线的游戏场
4. 查看实时得分榜、技能卡图鉴和使用日志

### 管理员端

#### 修改星星数

1. 登录管理员账号
2. 点击"修改星星数"
3. 选择队伍和点位
4. 输入星星数并提交

#### 发动技能卡

1. 玩家持技能卡找到中级管理员
2. 中级管理员登录中控台
3. 点击"发动技能卡"
4. 选择技能卡类型
5. 填写必要参数(目标队伍/点位等)
6. 确认发动

#### 发动突发事件

1. 中级/高级管理员登录
2. 点击"发动突发事件"
3. 选择事件类型
4. 填写参数(如果需要)
5. 确认发动

## ❓ 常见问题

### 1. 开发服务器启动失败

**问题**: pnpm dev 无法启动

**解决方案**:
- 检查Node.js版本 (需要18.17或更高)
- 删除 `node_modules` 和 `.next` 文件夹后重新安装
- 检查端口3000是否被占用

### 2. 数据不更新

**问题**: 修改数据后页面不更新

**解决方案**:
- 检查Supabase Realtime是否启用
- 在Supabase控制台的 Database -> Replication 中启用对应表的Realtime
- 刷新页面

### 3. 无法登录管理员

**问题**: 输入正确的用户名密码仍无法登录

**解决方案**:
- 检查数据库中是否有对应的管理员记录
- 检查环境变量配置是否正确
- 打开浏览器开发者工具查看网络请求是否成功

### 4. 页面样式错误

**问题**: 页面显示没有样式

**解决方案**:
- 清除浏览器缓存
- 确认Tailwind CSS配置正确
- 重新构建项目: `pnpm build`

### 5. 积分计算不正确

**问题**: 队伍积分显示错误

**解决方案**:
- 检查 `star_records` 表中的数据
- 确认每个队伍在每个点位都有记录
- 查看浏览器控制台是否有错误

## 📞 获取帮助

遇到问题?可以:
1. 查看浏览器开发者工具的Console输出
2. 查看Supabase日志
3. 在GitHub提交Issue
4. 查阅Supabase和Next.js官方文档

## 🎓 进阶配置

### 启用Supabase Realtime

在Supabase控制台:
1. Database -> Replication
2. 为以下表启用Realtime:
   - game_sessions
   - teams
   - locations
   - star_records
   - skill_card_logs
   - random_events
   - active_effects

### 配置密码哈希

生产环境应使用bcrypt:

```typescript
import bcrypt from 'bcrypt'

// 创建密码哈希
const hash = await bcrypt.hash('password', 10)

// 验证密码
const isValid = await bcrypt.compare('password', hash)
```

### 部署到生产环境

1. 在Vercel/Netlify等平台创建项目
2. 连接GitHub仓库
3. 配置环境变量
4. 自动部署

## 📚 相关文档

- [Next.js文档](https://nextjs.org/docs)
- [Supabase文档](https://supabase.com/docs)
- [Tailwind CSS文档](https://tailwindcss.com/docs)
- [TypeScript文档](https://www.typescriptlang.org/docs)
