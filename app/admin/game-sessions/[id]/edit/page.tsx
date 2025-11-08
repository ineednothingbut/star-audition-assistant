'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

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

export default function EditGameSessionPage({ params }: { params: { id: string } }) {
  const [gameName, setGameName] = useState('')
  const [teams, setTeams] = useState<Team[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [newTeamName, setNewTeamName] = useState('')
  const [newTeamColor, setNewTeamColor] = useState('#FF6B6B')
  const [newLocationName, setNewLocationName] = useState('')
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null)
  const [editTeamName, setEditTeamName] = useState('')
  const [editTeamColor, setEditTeamColor] = useState('')
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null)
  const [editLocationName, setEditLocationName] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [params.id])

  async function loadData() {
    const { data: sessionData } = await supabase
      .from('game_sessions')
      .select('name')
      .eq('id', params.id)
      .single()

    const { data: teamsData } = await supabase
      .from('teams')
      .select('*')
      .eq('game_session_id', params.id)
      .order('display_order')

    const { data: locationsData } = await supabase
      .from('locations')
      .select('*')
      .eq('game_session_id', params.id)
      .order('display_order')

    if (sessionData) setGameName(sessionData.name)
    if (teamsData) setTeams(teamsData)
    if (locationsData) setLocations(locationsData)
  }

  async function addTeam() {
    if (!newTeamName.trim()) {
      setMessage({ type: 'error', text: '请输入队伍名称' })
      return
    }

    try {
      const { data, error } = await supabase
        .from('teams')
        .insert({
          game_session_id: params.id,
          name: newTeamName,
          color: newTeamColor,
          display_order: teams.length + 1
        })
        .select()
        .single()

      if (error) throw error

      // 为新队伍在所有点位创建星星记录
      if (locations.length > 0) {
        const records = locations.map(loc => ({
          game_session_id: params.id,
          team_id: data.id,
          location_id: loc.id,
          stars: 0,
          points: 0
        }))

        await supabase.from('star_records').insert(records)
      }

      // 更新游戏场的队伍数量
      await supabase
        .from('game_sessions')
        .update({ team_count: teams.length + 1 })
        .eq('id', params.id)

      setMessage({ type: 'success', text: '队伍添加成功！' })
      setNewTeamName('')
      loadData()
    } catch (error) {
      setMessage({ type: 'error', text: '添加失败' })
    }
  }

  async function deleteTeam(teamId: string, teamName: string) {
    if (!confirm(`确定要删除队伍"${teamName}"吗？`)) return

    try {
      await supabase.from('teams').delete().eq('id', teamId)

      await supabase
        .from('game_sessions')
        .update({ team_count: teams.length - 1 })
        .eq('id', params.id)

      setMessage({ type: 'success', text: '队伍已删除' })
      loadData()
    } catch (error) {
      setMessage({ type: 'error', text: '删除失败' })
    }
  }

  async function addLocation() {
    if (!newLocationName.trim()) {
      setMessage({ type: 'error', text: '请输入点位名称' })
      return
    }

    try {
      const { data, error } = await supabase
        .from('locations')
        .insert({
          game_session_id: params.id,
          name: newLocationName,
          display_order: locations.length + 1
        })
        .select()
        .single()

      if (error) throw error

      // 为所有队伍在新点位创建星星记录
      if (teams.length > 0) {
        const records = teams.map(team => ({
          game_session_id: params.id,
          team_id: team.id,
          location_id: data.id,
          stars: 0,
          points: 0
        }))

        await supabase.from('star_records').insert(records)
      }

      // 更新游戏场的点位数量
      await supabase
        .from('game_sessions')
        .update({ location_count: locations.length + 1 })
        .eq('id', params.id)

      setMessage({ type: 'success', text: '点位添加成功！' })
      setNewLocationName('')
      loadData()
    } catch (error) {
      setMessage({ type: 'error', text: '添加失败' })
    }
  }

  async function deleteLocation(locationId: string, locationName: string) {
    if (!confirm(`确定要删除点位"${locationName}"吗？`)) return

    try {
      await supabase.from('locations').delete().eq('id', locationId)

      await supabase
        .from('game_sessions')
        .update({ location_count: locations.length - 1 })
        .eq('id', params.id)

      setMessage({ type: 'success', text: '点位已删除' })
      loadData()
    } catch (error) {
      setMessage({ type: 'error', text: '删除失败' })
    }
  }

  async function updateTeam(teamId: string) {
    if (!editTeamName.trim()) {
      setMessage({ type: 'error', text: '请输入队伍名称' })
      return
    }

    try {
      const { error } = await supabase
        .from('teams')
        .update({
          name: editTeamName,
          color: editTeamColor
        })
        .eq('id', teamId)

      if (error) throw error

      setMessage({ type: 'success', text: '队伍已更新' })
      setEditingTeamId(null)
      loadData()
    } catch (error) {
      setMessage({ type: 'error', text: '更新失败' })
    }
  }

  async function updateLocation(locationId: string) {
    if (!editLocationName.trim()) {
      setMessage({ type: 'error', text: '请输入点位名称' })
      return
    }

    try {
      const { error } = await supabase
        .from('locations')
        .update({ name: editLocationName })
        .eq('id', locationId)

      if (error) throw error

      setMessage({ type: 'success', text: '点位已更新' })
      setEditingLocationId(null)
      loadData()
    } catch (error) {
      setMessage({ type: 'error', text: '更新失败' })
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-royal-purple via-purple-400 to-royal-gold p-8">
      <div className="max-w-7xl mx-auto">
        <div className="elegant-card mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-royal-purple mb-2">
                编辑游戏场: {gameName}
              </h1>
              <p className="text-gray-600">
                管理队伍和点位设置
              </p>
            </div>
            <button
              onClick={() => router.push('/admin/game-sessions')}
              className="btn-secondary"
            >
              ← 返回列表
            </button>
          </div>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 队伍管理 */}
          <div className="elegant-card">
            <h2 className="text-2xl font-bold text-royal-purple mb-4">
              👥 队伍管理 ({teams.length})
            </h2>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-3">添加新队伍</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-royal-gold rounded-lg"
                  placeholder="队伍名称"
                />
                <div>
                  <label className="block text-sm font-semibold mb-2">队伍颜色（16进制）</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={newTeamColor}
                      onChange={(e) => setNewTeamColor(e.target.value)}
                      className="flex-1 px-4 py-2 border-2 border-royal-gold rounded-lg font-mono"
                      placeholder="#FF6B6B"
                      maxLength={7}
                    />
                    <div
                      className="w-12 h-12 rounded-lg border-2 border-gray-300"
                      style={{ backgroundColor: newTeamColor }}
                      title="颜色预览"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    例如: #FF6B6B (红色), #4ECDC4 (青色), #45B7D1 (蓝色)
                  </p>
                </div>
                <button
                  onClick={addTeam}
                  className="w-full btn-primary py-2"
                >
                  + 添加队伍
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {teams.map(team => (
                <div
                  key={team.id}
                  className="p-3 rounded-lg border-2 border-gray-200"
                >
                  {editingTeamId === team.id ? (
                    // 编辑模式
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editTeamName}
                        onChange={(e) => setEditTeamName(e.target.value)}
                        className="w-full px-4 py-2 border-2 border-royal-gold rounded-lg"
                        placeholder="队伍名称"
                      />
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={editTeamColor}
                          onChange={(e) => setEditTeamColor(e.target.value)}
                          className="flex-1 px-4 py-2 border-2 border-royal-gold rounded-lg font-mono"
                          placeholder="#FF6B6B"
                          maxLength={7}
                        />
                        <div
                          className="w-12 h-12 rounded-lg border-2 border-gray-300"
                          style={{ backgroundColor: editTeamColor }}
                          title="颜色预览"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateTeam(team.id)}
                          className="btn-primary px-4 py-2 text-sm"
                        >
                          保存
                        </button>
                        <button
                          onClick={() => setEditingTeamId(null)}
                          className="btn-secondary px-4 py-2 text-sm"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    // 显示模式
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className="font-semibold px-3 py-1 rounded"
                          style={{ backgroundColor: team.color, color: '#fff' }}
                        >
                          {team.name}
                        </span>
                        <span className="text-sm text-gray-500 font-mono">{team.color}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingTeamId(team.id)
                            setEditTeamName(team.name)
                            setEditTeamColor(team.color)
                          }}
                          className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => deleteTeam(team.id, team.name)}
                          className="btn-danger px-3 py-1 text-sm"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {teams.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  还没有队伍
                </div>
              )}
            </div>
          </div>

          {/* 点位管理 */}
          <div className="elegant-card">
            <h2 className="text-2xl font-bold text-royal-purple mb-4">
              📍 点位管理 ({locations.length})
            </h2>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-3">添加新点位</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-royal-gold rounded-lg"
                  placeholder="点位名称"
                />
                <button
                  onClick={addLocation}
                  className="w-full btn-primary py-2"
                >
                  + 添加点位
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {locations.map(location => (
                <div
                  key={location.id}
                  className="p-3 rounded-lg bg-white border-2 border-royal-gold"
                >
                  {editingLocationId === location.id ? (
                    // 编辑模式
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editLocationName}
                        onChange={(e) => setEditLocationName(e.target.value)}
                        className="w-full px-4 py-2 border-2 border-royal-gold rounded-lg"
                        placeholder="点位名称"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateLocation(location.id)}
                          className="btn-primary px-4 py-2 text-sm"
                        >
                          保存
                        </button>
                        <button
                          onClick={() => setEditingLocationId(null)}
                          className="btn-secondary px-4 py-2 text-sm"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    // 显示模式
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{location.name}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingLocationId(location.id)
                            setEditLocationName(location.name)
                          }}
                          className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => deleteLocation(location.id, location.name)}
                          className="btn-danger px-3 py-1 text-sm"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {locations.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  还没有点位
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="elegant-card mt-6">
          <div className="bg-blue-50 border-2 border-blue-500 p-4 rounded-lg">
            <h3 className="font-bold text-blue-900 mb-2">💡 提示</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 添加队伍或点位后,系统会自动为所有组合创建星星记录</li>
              <li>• 删除队伍或点位会同时删除相关的所有星星记录</li>
              <li>• 建议在上线游戏场之前完成所有队伍和点位的设置</li>
              <li>• 当前配置: {teams.length}支队伍 × {locations.length}个点位 = {teams.length * locations.length}条记录</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  )
}
