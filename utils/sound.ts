// 使用 Web Audio API 创建音效

let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  return audioContext
}

// 播放增加星星的音效（上升音调）
export function playIncreaseSound() {
  try {
    const ctx = getAudioContext()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    // 设置音效参数
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(400, ctx.currentTime) // 起始频率
    oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1) // 上升到更高频率

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.15)
  } catch (error) {
    console.error('播放音效失败:', error)
  }
}

// 播放减少星星的音效（下降音调）
export function playDecreaseSound() {
  try {
    const ctx = getAudioContext()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    // 设置音效参数
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(600, ctx.currentTime) // 起始频率
    oscillator.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1) // 下降到更低频率

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.15)
  } catch (error) {
    console.error('播放音效失败:', error)
  }
}
