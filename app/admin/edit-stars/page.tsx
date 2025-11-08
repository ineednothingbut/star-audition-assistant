'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { playIncreaseSound, playDecreaseSound } from '@/utils/sound'

interface Admin {
  id: string
  username: string
  role: 'junior' | 'mid' | 'senior'
  game_session_id: string | null
  assigned_location_id: string | null
}

interface Team {
  id: string
  name: string
  color: string
  display_order: number
}

interface Location {
  id: string
  name: string
  display_order: number
}

interface StarRecord {
  id: string
  team_id: string
  location_id: string
  stars: number
  points: number
}

interface GameSession {
  id: string
  name: string
  status: string
}

interface ScoreData {
  team: Team
  records: Record<string, StarRecord>
  totalPoints: number
}

interface ActiveEffect {
  id: string
  effect_type: string
  team_id: string | null
  target_location_id: string | null
  effect_value: number | null
  end_time: string
}

interface StarChangeLog {
  id: string
  admin_id: string
  team_id: string
  location_id: string
  old_stars: number
  new_stars: number
  change_amount: number
  base_change?: number // 原始变化量
  multipliers?: number[] | null // 应用的倍率数组
  created_at: string
}

interface AdminInfo {
  id: string
  username: string
}

export default function EditStarsPage() {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [gameSessions, setGameSessions] = useState<GameSession[]>([])
  const [selectedGameSession, setSelectedGameSession] = useState('')
  const [teams, setTeams] = useState<Team[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [scoreData, setScoreData] = useState<ScoreData[]>([])
  const [activeEffects, setActiveEffects] = useState<ActiveEffect[]>([])
  const [changeLogs, setChangeLogs] = useState<StarChangeLog[]>([])
  const [adminsMap, setAdminsMap] = useState<Record<string, string>>({}) // admin_id => username
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [updatingCells, setUpdatingCells] = useState<Set<string>>(new Set()) // 记录正在更新的单元格
  const [pendingChanges, setPendingChanges] = useState<Record<string, number>>({}) // 记录待处理的变化累加
  const router = useRouter()
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const adminData = localStorage.getItem('admin')
    if (!adminData) {
      router.push('/admin/login')
      return
    }

    const parsedAdmin = JSON.parse(adminData)
    setAdmin(parsedAdmin)

    // 初级管理员必须有分配的游戏场
    if (parsedAdmin.role === 'junior') {
      if (parsedAdmin.game_session_id) {
        setSelectedGameSession(parsedAdmin.game_session_id)
        loadData(parsedAdmin.game_session_id)
      } else {
        alert('您的账号未分配游戏场，请联系高级管理员')
        router.push('/admin/dashboard')
      }
    } else {
      // 中级和高级管理员加载所有游戏场
      loadGameSessions()
    }
  }, [router])

  async function loadGameSessions() {
    const { data } = await supabase
      .from('game_sessions')
      .select('id, name, status')
      .eq('status', 'online')
      .order('created_at', { ascending: false })

    if (data && data.length > 0) {
      setGameSessions(data)
      setSelectedGameSession(data[0].id)
      loadData(data[0].id)
    } else {
      setLoading(false)
    }
  }

  // 当选择的游戏场改变时
  useEffect(() => {
    if (selectedGameSession && admin && admin.role !== 'junior') {
      loadData(selectedGameSession)
    }
  }, [selectedGameSession])

  async function loadData(gameSessionId: string, showLoading = true) {
    // 防止短时间内重复刷新
    if (isRefreshing) {
      console.log('⏸️ 正在刷新中，跳过本次请求')
      return
    }

    setIsRefreshing(true)
    if (showLoading) {
      setLoading(true)
    }

    try {
      // 加载队伍
      const { data: teamsData } = await supabase
        .from('teams')
        .select('*')
        .eq('game_session_id', gameSessionId)
        .order('display_order', { ascending: true })

      // 加载点位
      const { data: locationsData } = await supabase
        .from('locations')
        .select('*')
        .eq('game_session_id', gameSessionId)
        .order('display_order', { ascending: true })

      // 加载星星记录
      const { data: recordsData } = await supabase
        .from('star_records')
        .select('*')
        .eq('game_session_id', gameSessionId)

      // 加载生效中的效果（只查询未过期的）
      const { data: effectsData } = await supabase
        .from('active_effects')
        .select('*')
        .eq('game_session_id', gameSessionId)
        .gte('end_time', new Date().toISOString())

      // 加载管理员信息
      const { data: adminsData } = await supabase
        .from('admins')
        .select('id, username')

      // 加载修改日志（最近50条）
      let logsQuery = supabase
        .from('star_change_logs')
        .select('*')
        .eq('game_session_id', gameSessionId)
        .order('created_at', { ascending: false })
        .limit(50)

      // 如果是初级管理员，只查询自己的日志
      if (admin && admin.role === 'junior') {
        logsQuery = logsQuery.eq('admin_id', admin.id)
      }

      const { data: logsData } = await logsQuery

      if (teamsData && locationsData && recordsData) {
        setTeams(teamsData)
        setLocations(locationsData)
        if (effectsData) {
          console.log(`✅ 加载了 ${effectsData.length} 个活跃效果`, effectsData)
          setActiveEffects(effectsData)
        }
        if (adminsData) {
          const adminMap: Record<string, string> = {}
          adminsData.forEach((a: AdminInfo) => {
            adminMap[a.id] = a.username
          })
          setAdminsMap(adminMap)
        }
        if (logsData) {
          setChangeLogs(logsData)
        }

        // 组织数据
        const organized = teamsData.map(team => {
          const teamRecords: Record<string, StarRecord> = {}
          let totalPoints = 0

          locationsData.forEach(location => {
            const record = recordsData.find(
              r => r.team_id === team.id && r.location_id === location.id
            )
            if (record) {
              teamRecords[location.id] = record
              totalPoints += record.points
            }
          })

          return {
            team,
            records: teamRecords,
            totalPoints
          }
        })

        // 中控台按创建顺序（display_order）显示，不按积分排序
        setScoreData(organized)
      }

      if (showLoading) {
        setLoading(false)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      if (showLoading) {
        setLoading(false)
      }
    } finally {
      // 500ms 后允许下次刷新
      setTimeout(() => setIsRefreshing(false), 500)
    }
  }

  // 订阅实时更新（只订阅一次）
  useEffect(() => {
    if (!selectedGameSession) return

    console.log('📡 订阅游戏场:', selectedGameSession)

    const starRecordsChannel = supabase
      .channel(`star_records_admin_${selectedGameSession}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'star_records',
          filter: `game_session_id=eq.${selectedGameSession}`,
        },
        () => {
          console.log('🔔 收到数据库更新通知，静默刷新数据')
          loadData(selectedGameSession, false) // 静默刷新，不显示加载动画
        }
      )
      .subscribe()

    const changeLogsChannel = supabase
      .channel(`star_change_logs_${selectedGameSession}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'star_change_logs',
          filter: `game_session_id=eq.${selectedGameSession}`,
        },
        () => {
          console.log('📝 收到日志更新通知，静默刷新日志')
          loadData(selectedGameSession, false)
        }
      )
      .subscribe()

    return () => {
      console.log('🔕 取消订阅:', selectedGameSession)
      starRecordsChannel.unsubscribe()
      changeLogsChannel.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGameSession])

  // 计算某个队伍在某个点位的收益倍数
  function getIncomeMultiplier(teamId: string, locationId: string): number {
    let multiplier = 1.0
    const now = new Date()

    activeEffects.forEach(effect => {
      const effectEndTime = new Date(effect.end_time)
      if (effectEndTime <= now) return // 效果已过期
      if (!effect.effect_value) return // 没有倍数值

      // 效率诅咒：针对特定队伍
      if (effect.effect_type === 'efficiency_curse' && effect.team_id === teamId) {
        multiplier *= effect.effect_value
      }

      // 士气高涨：针对特定队伍
      if (effect.effect_type === 'morale_boost' && effect.team_id === teamId) {
        multiplier *= effect.effect_value
      }

      // 幸运聚焦：针对特定队伍+特定点位
      if (effect.effect_type === 'lucky_focus' &&
          effect.team_id === teamId &&
          effect.target_location_id === locationId) {
        multiplier *= effect.effect_value
      }

      // 突发事件-收益波动（点位）
      if ((effect.effect_type === 'income_increase' || effect.effect_type === 'income_decrease') &&
          effect.target_location_id === locationId) {
        multiplier *= effect.effect_value
      }

      // 突发事件-黄金时间/低谷时间（全局）
      if (effect.effect_type === 'golden_time' || effect.effect_type === 'low_time') {
        multiplier *= effect.effect_value
      }
    })

    return multiplier
  }

  async function updateStars(teamId: string, locationId: string, change: number) {
    const cellKey = `${teamId}-${locationId}`

    // 播放音效
    if (change > 0) {
      playIncreaseSound()
    } else if (change < 0) {
      playDecreaseSound()
    }

    // 计算收益倍数
    const multiplier = getIncomeMultiplier(teamId, locationId)
    const actualChange = change * multiplier

    console.log(`⭐ 前端预计算 - 倍数: ${multiplier}x, 原始变化: ${change}, 实际变化: ${actualChange}`)

    // 立即更新前端显示（乐观更新），使用带倍率的变化量
    setScoreData(prevData => {
      return prevData.map(teamData => {
        if (teamData.team.id === teamId) {
          const updatedRecords = { ...teamData.records }
          if (updatedRecords[locationId]) {
            const currentStars = updatedRecords[locationId].stars
            updatedRecords[locationId] = {
              ...updatedRecords[locationId],
              stars: Math.max(0, currentStars + actualChange) // 立即显示带倍率的变化
            }
          }
          return {
            ...teamData,
            records: updatedRecords
          }
        }
        return teamData
      })
    })

    // 如果该单元格正在更新，则将变化累加到待处理队列
    if (updatingCells.has(cellKey)) {
      console.log('⏸️ 该单元格正在更新中，累加到待处理队列:', change)
      setPendingChanges(prev => ({
        ...prev,
        [cellKey]: (prev[cellKey] || 0) + change
      }))
      return
    }

    console.log('🔄 开始更新星星数:', { teamId, locationId, change })

    // 标记该单元格为更新中
    setUpdatingCells(prev => new Set(prev).add(cellKey))

    try {
      // 检查记录是否存在
      const currentData = scoreData.find(d => d.team.id === teamId)
      const currentRecord = currentData?.records[locationId]

      if (!currentRecord) {
        console.error('❌ 未找到记录')
        return
      }

      // 不在前端计算新值，直接发送变化量给后端
      const requestBody = {
        team_id: teamId,
        location_id: locationId,
        change: change, // 只发送变化量 (+1 或 -1)
        admin_id: admin?.id
      }
      console.log('📤 发送请求:', requestBody)

      const response = await fetch('/api/admin/update-stars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      console.log('📥 响应状态:', response.status)
      const data = await response.json()
      console.log('📥 响应数据:', data)

      if (data.success) {
        // 使用后端返回的真实值更新UI（应该和前端预计算的值一致）
        if (data.record) {
          setScoreData(prevData => {
            return prevData.map(teamData => {
              if (teamData.team.id === teamId) {
                const updatedRecords = { ...teamData.records }
                if (updatedRecords[locationId]) {
                  updatedRecords[locationId] = {
                    ...updatedRecords[locationId],
                    stars: data.record.stars, // 用后端真实值覆盖
                    points: data.record.points
                  }
                }
                return {
                  ...teamData,
                  records: updatedRecords
                }
              }
              return teamData
            })
          })
        }

        // 延迟刷新以获取同盟更新和最新积分（1秒后静默刷新）
        setTimeout(() => {
          console.log('🔄 延迟刷新获取完整数据（同盟+积分）')
          if (selectedGameSession) {
            loadData(selectedGameSession, false)
          } else if (admin?.game_session_id) {
            loadData(admin.game_session_id, false)
          }
        }, 1000)
      } else {
        console.error('❌ 更新失败:', data.message)
        // 刷新数据以恢复正确的值
        if (selectedGameSession) {
          loadData(selectedGameSession, false)
        } else if (admin?.game_session_id) {
          loadData(admin.game_session_id, false)
        }
      }
    } catch (error) {
      console.error('❌ 捕获错误:', error)
      // 发生错误，刷新以恢复正确的值
      if (selectedGameSession) {
        loadData(selectedGameSession, false)
      } else if (admin?.game_session_id) {
        loadData(admin.game_session_id, false)
      }
    } finally {
      // 移除更新锁
      setUpdatingCells(prev => {
        const newSet = new Set(prev)
        newSet.delete(cellKey)
        return newSet
      })
      console.log('✅ 更新完成，释放锁')

      // 检查是否有待处理的累加变化
      setPendingChanges(prev => {
        const pendingChange = prev[cellKey]
        if (pendingChange && pendingChange !== 0) {
          console.log(`🔄 处理待处理的累加变化: ${pendingChange}`)
          // 移除已处理的累加
          const { [cellKey]: _, ...rest } = prev

          // 异步执行下一次更新
          setTimeout(() => {
            updateStars(teamId, locationId, pendingChange)
          }, 0)

          return rest
        }
        return prev
      })
    }
  }

  // 检查是否可以编辑某个单元格
  function canEdit(locationId: string): boolean {
    if (!admin) return false

    // 初级管理员只能编辑分配给他们的点位
    if (admin.role === 'junior') {
      return admin.assigned_location_id === locationId
    }

    // 中级和高级管理员可以编辑所有单元格
    return true
  }

  if (!admin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-royal-purple border-t-transparent"></div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-royal-purple via-purple-400 to-royal-gold p-8">
      <div className="max-w-7xl mx-auto">
        <div className="elegant-card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-royal-purple">
              ⭐ 修改星星数
            </h1>
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="btn-secondary"
            >
              ← 返回仪表板
            </button>
          </div>
          <p className="text-gray-600">
            {admin.role === 'junior'
              ? '您只能修改分配给您的点位的星星数'
              : '您可以修改任意队伍在任意点位的星星数'}
          </p>
        </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded-lg border-2 ${
            message.type === 'success'
              ? 'bg-green-50 border-green-500 text-green-700'
              : 'bg-red-50 border-red-500 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        {/* 游戏场选择器 - 只对中级和高级管理员显示 */}
        {admin.role !== 'junior' && (
          <div className="elegant-card mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              选择游戏场
            </label>
            <select
              value={selectedGameSession}
              onChange={(e) => setSelectedGameSession(e.target.value)}
              className="w-full px-4 py-3 border-2 border-royal-gold rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-purple"
            >
              {gameSessions.map(session => (
                <option key={session.id} value={session.id}>
                  {session.name}
                </option>
              ))}
            </select>
            {gameSessions.length === 0 && (
              <p className="text-sm text-red-600 mt-2">
                没有在线的游戏场。请先在游戏场管理中创建并上线游戏场。
              </p>
            )}
          </div>
        )}

        {/* 积分榜样式的表格 */}
        {loading ? (
          <div className="elegant-card flex justify-center items-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-royal-gold border-t-transparent"></div>
          </div>
        ) : scoreData.length === 0 ? (
          <div className="elegant-card text-center py-12">
            <p className="text-gray-600 text-xl mb-4">
              该游戏场还没有队伍或点位
            </p>
            <p className="text-gray-500">
              请先在游戏场管理中添加队伍和点位
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse elegant-card">
              <thead>
                <tr className="bg-royal-purple text-white">
                  <th className="p-3 text-left font-semibold border-2 border-royal-gold">
                    组别
                  </th>
                  {locations.map(location => (
                    <th
                      key={location.id}
                      className="p-3 text-center font-semibold border-2 border-royal-gold"
                    >
                      {location.name}
                      {admin.role === 'junior' && admin.assigned_location_id === location.id && (
                        <div className="text-xs mt-1 text-yellow-300">您的点位</div>
                      )}
                    </th>
                  ))}
                  <th className="p-3 text-center font-semibold border-2 border-royal-gold">
                    总积分
                  </th>
                </tr>
              </thead>
              <tbody>
                {scoreData.map(({ team, records, totalPoints }) => (
                  <tr
                    key={team.id}
                    className="transition-colors"
                  >
                    <td className="p-3 border-2 border-gray-300">
                      <span
                        className="font-semibold px-3 py-1 rounded text-white inline-block"
                        style={{ backgroundColor: team.color }}
                      >
                        {team.name}
                      </span>
                    </td>
                    {locations.map(location => {
                      const record = records[location.id]
                      const editable = canEdit(location.id)
                      const cellKey = `${team.id}-${location.id}`
                      const isUpdating = updatingCells.has(cellKey)

                      return (
                        <td
                          key={location.id}
                          className="p-3 text-center border-2 border-gray-300"
                        >
                          {record ? (
                            <div className="flex items-center justify-center gap-2">
                              {/* 减号按钮 */}
                              <button
                                onClick={() => updateStars(team.id, location.id, -1)}
                                disabled={!editable}
                                className={`w-8 h-8 rounded-full font-bold text-lg transition-all ${
                                  editable && !isUpdating
                                    ? 'bg-red-500 hover:bg-red-600 text-white hover:scale-110 active:scale-95'
                                    : editable && isUpdating
                                    ? 'bg-red-400 text-white cursor-pointer'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                                title={!editable ? '无权限编辑' : isUpdating ? '处理中，可继续点击' : '减少1颗星'}
                              >
                                −
                              </button>

                              {/* 星星数和积分显示 */}
                              <div className="flex flex-col items-center min-w-[80px]">
                                <span className="flex items-center gap-1">
                                  <span>⭐</span>
                                  <span className="font-bold text-lg">{record.stars}</span>
                                </span>
                                <span className="flex items-center gap-1 text-sm">
                                  <span>👑</span>
                                  <span className="font-semibold">{record.points}</span>
                                </span>
                              </div>

                              {/* 加号按钮 */}
                              <button
                                onClick={() => updateStars(team.id, location.id, 1)}
                                disabled={!editable}
                                className={`w-8 h-8 rounded-full font-bold text-lg transition-all ${
                                  editable && !isUpdating
                                    ? 'bg-green-500 hover:bg-green-600 text-white hover:scale-110 active:scale-95'
                                    : editable && isUpdating
                                    ? 'bg-green-400 text-white cursor-pointer'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                                title={!editable ? '无权限编辑' : isUpdating ? '处理中，可继续点击' : '增加1颗星'}
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <div className="text-gray-400">⭐0 👑0</div>
                          )}
                        </td>
                      )
                    })}
                    <td className="p-3 text-center font-bold text-xl border-2 border-gray-300">
                      {totalPoints}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 提示信息 */}
        <div className="elegant-card mt-6">
          <div className="bg-blue-50 border-2 border-blue-500 p-4 rounded-lg">
            <h3 className="font-bold text-blue-900 mb-2">💡 使用提示</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 点击 <span className="inline-block w-6 h-6 bg-green-500 text-white rounded-full text-center leading-6 mx-1">+</span> 增加1颗星星</li>
              <li>• 点击 <span className="inline-block w-6 h-6 bg-red-500 text-white rounded-full text-center leading-6 mx-1">−</span> 减少1颗星星</li>
              <li>• <span className="font-semibold">支持快速连续点击</span>：可以快速点击多次，系统会自动累加并按顺序处理</li>
              <li>• 表格数据实时同步，其他管理员和玩家端会立即看到更新</li>
              {admin.role === 'junior' && (
                <li>• 您只能编辑分配给您的点位（标记为"您的点位"）</li>
              )}
              {admin.role !== 'junior' && (
                <li>• 您可以编辑所有单元格</li>
              )}
            </ul>
          </div>
        </div>

        {/* 修改日志 */}
        <div className="elegant-card mt-6">
          <h2 className="text-2xl font-bold text-royal-purple mb-4 flex items-center gap-2">
            <span>📝</span>
            修改日志
            {admin && admin.role === 'junior' && (
              <span className="text-sm font-normal text-gray-600">(仅显示您的操作)</span>
            )}
          </h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {changeLogs.length === 0 ? (
              <div className="text-gray-400 text-center py-8">
                暂无修改记录
              </div>
            ) : (
              changeLogs.map(log => {
                const team = teams.find(t => t.id === log.team_id)
                const location = locations.find(l => l.id === log.location_id)
                const adminName = adminsMap[log.admin_id] || '未知管理员'

                // 生成变化文本，显示倍率计算过程
                let changeText = ''
                if (log.base_change !== undefined && log.base_change !== null) {
                  // 有原始变化量，显示倍率计算
                  const baseChange = Math.abs(log.base_change)
                  if (log.multipliers && log.multipliers.length > 0) {
                    // 有倍率，显示为：1×0.2 或 1×0.5×1.5
                    const multipliersText = log.multipliers.map(m => m.toString()).join('×')
                    changeText = log.change_amount > 0
                      ? `增加了${baseChange}×${multipliersText}颗星星`
                      : `减少了${baseChange}×${multipliersText}颗星星`
                  } else {
                    // 无倍率，显示为：1
                    changeText = log.change_amount > 0
                      ? `增加了${baseChange}颗星星`
                      : `减少了${baseChange}颗星星`
                  }
                } else {
                  // 旧格式日志，直接显示change_amount
                  changeText = log.change_amount > 0
                    ? `增加了${log.change_amount}颗星星`
                    : `减少了${Math.abs(log.change_amount)}颗星星`
                }

                const timeStr = new Date(log.created_at).toLocaleString('zh-CN', {
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })

                return (
                  <div
                    key={log.id}
                    className="p-3 rounded-lg border-2 border-gray-200 bg-gray-50"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex-1 text-sm">
                        <span className="font-semibold text-blue-600">{adminName}</span>
                        {' '}在{' '}
                        <span className="font-semibold">{location?.name || '未知点位'}</span>
                        {' '}为队伍{' '}
                        {team && (
                          <span
                            className="font-semibold px-2 py-0.5 rounded text-white"
                            style={{ backgroundColor: team.color }}
                          >
                            {team.name}
                          </span>
                        )}
                        {!team && <span className="font-semibold">未知队伍</span>}
                        {' '}
                        <span className={log.change_amount > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                          {changeText}
                        </span>
                        {' '}
                        <span className="text-gray-500">
                          ({log.old_stars} → {log.new_stars})
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {timeStr}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
