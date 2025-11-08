import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { hashPassword } from '@/utils/password'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { username, password, role, game_session_id, assigned_location_id } = await request.json()

    // Validate required fields
    if (!username || !password || !role) {
      return NextResponse.json({
        success: false,
        message: '用户名、密码和角色不能为空'
      })
    }

    // Hash the password using bcrypt
    const password_hash = await hashPassword(password)

    // Insert the new admin account
    const { data, error } = await supabase
      .from('admins')
      .insert({
        username,
        password_hash,
        role,
        game_session_id: (role === 'junior' || role === 'mid') ? game_session_id : null,
        assigned_location_id: role === 'junior' ? assigned_location_id : null
      })
      .select('id, username, role, game_session_id, assigned_location_id, created_at')
      .single()

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({
          success: false,
          message: '用户名已存在'
        })
      }
      console.error('Create account error:', error)
      return NextResponse.json({
        success: false,
        message: '创建失败'
      })
    }

    return NextResponse.json({
      success: true,
      message: '账号创建成功',
      account: data
    })
  } catch (error) {
    console.error('Create account error:', error)
    return NextResponse.json({
      success: false,
      message: '服务器错误'
    })
  }
}
