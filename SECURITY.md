# 🔒 密码安全实现文档

本文档详细说明了项目中实现的bcrypt密码哈希安全机制。

## ✅ 已实现的安全特性

### 1. Bcrypt密码哈希

**实现文件**: `utils/password.ts`

```typescript
- hashPassword(password: string): 使用bcrypt生成密码哈希
- verifyPassword(password: string, hash: string): 验证密码
- SALT_ROUNDS: 10 (安全与性能的平衡)
```

**特点**:
- 使用bcrypt算法（业界标准）
- 10轮salt rounds（推荐值）
- 自动生成随机salt
- 单向哈希，无法逆向破解

### 2. 登录验证

**实现文件**: `app/api/admin/login/route.ts`

```typescript
// 使用bcrypt验证密码
const isPasswordValid = await verifyPassword(password, admin.password_hash)
```

**安全措施**:
- 密码验证在服务端完成
- 不返回password_hash到客户端
- 使用统一的错误消息防止用户名枚举
- 密码验证失败时有适当的延迟

### 3. 账号创建

**实现文件**: `app/api/admin/create-account/route.ts`

```typescript
// 密码在存储前自动哈希
const password_hash = await hashPassword(password)
```

**安全措施**:
- 所有新账号密码自动哈希
- 服务端处理，客户端无法绕过
- 哈希后立即丢弃明文密码
- 支持唯一约束检查（防止重复用户名）

### 4. 密码迁移脚本

**实现文件**: `scripts/migrate-passwords.js`

用于将现有明文密码转换为bcrypt哈希。

**使用方法**:
```bash
pnpm migrate-passwords
```

**功能**:
- 自动检测bcrypt哈希（跳过已哈希的密码）
- 批量处理所有管理员账号
- 详细的进度和错误报告
- 安全地处理迁移过程

## 🔐 Bcrypt技术详解

### 什么是Bcrypt？

Bcrypt是一种专门为密码存储设计的哈希算法，具有以下特点：

1. **慢速哈希**: 通过计算成本参数（salt rounds）控制哈希速度
2. **自动加盐**: 每个密码都有唯一的随机salt
3. **单向函数**: 无法从哈希反推出原始密码
4. **抗彩虹表**: 由于随机salt，彩虹表攻击无效
5. **可配置强度**: 可通过增加rounds提高安全性

### Salt Rounds说明

当前设置: `SALT_ROUNDS = 10`

| Rounds | 哈希时间 | 安全性 | 推荐使用场景 |
|--------|---------|--------|-------------|
| 8      | ~40ms   | 基本   | 开发测试 |
| 10     | ~150ms  | 良好   | **生产环境（当前值）** |
| 12     | ~600ms  | 很高   | 高安全要求 |
| 14     | ~2.5s   | 极高   | 极度敏感数据 |

**为什么选择10?**
- 平衡了安全性和用户体验
- 符合OWASP推荐标准
- 防止暴力破解攻击
- 不会造成明显的登录延迟

### 密码哈希示例

```javascript
// 明文密码
const plainPassword = "admin123"

// Bcrypt哈希（60个字符）
const hash = "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"

// 哈希格式解析:
// $2b$    - Bcrypt算法版本
// 10$     - Salt rounds (成本参数)
// N9qo... - 22字符的salt
// ...     - 31字符的哈希值
```

## 🛡️ 安全最佳实践

### 已实施的措施

1. ✅ **密码哈希**: 所有密码使用bcrypt存储
2. ✅ **服务端验证**: 密码验证仅在服务端进行
3. ✅ **不返回敏感信息**: API不返回password_hash
4. ✅ **统一错误消息**: 防止用户名枚举攻击
5. ✅ **环境变量**: 数据库凭据通过.env.local保护

### 建议的额外措施

1. ⚠️ **密码复杂度要求** (可选):
   ```typescript
   // 在create-account API中添加
   if (password.length < 8) {
     return NextResponse.json({
       success: false,
       message: '密码至少需要8个字符'
     })
   }
   ```

2. ⚠️ **登录失败限制** (推荐):
   - 实现登录尝试次数限制
   - 添加验证码或延迟机制
   - 记录失败的登录尝试

3. ⚠️ **会话管理** (推荐):
   - 使用JWT替代localStorage
   - 实现会话过期机制
   - 添加刷新token功能

4. ⚠️ **HTTPS强制** (必须):
   - 生产环境必须使用HTTPS
   - 防止密码在传输过程中被截获

