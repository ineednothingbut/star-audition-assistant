import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-royal-purple via-purple-400 to-royal-gold">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 text-white">
          <div className="text-8xl mb-6 animate-bounce">🏰</div>
          <h1 className="text-6xl font-bold mb-4 drop-shadow-lg">
            星光璀璨
          </h1>
          <h2 className="text-3xl font-semibold mb-2">
            总裁的试镜会
          </h2>
          <p className="text-xl opacity-90">
            游戏辅助系统
          </p>
        </div>

        <div className="elegant-card mb-8">
          <h2 className="text-2xl font-bold text-royal-purple mb-6 text-center">
            欢迎使用游戏辅助网站
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <span className="text-3xl">⭐</span>
              <div>
                <h3 className="font-semibold text-lg mb-1">实时得分跟踪</h3>
                <p className="text-gray-600">查看各队伍在不同点位的星星数和积分排名</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <span className="text-3xl">🃏</span>
              <div>
                <h3 className="font-semibold text-lg mb-1">技能卡系统</h3>
                <p className="text-gray-600">17种技能卡,查看图鉴和使用日志</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <span className="text-3xl">💥</span>
              <div>
                <h3 className="font-semibold text-lg mb-1">突发事件</h3>
                <p className="text-gray-600">实时显示突发事件和倒计时</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <span className="text-3xl">🎮</span>
              <div>
                <h3 className="font-semibold text-lg mb-1">管理员中控台</h3>
                <p className="text-gray-600">发动技能卡、管理突发事件和游戏场设置</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/select-game"
            className="btn-primary text-center text-lg px-8 py-4"
          >
            🎯 选择游戏场
          </Link>
          <Link
            href="/admin/login"
            className="btn-secondary text-center text-lg px-8 py-4"
          >
            🔐 管理员登录
          </Link>
        </div>

        <div className="mt-12 text-center text-white">
          <p className="text-sm opacity-75">
            使用 Next.js + TypeScript + Tailwind CSS + Supabase 构建
          </p>
        </div>
      </div>
    </main>
  )
}
