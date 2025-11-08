# 星光璀璨:总裁的试镜会 - 辅助网站

这是一个为线下游戏《星光璀璨:总裁的试镜会》开发的完整辅助网站系统。

## ✨ 功能特性

### 玩家功能
- ⭐ **实时得分表格** - 查看各队伍在不同点位的星星数和积分排名
- 🃏 **技能卡图鉴** - 浏览17种技能卡的详细信息
- 📜 **使用日志** - 查看技能卡使用历史和实时倒计时
- 💥 **突发事件** - 实时显示突发事件通知

### 管理员功能
- 👨‍💼 **多层级权限** - 初级/中级/高级管理员三个权限等级
- ⭐ **修改星星数** - 根据权限修改队伍在点位的星星数
- 🎮 **发动技能卡** - 中控台发动17种不同的技能卡
- 🌟 **突发事件管理** - 触发6种突发事件
- 🏰 **游戏场管理** - 创建/删除游戏场,设置队伍和点位
- 👥 **账号管理** - 管理管理员账号

## 🚀 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

复制 `.env.local.example` 到 `.env.local`:

```bash
cp .env.local.example .env.local
```

然后编辑 `.env.local` 填入你的Supabase配置:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. 初始化数据库

在Supabase控制台的SQL编辑器中执行 `database_schema.sql` 文件创建所有必要的表。

### 4. （可选）迁移现有密码

如果数据库中已有明文密码，运行迁移脚本：

```bash
pnpm migrate-passwords
```

### 5. 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:3000 查看应用。

详细部署指南请查看 [QUICKSTART.md](QUICKSTART.md)

## 📁 项目结构

```
star/
├── app/                          # Next.js页面
│   ├── page.tsx                  # 首页
│   ├── select-game/              # 选择游戏场
│   ├── game/[id]/                # 游戏页面
│   └── admin/                    # 管理员页面
├── components/                   # React组件
│   ├── ScoreTable.tsx            # 得分表格
│   ├── EventBanner.tsx           # 事件横幅
│   └── ...
├── lib/                          # 工具库
│   └── supabase.ts               # Supabase客户端
├── types/                        # 类型定义
│   ├── database.ts               # 数据库类型
│   └── game.ts                   # 游戏类型
└── database_schema.sql           # 数据库表结构
```

## 🎯 技术栈

- **前端框架**: Next.js 14 (App Router)
- **编程语言**: TypeScript
- **样式**: Tailwind CSS
- **数据库**: Supabase (PostgreSQL)
- **实时通信**: Supabase Realtime
- **密码安全**: Bcrypt (10轮salt)
- **包管理器**: pnpm

## 🃏 技能卡系统 (17种)

1. 效率诅咒系列 (5/10/15分钟)
2. 士气高涨系列 (5/10/15分钟)
3. 幸运聚焦
4. 星辉馈赠 (3/5/10颗)
5. 星蚀 (3/5/10颗)
6. 技能封锁
7. 净化
8. 荆棘护甲
9. 战略同盟
10. 时光凝滞
11. 排名窃取

## 💥 突发事件系统 (6种)

1. 收益波动(减少)
2. 收益波动(增加)
3. 天降甘霖
4. 黄金时间
5. 低谷时间
6. 侦测到特殊任务

## 📊 积分计算规则

- 每个点位独立计算排名
- 第一名: 10分,第二名: 9分,以此类推
- 星星数相同则并列排名
- 总积分 = 所有点位积分之和

## 🔐 管理员权限

### 初级管理员
- 修改指定点位的星星数

### 中级管理员
- 修改任意单元格
- 发动技能卡和突发事件

### 高级管理员
- 完全控制权限
- 管理游戏场和账号

## 📦 部署

支持部署到:
- Vercel (推荐)
- Netlify
- Railway
- 其他Next.js平台

## 🔒 安全特性

**已实现的安全措施**:
- ✅ Bcrypt密码哈希（10轮salt）
- ✅ 服务端密码验证
- ✅ 三级权限控制系统
- ✅ API端点验证和错误处理
- ✅ 环境变量保护敏感信息

**生产环境建议**:
- 配置Supabase RLS（Row Level Security）策略
- 启用HTTPS（必须）
- 限制CORS来源
- 考虑实现JWT会话管理
- 添加登录失败限制

详细安全文档请查看 [SECURITY.md](SECURITY.md)

## 📝 开发脚本

```bash
pnpm dev                # 启动开发服务器
pnpm build              # 构建生产版本
pnpm start              # 启动生产服务器
pnpm lint               # 运行ESLint
pnpm create-admin       # 创建第一个管理员账号（交互式）
pnpm migrate-passwords  # 迁移现有明文密码到bcrypt哈希
```

## 📚 文档

- [QUICKSTART.md](QUICKSTART.md) - 快速开始指南（10分钟部署）
- [USAGE_GUIDE.md](USAGE_GUIDE.md) - 详细使用说明
- [DATABASE_DESIGN.md](DATABASE_DESIGN.md) - 数据库设计文档
- [SECURITY.md](SECURITY.md) - 密码安全实现文档
- [FINAL_SUMMARY.md](FINAL_SUMMARY.md) - 项目完成总结

## 📄 许可证

MIT License
