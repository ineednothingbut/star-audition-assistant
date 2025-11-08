import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyPassword } from '@/utils/password'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    // 查询管理员账号
    const { data: admin, error } = await supabase
      .from('admins')
      .select('id, username, role, game_session_id, assigned_location_id, password_hash')
      .eq('username', username)
      .single()

    if (error || !admin) {
      return NextResponse.json({ success: false, message: '用户名或密码错误' })
    }

    // 使用bcrypt验证密码
    const isPasswordValid = await verifyPassword(password, admin.password_hash)

    if (isPasswordValid) {
      // 不返回password_hash
      const { password_hash, ...adminData } = admin

      return NextResponse.json({
        success: true,
        admin: adminData
      })
    }

    return NextResponse.json({ success: false, message: '用户名或密码错误' })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ success: false, message: '服务器错误' })
  }
}
