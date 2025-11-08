# 🚀 快速开始指南

欢迎使用《星光璀璨:总裁的试镜会》辅助网站！本指南将帮助您在10分钟内完成部署和配置。

## 📋 前置要求

- Node.js 18.17 或更高版本
- pnpm 包管理器
- Supabase 账号（免费）

## ⚡ 5步快速部署

### 第1步：安装依赖

```bash
cd star
pnpm install
```

### 第2步：配置Supabase

1. 访问 https://supabase.com 注册账号
2. 创建新项目
3. 复制项目URL和匿名密钥
4. 创建环境变量文件：

```bash
cp .env.local.example .env.local
```

5. 编辑 `.env.local`，填入您的Supabase信息：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 第3步：初始化数据库

1. 打开Supabase控制台
2. 点击左侧 "SQL Editor"
3. 新建查询
4. 复制并执行 `database_schema.sql` 文件内容
5. 点击 "Run" 执行

### 第4步：创建初始管理员账号

#### 方法一：使用SQL直接创建（推荐，最简单）

这是创建第一个管理员最简单的方法：

**步骤1**: 生成密码哈希

在终端运行以下命令（需要先执行 `pnpm install`）：

```bash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('your-password', 10).then(hash => console.log(hash))"
```

**重要**: 将 `your-password` 替换为您想要的密码（至少8位）

**步骤2**: 在Supabase SQL Editor中执行

复制步骤1生成的哈希值（形如 `$2b$10$N9qo...`），然后在Supabase控制台执行：

```sql
-- 临时禁用RLS来创建第一个管理员
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;

-- 插入管理员账号（替换下面的哈希值）
INSERT INTO admins (username, password_hash, role)
VALUES ('admin', '步骤1生成的完整哈希值', 'senior');

-- 重新启用RLS（重要！）
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- 创建测试游戏场
INSERT INTO game_sessions (name, status)
VALUES ('测试游戏场', 'online');
```

#### 方法二：使用脚本创建（需要Service Role Key）

如果您想使用脚本，需要先配置Service Role Key：

**步骤1**: 获取Service Role Key
- 访问 Supabase 项目设置 -> API
- 复制 `service_role` key（标记为secret的那个）

**步骤2**: 添加到环境变量

在 `.env.local` 文件中添加：
```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...（你的service_role key）
```

⚠️ **警告**: Service Role Key非常敏感，不要泄露或提交到Git！

**步骤3**: 运行脚本
```bash
pnpm create-admin
```

---

**详细说明**: 请参阅 [CREATE_FIRST_ADMIN.md](CREATE_FIRST_ADMIN.md)

### 第5步：启动项目

```bash
pnpm dev
```

打开浏览器访问: http://localhost:3000

## 🎮 开始使用

### 玩家端使用

1. 访问 http://localhost:3000
2. 点击"选择游戏场"
3. 选择"测试游戏场"
4. 查看实时得分榜、技能卡图鉴和使用日志

### 管理员端使用

1. 访问 http://localhost:3000/admin/login
2. 使用您在第4步创建的管理员账号登录
3. 进入管理员仪表板

## 📝 配置游戏场

登录管理员账号后，按以下步骤配置游戏场：

### 1. 编辑游戏场

1. 点击"游戏场管理"
2. 找到"测试游戏场"
3. 点击"✏️ 编辑队伍和点位"

### 2. 添加队伍

1. 在"队伍管理"区域输入队伍名称（如"A队"）
2. 选择队伍颜色
3. 点击"+ 添加队伍"
4. 重复添加更多队伍（建议4-6支）

### 3. 添加点位

1. 在"点位管理"区域输入点位名称（如"点位A"）
2. 点击"+ 添加点位"
3. 重复添加更多点位（建议4-6个）

### 4. 系统自动处理

- 系统会自动为每个队伍在每个点位创建星星记录
- 自动更新队伍和点位数量
- 游戏场已经设置为"在线"状态

## 🎯 测试功能

### 测试星星数修改

1. 点击"修改星星数"
2. 选择队伍和点位
3. 输入星星数（如 5）
4. 点击"更新星星数"
5. 查看玩家端得分榜实时更新

### 测试技能卡发动

1. 点击"发动技能卡"
2. 选择技能卡类型（如"星辉馈赠×3"）
3. 选择发动队伍
4. 为不同队伍分配星星
5. 点击"发动技能卡"
6. 查看玩家端日志实时显示

### 测试突发事件

1. 点击"发动突发事件"
2. 选择事件类型（如"黄金时间"）
3. 点击"发动事件"
4. 查看玩家端顶部横幅显示事件

## 🔧 常见问题

### Q: 页面显示"游戏场不存在"

A: 确保游戏场状态为"online"，并且URL中的游戏场ID正确。

### Q: 数据不实时更新

A: 在Supabase控制台的 Database -> Replication 中启用所有表的Realtime功能。

### Q: 无法登录管理员

A: 检查数据库中是否有管理员记录，确认用户名和密码正确。

### Q: 修改星星数后积分未更新

A: 积分会自动计算，刷新页面查看。如果还是没有更新，检查数据库中的star_records表。

## 📚 下一步

### 创建更多管理员

1. 高级管理员登录
2. 点击"账号管理"
3. 创建中级管理员（可发动技能卡）
4. 创建初级管理员（分配指定点位）

### 开始正式游戏

1. 创建正式游戏场
2. 添加所有队伍和点位
3. 创建初级管理员账号（每个点位一个）
4. 创建中级管理员账号（发动技能卡）
5. 上线游戏场
6. 玩家访问网站查看实时数据

## 🎉 完成！

您已经成功部署了游戏辅助网站！

### 功能清单

✅ 实时得分榜
✅ 技能卡图鉴（17种）
✅ 技能卡使用日志
✅ 突发事件通知（6种）
✅ 星星数修改
✅ 技能卡发动
✅ 突发事件管理
✅ 游戏场管理
✅ 账号管理

## 📞 需要帮助？

- 查看 `USAGE_GUIDE.md` 了解详细使用说明
- 查看 `DATABASE_DESIGN.md` 了解数据库设计
- 查看 `FINAL_SUMMARY.md` 了解完整功能列表

## ⚠️ 安全提示

**密码安全**:

1. ✅ 密码使用bcrypt进行安全哈希存储
2. ✅ 所有新创建的管理员账号密码自动加密
3. 如果数据库中有旧的明文密码，运行迁移脚本：
   ```bash
   pnpm migrate-passwords
   ```
4. 配置适当的Supabase RLS策略
5. 使用环境变量保护敏感信息
6. 定期更换管理员密码

祝您游戏愉快！🎊
