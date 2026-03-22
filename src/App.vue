<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col md:flex-row">
    <!-- 左侧侧边栏 -->
    <aside class="w-72 bg-white shadow-lg border-r border-slate-200 flex flex-col hidden md:flex">
      <!-- 顶部 Logo 和名称 -->
      <div class="p-6 border-b border-slate-100">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
            <span class="text-white font-bold text-xl">N</span>
          </div>
          <div>
            <h1 class="text-xl font-bold text-gray-900">Nova System</h1>
            <p class="text-sm text-gray-500 mt-1">{{ getGreeting() }}</p>
          </div>
        </div>
      </div>
      
      <!-- 中部导航菜单 -->
      <nav class="flex-1 p-4 space-y-2">
        <router-link 
          to="/" 
          class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all group"
          :class="{
            'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600': $route.path === '/',
            'text-gray-700 hover:bg-slate-50': $route.path !== '/'
          }"
        >
          <Clock class="w-5 h-5" :class="{ 'text-blue-600': $route.path === '/' }" />
          <span class="font-medium">今日打卡</span>
          <div v-if="$route.path === '/'" class="ml-auto w-1 h-8 bg-blue-600 rounded-full"></div>
        </router-link>
        <router-link 
          to="/rewards" 
          class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all group"
          :class="{
            'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600': $route.path === '/rewards',
            'text-gray-700 hover:bg-slate-50': $route.path !== '/rewards'
          }"
        >
          <Gift class="w-5 h-5" :class="{ 'text-blue-600': $route.path === '/rewards' }" />
          <span class="font-medium">兑换大厅</span>
          <div v-if="$route.path === '/rewards'" class="ml-auto w-1 h-8 bg-blue-600 rounded-full"></div>
        </router-link>
        <router-link 
          to="/plan" 
          class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all group"
          :class="{
            'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600': $route.path === '/plan',
            'text-gray-700 hover:bg-slate-50': $route.path !== '/plan'
          }"
        >
          <Calendar class="w-5 h-5" :class="{ 'text-blue-600': $route.path === '/plan' }" />
          <span class="font-medium">周末规划</span>
          <div v-if="$route.path === '/plan'" class="ml-auto w-1 h-8 bg-blue-600 rounded-full"></div>
        </router-link>
      </nav>
      
      <!-- 底部作息时间轴看板 -->
      <div class="p-4 border-t border-slate-100">
        <h3 class="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Clock class="w-4 h-4 text-blue-600" />
          今日作息
        </h3>
        <div class="space-y-3">
          <div 
            class="flex items-center gap-3 p-2 rounded-lg transition-all"
            :class="{
              'bg-blue-50 border-l-2 border-blue-400': isCurrentTimeSlot('07:00'),
              'hover:bg-slate-50': !isCurrentTimeSlot('07:00')
            }"
          >
            <div class="w-2 h-2 rounded-full bg-green-400" :class="{ 'animate-pulse': isCurrentTimeSlot('07:00') }"></div>
            <div class="text-sm font-medium text-gray-900">07:00</div>
            <div class="flex-1 text-sm text-gray-600">早起锚点</div>
          </div>
          <div 
            class="flex items-center gap-3 p-2 rounded-lg transition-all"
            :class="{
              'bg-blue-50 border-l-2 border-blue-400': isCurrentTimeSlot('08:30'),
              'hover:bg-slate-50': !isCurrentTimeSlot('08:30')
            }"
          >
            <div class="w-2 h-2 rounded-full bg-blue-400" :class="{ 'animate-pulse': isCurrentTimeSlot('08:30') }"></div>
            <div class="text-sm font-medium text-gray-900">08:30</div>
            <div class="flex-1 text-sm text-gray-600">核心学习</div>
          </div>
          <div 
            class="flex items-center gap-3 p-2 rounded-lg transition-all"
            :class="{
              'bg-blue-50 border-l-2 border-blue-400': isCurrentTimeSlot('12:00'),
              'hover:bg-slate-50': !isCurrentTimeSlot('12:00')
            }"
          >
            <div class="w-2 h-2 rounded-full bg-yellow-400" :class="{ 'animate-pulse': isCurrentTimeSlot('12:00') }"></div>
            <div class="text-sm font-medium text-gray-900">12:00</div>
            <div class="flex-1 text-sm text-gray-600">午休</div>
          </div>
          <div 
            class="flex items-center gap-3 p-2 rounded-lg transition-all"
            :class="{
              'bg-blue-50 border-l-2 border-blue-400': isCurrentTimeSlot('14:00'),
              'hover:bg-slate-50': !isCurrentTimeSlot('14:00')
            }"
          >
            <div class="w-2 h-2 rounded-full bg-blue-400" :class="{ 'animate-pulse': isCurrentTimeSlot('14:00') }"></div>
            <div class="text-sm font-medium text-gray-900">14:00</div>
            <div class="flex-1 text-sm text-gray-600">核心学习</div>
          </div>
          <div 
            class="flex items-center gap-3 p-2 rounded-lg transition-all"
            :class="{
              'bg-blue-50 border-l-2 border-blue-400': isCurrentTimeSlot('18:00'),
              'hover:bg-slate-50': !isCurrentTimeSlot('18:00')
            }"
          >
            <div class="w-2 h-2 rounded-full bg-orange-400" :class="{ 'animate-pulse': isCurrentTimeSlot('18:00') }"></div>
            <div class="text-sm font-medium text-gray-900">18:00</div>
            <div class="flex-1 text-sm text-gray-600">晚餐</div>
          </div>
          <div 
            class="flex items-center gap-3 p-2 rounded-lg transition-all"
            :class="{
              'bg-blue-50 border-l-2 border-blue-400': isCurrentTimeSlot('20:00'),
              'hover:bg-slate-50': !isCurrentTimeSlot('20:00')
            }"
          >
            <div class="w-2 h-2 rounded-full bg-purple-400" :class="{ 'animate-pulse': isCurrentTimeSlot('20:00') }"></div>
            <div class="text-sm font-medium text-gray-900">20:00</div>
            <div class="flex-1 text-sm text-gray-600">晚间学习</div>
          </div>
          <div 
            class="flex items-center gap-3 p-2 rounded-lg transition-all"
            :class="{
              'bg-blue-50 border-l-2 border-blue-400': isCurrentTimeSlot('22:00'),
              'hover:bg-slate-50': !isCurrentTimeSlot('22:00')
            }"
          >
            <div class="w-2 h-2 rounded-full bg-red-400" :class="{ 'animate-pulse': isCurrentTimeSlot('22:00') }"></div>
            <div class="text-sm font-medium text-gray-900">22:00</div>
            <div class="flex-1 text-sm text-gray-600">禁手机</div>
          </div>
        </div>
      </div>
      

      
      <!-- 时空穿梭机 -->
      <div class="p-4 border-t border-slate-100 flex justify-center gap-2">
        <button 
          class="text-xs px-2 py-1 rounded-md transition-all"
          :class="{
            'bg-blue-100 text-blue-800': systemStore.mockDay === 'REAL',
            'bg-gray-100 text-gray-600 hover:bg-gray-200': systemStore.mockDay !== 'REAL'
          }"
          @click="systemStore.mockDay = 'REAL'"
        >
          [真实时间]
        </button>
        <button 
          class="text-xs px-2 py-1 rounded-md transition-all"
          :class="{
            'bg-blue-100 text-blue-800': systemStore.mockDay === 'SATURDAY',
            'bg-gray-100 text-gray-600 hover:bg-gray-200': systemStore.mockDay !== 'SATURDAY'
          }"
          @click="systemStore.mockDay = 'SATURDAY'"
        >
          [测周六]
        </button>
        <button 
          class="text-xs px-2 py-1 rounded-md transition-all"
          :class="{
            'bg-blue-100 text-blue-800': systemStore.mockDay === 'SUNDAY',
            'bg-gray-100 text-gray-600 hover:bg-gray-200': systemStore.mockDay !== 'SUNDAY'
          }"
          @click="systemStore.mockDay = 'SUNDAY'"
        >
          [测周日]
        </button>
      </div>
      
      <!-- PWA 安装按钮 -->
      <div class="p-4 border-t border-slate-100">
        <button 
          v-if="deferredPrompt" 
          @click="installPWA"
          class="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-3 rounded-xl font-bold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
        >
          💻 安装客户端
        </button>
      </div>
    </aside>
    
    <!-- 右侧主内容区 -->
    <main class="flex-1 flex flex-col pb-20 md:pb-0">
      <!-- 顶部 Header -->
      <header class="bg-white shadow-sm py-4 px-4 md:px-8 flex items-center justify-between sticky top-0 z-10">
        <h2 class="text-2xl font-bold text-gray-900">{{ getPageTitle() }}</h2>
        <div class="flex items-center gap-4">
          <!-- 通知授权按钮 -->
          <button 
            v-if="notificationPermission === 'default'"
            @click="handleRequestPermission"
            class="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-2 rounded-full font-bold hover:from-amber-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
          >
            <Bell class="w-5 h-5" />
            🔔 启用通知
          </button>
          <!-- 金币显示 -->
          <div class="bg-gradient-to-r from-yellow-400 to-amber-500 text-white px-6 py-3 rounded-full font-bold flex items-center gap-3 shadow-md hover:shadow-lg transition-all">
            <Coins class="w-6 h-6" />
            <span class="text-lg">{{ systemStore.totalScore }}</span>
          </div>
        </div>
      </header>
      
      <!-- 内容区 -->
      <div class="flex-1 p-4 md:p-8">
        <router-view @task-complete="handleTaskComplete" />
      </div>
    </main>
    
    <!-- 移动端底部导航 -->
    <nav class="md:hidden fixed bottom-0 w-full bg-white/90 backdrop-blur-md border-t border-gray-200 z-50 flex justify-around items-center pb-2 pt-2 pb-safe">
      <router-link 
        to="/" 
        class="flex flex-col items-center gap-1 p-2 transition-all"
        :class="{
          'text-blue-600': $route.path === '/',
          'text-gray-600': $route.path !== '/'
        }"
      >
        <Clock class="w-6 h-6" />
        <span class="text-xs font-medium">打卡</span>
      </router-link>
      <router-link 
        to="/rewards" 
        class="flex flex-col items-center gap-1 p-2 transition-all"
        :class="{
          'text-blue-600': $route.path === '/rewards',
          'text-gray-600': $route.path !== '/rewards'
        }"
      >
        <Gift class="w-6 h-6" />
        <span class="text-xs font-medium">兑换</span>
      </router-link>
      <router-link 
        to="/plan" 
        class="flex flex-col items-center gap-1 p-2 transition-all"
        :class="{
          'text-blue-600': $route.path === '/plan',
          'text-gray-600': $route.path !== '/plan'
        }"
      >
        <Calendar class="w-6 h-6" />
        <span class="text-xs font-medium">规划</span>
      </router-link>
    </nav>
    
    <!-- 全局任务结算弹窗 -->
    <SettleModal 
      :visible="settleModalVisible" 
      :task="selectedTask" 
      @close="settleModalVisible = false"
      @confirm="handleSettleConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useSystemStore } from './store'
