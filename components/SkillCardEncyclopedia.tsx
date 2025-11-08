'use client'

import { useState } from 'react'
import { SKILL_CARD_CONFIG, SkillCardType } from '@/types/game'

export default function SkillCardEncyclopedia() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const categories = {
    all: '全部',
    debuff: '负面效果',
    buff: '增益效果',
    instant: '即时效果',
    special: '特殊效果'
  }

  const cards = Object.values(SKILL_CARD_CONFIG)
  const filteredCards = selectedCategory === 'all'
    ? cards
    : cards.filter(card => card.category === selectedCategory)

  function getCategoryIcon(category: string): string {
    switch (category) {
      case 'debuff': return '💀'
      case 'buff': return '💪'
      case 'instant': return '⚡'
      case 'special': return '🎯'
      default: return '📋'
    }
  }

  function getCategoryColor(category: string): string {
    switch (category) {
      case 'debuff': return 'from-red-500 to-red-700'
      case 'buff': return 'from-green-500 to-green-700'
      case 'instant': return 'from-blue-500 to-blue-700'
      case 'special': return 'from-purple-500 to-purple-700'
      default: return 'from-gray-500 to-gray-700'
    }
  }

  return (
    <div className="elegant-card">
      <h2 className="text-3xl font-bold text-royal-purple mb-6 flex items-center gap-2">
        <span>📚</span>
        技能卡图鉴
      </h2>

      {/* 分类筛选 */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.entries(categories).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSelectedCategory(key)}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              selectedCategory === key
                ? 'bg-royal-purple text-white shadow-lg scale-105'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 技能卡列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCards.map(card => (
          <div
            key={card.type}
            className="border-2 border-royal-gold rounded-lg p-4 bg-gradient-to-br from-white to-elegant-cream hover:shadow-xl transition-all"
          >
            <div className={`bg-gradient-to-r ${getCategoryColor(card.category)} text-white px-3 py-1 rounded-md text-sm font-semibold inline-flex items-center gap-1 mb-3`}>
              {getCategoryIcon(card.category)}
              {categories[card.category as keyof typeof categories]}
            </div>

            <h3 className="text-xl font-bold text-royal-purple mb-2">
              {card.name}
            </h3>

            <p className="text-gray-700 mb-3 text-sm leading-relaxed">
              {card.description}
            </p>

            <div className="space-y-1 text-sm">
              {card.duration && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-royal-purple">⏱️ 持续时间:</span>
                  <span>{card.duration}分钟</span>
                </div>
              )}
              {card.effectValue && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-royal-purple">📊 效果数值:</span>
                  <span>×{card.effectValue}</span>
                </div>
              )}
              {card.needsTarget && (
                <div className="flex items-center gap-2 text-royal-red">
                  🎯 需要选择目标队伍
                </div>
              )}
              {card.needsLocation && (
                <div className="flex items-center gap-2 text-royal-red">
                  📍 需要选择目标点位
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredCards.length === 0 && (
        <div className="text-center text-gray-400 py-12">
          该分类下暂无技能卡
        </div>
      )}
    </div>
  )
}
