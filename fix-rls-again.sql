-- 修复管理员表的RLS策略，确保登录功能正常

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON admins;
DROP POLICY IF EXISTS "Enable read access for all users" ON admins;

-- 创建允许所有人读取的策略（登录需要）
CREATE POLICY "Allow all to read admins" ON admins
  FOR SELECT
  USING (true);

-- 创建允许所有人更新的策略（更改密码等需要）
DROP POLICY IF EXISTS "Allow all to update admins" ON admins;
CREATE POLICY "Allow all to update admins" ON admins
  FOR UPDATE
  USING (true);

-- 验证策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'admins';