import { Clock, Gift, Calendar, Coins, Bell } from 'lucide-vue-next'
import SettleModal from './components/SettleModal.vue'
import { requestPermission, notify } from './utils/notifier'

const systemStore = useSystemStore()

// 结算弹窗状态
const settleModalVisible = ref(false)
const selectedTask = ref(null as any)

// 通知权限状态
const notificationPermission = ref('default')

// 检查通知权限
const checkNotificationPermission = () => {
  if ('Notification' in window) {
    notificationPermission.value = Notification.permission
  }
}

// 请求通知权限
const handleRequestPermission = async () => {
  const granted = await requestPermission()
  checkNotificationPermission()
  if (granted) {
    notify('🎉 授权成功', 'Nova System 已获得系统通知权限，将为您提供及时的状态提醒！', 'SUCCESS')
  }
}

// 处理任务完成
const handleTaskComplete = (taskId: string, timeSpent: number) => {
  const task = systemStore.allTasks.find((t: any) => t.id === taskId)
  if (task) {
    selectedTask.value = { ...task, timeSpent }
    settleModalVisible.value = true
  }
}

// 处理结算确认
const handleSettleConfirm = (data: { taskId: string; timeSpent: number; actualPerfScore: number }) => {
  const { taskId, timeSpent, actualPerfScore } = data
  systemStore.checkIn(taskId, timeSpent, actualPerfScore)
  settleModalVisible.value = false
  selectedTask.value = null
}

