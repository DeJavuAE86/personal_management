import type { Reward } from '@/types'

export const REWARD_LIST: Reward[] = [
  { id: 'a1', name: '电台陪伴券', category: 'A', cost: 3, icon: 'headphones', description: '一次突击电台/杂谈回放(30-45分)' },
  { id: 'a2', name: '心流燃料', category: 'A', cost: 3, icon: 'music', description: '吉他随意弹弹15分钟' },
  { id: 'a3', name: '切片时光', category: 'A', cost: 6, icon: 'video', description: '精选A-soul切片，总时长≤30分钟' },
  { id: 'a4', name: '社区特权券', category: 'A', cost: 8, icon: 'message-circle', description: '25分钟高质量社区漫游或互动' },
  { id: 'a5', name: '单播时光', category: 'A', cost: 12, icon: 'monitor-play', description: '完整沉浸观看一场1小时单播' },
  { id: 'a6', name: '影视同好会', category: 'A', cost: 14, icon: 'film', description: '用1.5小时观看感兴趣的影视/动画' },
  { id: 'b1', name: '兴趣探索夜', category: 'B', cost: 15, icon: 'compass', description: '2小时专注学吉他或做编程项目' },
  { id: 'c1', name: '团播庆典夜', category: 'C', cost: 30, icon: 'users', description: '沉浸享受一场约2小时的完整团播' },
  { id: 'c2', name: '游戏实况集', category: 'C', cost: 35, icon: 'gamepad-2', description: '观看3-4小时的游戏实况' },
  { id: 'c3', name: '活动直播盛典', category: 'C', cost: 40, icon: 'sparkles', description: '沉浸观看一场约3小时的大型活动' },
  { id: 'd1', name: '终极体验解锁', category: 'D', cost: 80, icon: 'plane', description: '兑换线下演出、旅行或心仪设备' }
]
