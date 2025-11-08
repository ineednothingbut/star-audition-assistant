/**
 * 测试登录凭据
 *
 * 使用方法: node scripts/test-login.js
 */

import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcrypt'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testLogin() {
  const username = '2812578562'
  const password = '628107489'

  console.log('🔍 测试登录...\n')
  console.log(`用户名: ${username}`)
  console.log(`密码: ${password}\n`)

  // 1. 查询数据库
  console.log('步骤 1: 查询数据库...')

  // 先查询所有管理员，看看数据库中有什么
  const { data: allAdmins, error: allError } = await supabase
    .from('admins')
    .select('id, username, role')

  console.log('\n数据库中的所有管理员:')
  if (allError) {
    console.log('❌ 无法读取管理员列表:', allError.message)
  } else if (!allAdmins || allAdmins.length === 0) {
    console.log('❌ 数据库中没有任何管理员记录！')
    console.log('\n这意味着 SQL INSERT 命令没有成功执行。')
    console.log('\n请在 Supabase SQL Editor 中执行以下命令:')
    console.log('```sql')
    console.log('-- 临时禁用RLS')
    console.log('ALTER TABLE admins DISABLE ROW LEVEL SECURITY;')
    console.log('')
    console.log('-- 插入管理员账号')
    console.log("INSERT INTO admins (username, password_hash, role)")
    console.log("VALUES ('2812578562', '$2b$10$Fclgmku1UFr5Jpesj4FvIe.QHxN5n0U7k0wwpKFJ95S.HTBGuAUOm', 'senior');")
    console.log('')
    console.log('-- 重新启用RLS')
    console.log('ALTER TABLE admins ENABLE ROW LEVEL SECURITY;')
    console.log('```')
    return
  } else {
    allAdmins.forEach(admin => {
      console.log(`   - ${admin.username} (${admin.role})`)
    })
  }

  // 查询特定用户
  console.log(`\n步骤 2: 查询用户 ${username}...`)
  const { data: admins, error } = await supabase
    .from('admins')
    .select('id, username, password_hash, role')
    .eq('username', username)

  if (error) {
    console.log('❌ 数据库查询失败:', error.message)
    console.log('\n可能的原因:')
    console.log('1. Supabase连接配置错误')
    console.log('2. RLS策略阻止了读取')
    return
  }

  if (!admins || admins.length === 0) {
    console.log('❌ 未找到该用户')
    console.log('\n请确认:')
    console.log('1. 用户名拼写正确')
    console.log('2. SQL INSERT 命令中的用户名是 "2812578562"')
    return
  }

  const admin = admins[0]

  console.log('✅ 找到用户')
  console.log(`   ID: ${admin.id}`)
  console.log(`   角色: ${admin.role}`)
  console.log(`   密码哈希: ${admin.password_hash.substring(0, 20)}...`)

  // 2. 验证密码
  console.log('\n步骤 2: 验证密码...')
  const isValid = await bcrypt.compare(password, admin.password_hash)

  if (isValid) {
    console.log('✅ 密码验证成功！')
    console.log('\n登录应该可以正常工作。')
    console.log('如果网页上还是不行，请:')
    console.log('1. 清除浏览器缓存')
    console.log('2. 刷新页面')
    console.log('3. 检查浏览器控制台的错误信息')
  } else {
    console.log('❌ 密码验证失败')
    console.log('\n可能的原因:')
    console.log('1. SQL中的哈希值粘贴错误')
    console.log('2. 密码输入错误')
    console.log('\n请重新执行SQL命令，确保完整复制哈希值:')
    console.log(`$2b$10$Fclgmku1UFr5Jpesj4FvIe.QHxN5n0U7k0wwpKFJ95S.HTBGuAUOm`)
  }
}

testLogin()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('错误:', err)
    process.exit(1)
  })