5. ⚠️ **审计日志** (可选):
   - 记录所有登录尝试
   - 记录密码修改操作
   - 记录管理员敏感操作

## 📋 安全检查清单

### 部署前必检项目

- [x] 密码使用bcrypt哈希存储
- [x] API在服务端验证密码
- [x] 不返回password_hash到客户端
- [ ] 配置HTTPS（生产环境必须）
- [ ] 启用Supabase RLS策略
- [ ] 限制CORS来源
- [ ] 设置安全的Cookie属性（如使用JWT）

### 可选增强项目

- [ ] 实现密码复杂度要求
- [ ] 添加登录失败限制
- [ ] 实现JWT会话管理
- [ ] 添加双因素认证（2FA）
- [ ] 实现密码重置功能
- [ ] 添加审计日志系统
- [ ] 定期密码过期策略

## 🔧 密码迁移指南

### 场景1: 新部署（无现有数据）

直接使用当前系统即可，所有新创建的账号都会自动使用bcrypt哈希。

**步骤**:
1. 配置Supabase环境变量
2. 执行database_schema.sql
3. 通过Web界面创建管理员账号
4. 密码自动加密存储

### 场景2: 已有明文密码数据

需要运行迁移脚本转换现有密码。

**步骤**:
```bash
# 1. 备份数据库（重要！）
# 在Supabase控制台导出数据

# 2. 运行迁移脚本
pnpm migrate-passwords

# 3. 验证迁移结果
# 登录测试所有管理员账号

# 4. 确认无误后，删除备份
```

**迁移脚本输出示例**:
```
🔐 开始密码迁移...

📋 找到 3 个管理员账号

🔄 处理 admin...
✅ admin 密码已加密
⏭️  跳过 testuser - 密码已经是bcrypt哈希
🔄 处理 operator...
✅ operator 密码已加密

==================================================
📊 迁移完成统计:
  ✅ 成功迁移: 2 个账号
  ⏭️  跳过: 1 个账号 (已经是bcrypt哈希)
  ❌ 失败: 0 个账号
==================================================

⚠️  重要提示:
   所有管理员的密码现在都已加密存储
   请确保管理员记住他们原来的密码
   如果忘记密码，需要重新创建账号

✨ 密码迁移脚本执行完毕
```

## 🆘 常见问题

### Q: 如果忘记管理员密码怎么办？

A: 当前系统没有密码重置功能。解决方案：
1. 使用高级管理员账号删除该账号
2. 重新创建同名账号（如需保持用户名）
3. 或者直接在数据库中更新password_hash字段（需要先用脚本生成哈希）

### Q: 可以提高salt rounds到12或更高吗？

A: 可以，但需要权衡：
- 更高的rounds = 更安全 + 更慢的登录
- 修改`utils/password.ts`中的`SALT_ROUNDS`常量
- 建议进行性能测试后再决定

### Q: 迁移脚本安全吗？会泄露密码吗？

A: 安全。脚本：
- 仅在服务端运行
- 不会在控制台输出密码
- 不会将密码写入日志文件
- 使用与系统相同的bcrypt库

### Q: 为什么不使用SHA256或MD5？

A: 因为：
- MD5和SHA256太快，容易被暴力破解
- 它们不是专为密码设计的
- 没有内置的salt机制（需要手动实现）
- Bcrypt是专门为密码存储设计的标准

### Q: 数据库中的password_hash可以看到吗？

A: 可以在数据库中看到，但：
- 哈希值无法逆向得到原始密码
- 每个密码都有唯一的salt
- 即使两个用户密码相同，哈希值也完全不同
- 这就是哈希的意义：存储不可逆的密码表示

## 📚 相关文件

- `utils/password.ts` - 密码哈希工具函数
- `app/api/admin/login/route.ts` - 登录验证API
- `app/api/admin/create-account/route.ts` - 创建账号API
- `scripts/migrate-passwords.js` - 密码迁移脚本
- `app/admin/accounts/page.tsx` - 账号管理页面

## 🎓 延伸阅读

- [Bcrypt官方文档](https://github.com/kelektiv/node.bcrypt.js)
- [OWASP密码存储指南](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [为什么密码哈希很重要](https://auth0.com/blog/hashing-passwords-one-way-road-to-security/)
- [Salt和Pepper的区别](https://www.okta.com/identity-101/password-salt/)

---

**文档版本**: 1.0
**最后更新**: 2025-11-08
**维护者**: 开发团队
