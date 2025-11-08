/**
 * 密码迁移脚本
 *
 * 此脚本用于将数据库中现有的明文密码转换为bcrypt哈希密码
 *
 * 使用方法:
 * 1. 在.env.local中添加SUPABASE_SERVICE_ROLE_KEY
 * 2. 运行: node scripts/migrate-passwords.js
 *
 * ⚠️ 警告:
 * - 此脚本仅应运行一次
 * - 运行前请备份数据库
 * - 确保所有管理员都知道他们的密码将被哈希
 * - 需要使用Service Role Key才能绕过RLS策略
 */

import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcrypt'
import dotenv from 'dotenv'

// 加载环境变量
dotenv.config({ path: '.env.local' })

const SALT_ROUNDS = 10

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  console.error('❌ 错误: 未找到 NEXT_PUBLIC_SUPABASE_URL 环境变量')
  console.error('   请检查 .env.local 文件')
  process.exit(1)
}

if (!serviceRoleKey) {
  console.log('⚠️  警告: 未找到 SUPABASE_SERVICE_ROLE_KEY 环境变量')
  console.log('')
  console.log('由于RLS策略限制，此脚本需要使用Service Role Key才能更新密码。')
  console.log('')
  console.log('📝 请按以下步骤操作:')
  console.log('')
  console.log('1. 访问Supabase项目设置: https://supabase.com/dashboard/project/_/settings/api')
  console.log('2. 找到 "service_role" key (secret)')
  console.log('3. 在 .env.local 文件中添加:')
  console.log('   SUPABASE_SERVICE_ROLE_KEY=eyJhbG...(你的service_role key)')
  console.log('')
  process.exit(1)
}

// 使用service_role key创建客户端（绕过RLS）
const supabase = createClient(supabaseUrl, serviceRoleKey)

async function migratePasswords() {
  console.log('🔐 开始密码迁移...\n')

  try {
    // 获取所有管理员账号
    const { data: admins, error: fetchError } = await supabase
      .from('admins')
      .select('id, username, password_hash')

    if (fetchError) {
      console.error('❌ 获取管理员账号失败:', fetchError)
      return
    }

    if (!admins || admins.length === 0) {
      console.log('ℹ️  数据库中没有管理员账号')
      return
    }

    console.log(`📋 找到 ${admins.length} 个管理员账号\n`)

    let migratedCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (const admin of admins) {
      try {
        // 检查是否已经是bcrypt哈希
        // bcrypt哈希通常以 $2a$, $2b$, 或 $2y$ 开头，长度为60个字符
        const isBcryptHash = admin.password_hash &&
          admin.password_hash.length === 60 &&
          /^\$2[aby]\$/.test(admin.password_hash)

        if (isBcryptHash) {
          console.log(`⏭️  跳过 ${admin.username} - 密码已经是bcrypt哈希`)
          skippedCount++
          continue
        }

        // 如果是明文密码，进行哈希处理
        console.log(`🔄 处理 ${admin.username}...`)
        const hashedPassword = await bcrypt.hash(admin.password_hash, SALT_ROUNDS)

        // 更新数据库
        const { error: updateError } = await supabase
          .from('admins')
          .update({ password_hash: hashedPassword })
          .eq('id', admin.id)

        if (updateError) {
          console.error(`❌ 更新 ${admin.username} 失败:`, updateError)
          errorCount++
        } else {
          console.log(`✅ ${admin.username} 密码已加密`)
          migratedCount++
        }
      } catch (error) {
        console.error(`❌ 处理 ${admin.username} 时出错:`, error.message)
        errorCount++
      }
    }

    console.log('\n' + '='.repeat(50))
    console.log('📊 迁移完成统计:')
    console.log(`  ✅ 成功迁移: ${migratedCount} 个账号`)
    console.log(`  ⏭️  跳过: ${skippedCount} 个账号 (已经是bcrypt哈希)`)
    console.log(`  ❌ 失败: ${errorCount} 个账号`)
    console.log('='.repeat(50))

    if (migratedCount > 0) {
      console.log('\n⚠️  重要提示:')
      console.log('   所有管理员的密码现在都已加密存储')
      console.log('   请确保管理员记住他们原来的密码')
      console.log('   如果忘记密码，需要重新创建账号')
    }
  } catch (error) {
    console.error('❌ 迁移过程出错:', error)
  }
}

// 运行迁移
migratePasswords()
  .then(() => {
    console.log('\n✨ 密码迁移脚本执行完毕')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ 脚本执行失败:', error)
    process.exit(1)
  })
