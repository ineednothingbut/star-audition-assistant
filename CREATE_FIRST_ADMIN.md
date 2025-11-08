# 创建第一个管理员账号 - SQL方法

由于RLS策略限制，创建第一个管理员需要在Supabase SQL Editor中执行。

## 📝 步骤

### 1. 生成密码哈希

在您的电脑终端运行（需要先安装依赖 `pnpm install`）：

```bash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('your-password-here', 10).then(hash => console.log(hash))"
```

**重要**: 将 `your-password-here` 替换为您想要的密码。

### 2. 在Supabase SQL Editor中执行

复制步骤1生成的bcrypt哈希值，然后在Supabase控制台的SQL Editor中执行：

```sql
-- 临时禁用RLS来创建第一个管理员
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;

-- 插入管理员账号（替换下面的bcrypt哈希值）
INSERT INTO admins (username, password_hash, role)
VALUES ('admin', '$2b$10$生成的哈希值', 'senior');

-- 重新启用RLS（重要！）
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
```

### 3. 创建测试游戏场（可选）

```sql
INSERT INTO game_sessions (name, status)
VALUES ('测试游戏场', 'online');
```

## ✅ 完成

现在可以使用创建的用户名和密码登录管理员后台了：
- 访问: http://localhost:3000/admin/login
- 使用您设置的用户名和密码登录

---

## 🔐 为什么需要这样做？

这是因为：
1. Supabase RLS策略保护admins表，防止未授权访问
2. 第一个管理员需要特殊权限创建
3. 后续的管理员可以通过Web界面的"账号管理"功能创建

## 📌 注意事项

- 生成的bcrypt哈希值形如: `$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy`
- 确保在插入后重新启用RLS
- 密码至少使用8个字符，包含字母和数字
