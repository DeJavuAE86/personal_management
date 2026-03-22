<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-3xl font-bold text-gray-800">兑换大厅</h1>
    </div>
    
    <!-- 奖励网格 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      <div 
        v-for="reward in REWARD_LIST" 
        :key="reward.id"
        class="bg-white rounded-2xl shadow-md overflow-hidden transition-all hover:shadow-xl"
        :class="{
          'opacity-60': isLocked(reward.category)
        }"
      >
        <!-- 奖励卡片内容 -->
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-800">{{ reward.name }}</h3>
            <div class="flex items-center gap-2">
              <div v-if="isSpecialPrice(reward)" class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium font-bold">
                💰 {{ getActualCost(reward) }}
              </div>
              <div v-else class="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                💰 {{ getActualCost(reward) }}
              </div>
              <div v-if="isSpecialPrice(reward)" class="text-gray-400 text-xs line-through">
                {{ reward.cost }}
              </div>
            </div>
          </div>
          
          <div class="text-center mb-6">
            <div class="text-4xl mb-2">
              <component :is="getRewardIcon(reward.icon)" v-if="getRewardIcon(reward.icon)" class="inline-block" />
              <span v-else>{{ getIconForCategory(reward.category) }}</span>
            </div>
            <p class="text-gray-600 text-sm mb-2">
              {{ getCategoryDescription(reward.category) }}
            </p>
            <p class="text-gray-500 text-xs">
              {{ reward.description }}
            </p>
          </div>
          
          <!-- 锁定状态 -->
          <div v-if="isLocked(reward.category)" class="relative">
            <div class="absolute inset-0 bg-gray-100/80 backdrop-blur-sm flex items-center justify-center rounded-xl">
              <div class="text-center">
                <div class="text-4xl mb-2">🔒</div>
                <p class="text-gray-600">周六复盘后解锁</p>
              </div>
            </div>
            <button 
              class="w-full py-3 bg-gray-300 text-gray-600 rounded-xl font-medium disabled:cursor-not-allowed"
              disabled
            >
              周六复盘后解锁
            </button>
          </div>
          
          <!-- 正常状态 -->
          <button 
            v-else
            class="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
            @click="handleRedeem(reward)"
          >
            立即兑换
          </button>
        </div>
      </div>
    </div>
    
    <!-- 兑换成功提示 -->
    <div v-if="showSuccessToast" class="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
      兑换成功！获得 {{ redeemedRewardName }} 🌟
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useSystemStore } from '../store'
import { REWARD_LIST } from '../config/rewards'
import { Headphones, Music, Video, MessageCircle, MonitorPlay, Film, Compass, Users, Gamepad2, Sparkles, Plane } from 'lucide-vue-next'

const systemStore = useSystemStore()

// 状态
const showSuccessToast = ref(false)
const redeemedRewardName = ref('')

// 检查奖励是否锁定
const isLocked = (category: string): boolean => {
  if (category === 'B' || category === 'C') {
    // 测试模式下自动解锁
    if (systemStore.mockDay !== 'REAL') {
      return false
    }
    // 真实模式下需要满足条件
    return !systemStore.isWeekendUnlocked || !(systemStore.currentSystemDay === 6 || systemStore.currentSystemDay === 0)
  }
  return false
}

// 获取实际成本（动态定价）
const getActualCost = (reward: any): number => {
  if (reward.id === 'b1' && systemStore.currentSystemDay === 0) {
    return 8
  }
  return reward.cost
}

// 检查是否为特价
const isSpecialPrice = (reward: any): boolean => {
  return reward.id === 'b1' && systemStore.currentSystemDay === 0
}

// 获取奖励图标
const getRewardIcon = (iconName: string | undefined) => {
  if (!iconName) return null
  const iconMap: Record<string, any> = {
    'headphones': Headphones,
    'music': Music,
    'video': Video,
    'message-circle': MessageCircle,
    'monitor-play': MonitorPlay,
    'film': Film,
    'compass': Compass,
    'users': Users,
    'gamepad-2': Gamepad2,
    'sparkles': Sparkles,
    'plane': Plane
  }
  return iconMap[iconName] || null
}

// 获取分类图标（作为默认图标）
const getIconForCategory = (category: string): string => {
  const iconMap: Record<string, string> = {
    'A': '⭐',
    'B': '🎁',
    'C': '🏆',
    'D': '👑'
  }
  return iconMap[category] || '🎯'
}

// 获取分类描述
const getCategoryDescription = (category: string): string => {
  const descMap: Record<string, string> = {
    'A': '日常燃料',
    'B': '周末盛典',
    'C': '盛典奖励',
    'D': '终极成就'
  }
  return descMap[category] || '未知分类'
}

// 处理兑换
const handleRedeem = (reward: any) => {
  // 检查是否为A类奖励且在核心学习时段
  if (reward.category === 'A') {
    const currentHour = new Date().getHours()
    if (currentHour >= 8 && currentHour <= 17) {
      const confirmed = window.confirm('🚨 当前为核心专注时段，强烈建议晚间兑换！执意兑换？')
      if (!confirmed) return
    }
  }
  
  // 检查是否为D类奖励，需要密码确认
  if (reward.category === 'D') {
    const password = window.prompt('请输入确认密码[CONFIRM] 以兑换终极大奖')
    if (password !== 'CONFIRM') {
      alert('密码错误，兑换失败！')
      return
    }
  }
  
  // 计算实际成本
  const actualCost = getActualCost(reward)
  
  // 检查积分是否足够
  if (systemStore.totalScore < actualCost) {
    alert('积分不足，兑换失败！')
    return
  }
  
  // 调用store兑换奖励
  const success = systemStore.redeemReward(actualCost)
  if (success) {
    // 显示成功提示
    redeemedRewardName.value = reward.name
    showSuccessToast.value = true
    
    // 3秒后隐藏提示
    setTimeout(() => {
      showSuccessToast.value = false
    }, 3000)
  }
}


</script>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}
</style>