// 获取问候语
const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return '早上好！'
  if (hour < 18) return '下午好！'
  return '晚上好！'
}

// 获取页面标题
const getPageTitle = () => {
  const path = window.location.pathname
  if (path === '/') return '今日打卡'
  if (path === '/rewards') return '兑换大厅'
  if (path === '/plan') return '周末规划'
  return 'Nova System'
}

// PWA 安装相关
const deferredPrompt = ref<any>(null)

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  deferredPrompt.value = e
})

const installPWA = async () => {
  if (deferredPrompt.value) {
    deferredPrompt.value.prompt()
    const { outcome } = await deferredPrompt.value.userChoice
    console.log(`用户选择: ${outcome}`)
    deferredPrompt.value = null
  }
}

// 判断是否为当前时间区间
const isCurrentTimeSlot = (time: string) => {
  const currentHour = new Date().getHours()
  const slotHour = parseInt(time.split(':')[0])
  
  // 简单判断：当前小时是否与时间槽小时匹配
  return currentHour === slotHour
}

// 作息状态监听
let previousSlotType = ref<string | null>(null)

watch(
  () => systemStore.currentScheduleStatus.currentSlot,
  (newSlot) => {
    if (newSlot && newSlot.type !== previousSlotType.value) {
      if (previousSlotType.value) {
        // 作息时段发生切换
        notify('Nova 状态切换', `当前已进入【${newSlot.name}】阶段！`, 'CHIME')
      }
      previousSlotType.value = newSlot.type
    }
  },
  { immediate: true }
)

onMounted(() => {
  // 初始化 Store
  systemStore.initStore()
  // 检查通知权限
  checkNotificationPermission()
})
</script>
