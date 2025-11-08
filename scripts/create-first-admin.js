/**
 * 初始化脚本 - 创建第一个管理员账号
 *
 * 注意: 此脚本需要使用Supabase Service Role Key才能绕过RLS策略
 *
 * 使用方法:
 * 1. 在.env.local中添加: SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
 * 2. 运行: node scripts/create-first-admin.js
 *
 * Service Role Key获取方法:
 * - 访问 Supabase 项目设置 -> API -> service_role key (secret)
 * - ⚠️  警告: Service Role Key 非常敏感，不要泄露或提交到代码库
 */

import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcrypt'
import dotenv from 'dotenv'
import readline from 'readline'

// 加载环境变量
dotenv.config({ path: '.env.local' })

const SALT_ROUNDS = 10

// 检查是否有service_role key
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  console.error('❌ 错误: 未找到 NEXT_PUBLIC_SUPABASE_URL 环境变量')
  console.error('   请检查 .env.local 文件')
  process.exit(1)
}

if (!serviceRoleKey) {
  console.log('⚠️  警告: 未找到 SUPABASE_SERVICE_ROLE_KEY 环境变量')
  console.log('')
  console.log('由于RLS策略限制，此脚本需要使用Service Role Key才能创建管理员。')
  console.log('')
  console.log('📝 请按以下步骤操作:')
  console.log('')
  console.log('1. 访问Supabase项目设置: https://supabase.com/dashboard/project/_/settings/api')
  console.log('2. 找到 "service_role" key (secret)')
  console.log('3. 在 .env.local 文件中添加:')
  console.log('   SUPABASE_SERVICE_ROLE_KEY=eyJhbG...(你的service_role key)')
  console.log('')
  console.log('或者使用SQL方法创建管理员，详见: CREATE_FIRST_ADMIN.md')
  console.log('')
  process.exit(1)
}

// 使用service_role key创建客户端（绕过RLS）
const supabase = createClient(supabaseUrl, serviceRoleKey)

// 创建readline接口用于用户输入
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function createFirstAdmin() {
  console.log('🔐 创建第一个管理员账号\n')

  try {
    // 检查是否已有管理员
    const { data: existingAdmins } = await supabase
      .from('admins')
      .select('id, username')
      .limit(1)

    if (existingAdmins && existingAdmins.length > 0) {
      console.log('⚠️  数据库中已存在管理员账号:')
      existingAdmins.forEach(admin => {
        console.log(`   - ${admin.username}`)
      })
      const confirm = await question('\n是否继续创建新管理员? (y/n): ')
      if (confirm.toLowerCase() !== 'y') {
        console.log('取消创建')
        rl.close()
        process.exit(0)
      }
    }

    // 获取用户输入
    const username = await question('\n请输入用户名: ')
    if (!username || !username.trim()) {
      console.log('❌ 用户名不能为空')
      rl.close()
      process.exit(1)
    }

    const password = await question('请输入密码 (至少8位): ')
    if (!password || password.length < 8) {
      console.log('❌ 密码至少需要8个字符')
      rl.close()
      process.exit(1)
    }

    const confirmPassword = await question('请再次输入密码: ')
    if (password !== confirmPassword) {
      console.log('❌ 两次输入的密码不一致')
      rl.close()
      process.exit(1)
    }

    console.log('\n正在创建管理员账号...')

    // 哈希密码
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS)

    // 插入管理员账号
    const { data, error } = await supabase
      .from('admins')
      .insert({
        username: username.trim(),
        password_hash,
        role: 'senior'
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        console.log(`\n❌ 用户名 "${username}" 已存在`)
      } else {
        console.log('\n❌ 创建失败:', error.message)
      }
      rl.close()
      process.exit(1)
    }

    console.log('\n✅ 管理员账号创建成功!')
    console.log(`   用户名: ${username}`)
    console.log(`   角色: 高级管理员 (senior)`)
    console.log(`\n现在可以访问 http://localhost:3000/admin/login 登录`)

  } catch (error) {
    console.error('\n❌ 创建过程出错:', error.message)
    rl.close()
    process.exit(1)
  }

  rl.close()
  process.exit(0)
}

// 运行脚本
createFirstAdmin()
