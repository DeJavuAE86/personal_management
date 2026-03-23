<template>
  <div class="space-y-8">
    <!-- 👑 找回的：动态 Hero Banner -->
    <div 
      class="rounded-3xl shadow-xl overflow-hidden transition-all duration-500 ease-in-out"
      :class="{
        'h-48': !isTaskInProgress && currentSlot?.type !== 'OPTIONAL' && currentSlot?.type !== 'REVIEW' && currentSlot?.type !== 'REWARD',
        'h-64': isTaskInProgress || (currentSlot?.type === 'OPTIONAL') || (currentSlot?.type === 'REVIEW') || (currentSlot?.type === 'REWARD'),
        'bg-gradient-to-br from-blue-900 to-indigo-900': isTaskInProgress,
        'bg-gradient-to-br from-blue-500 to-indigo-600': !isTaskInProgress && currentSlot?.type === 'CORE',
        'bg-gradient-to-br from-green-500 to-emerald-600': !isTaskInProgress && currentSlot?.type === 'REST',
        'bg-gradient-to-br from-yellow-500 to-amber-600': !isTaskInProgress && currentSlot?.type === 'RECREATION',
        'bg-gradient-to-br from-purple-500 to-violet-600': !isTaskInProgress && currentSlot?.type === 'ROUTINE',
        'bg-gradient-to-br from-red-500 to-rose-600': !isTaskInProgress && currentSlot?.type === 'SLEEP',
        'bg-gradient-to-br from-indigo-500 to-purple-600': !isTaskInProgress && currentSlot?.type === 'OPTIONAL',
        'bg-gradient-to-br from-orange-500 to-amber-600': !isTaskInProgress && currentSlot?.type === 'REVIEW',
        'bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500': !isTaskInProgress && currentSlot?.type === 'REWARD'
      }"
    >
      <!-- 任务专注模式 -->
      <div v-if="isTaskInProgress" class="h-full flex flex-col items-center justify-center text-white p-6">
        <h2 class="text-2xl font-bold mb-2 text-center">{{ currentTask?.title }}</h2>
        <div class="text-4xl font-mono font-bold mb-6 animate-pulse">{{ formattedTime }}</div>
        <button 
          @click="handleEndTask(currentTask?.id)"
          class="bg-white text-blue-900 px-6 py-3 rounded-full font-bold hover:bg-blue-50 transition-colors shadow-md"
        >
          ⏹ 结束专注并结算
        </button>
      </div>
      
      <!-- 作息巡航模式 -->
      <div v-else class="h-full flex flex-col justify-center p-8 text-white">
        <div class="text-4xl font-bold mb-2">{{ currentTimeString }}</div>
        
        <!-- 周六未复盘状态 -->
        <div v-if="currentSlot?.type === 'REVIEW'">
          <h2 class="text-2xl font-bold mb-4">🔥 当前状态：{{ currentSlot.name }}</h2>
          <div class="text-lg mb-6 opacity-90">👉 自由清算中，去周末规划页写复盘解锁狂欢！</div>
        </div>
        
        <!-- 周六已解锁状态 -->
        <div v-else-if="currentSlot?.type === 'REWARD'">
          <h2 class="text-2xl font-bold mb-4">🔥 当前状态：{{ currentSlot.name }}</h2>
          <div class="text-lg mb-6 opacity-90">👉 周末狂欢已开启，尽情去兑换大厅享受吧！</div>
        </div>
        
        <!-- 普通时段 -->
        <div v-else>
          <h2 class="text-2xl font-bold mb-4">🔥 当前状态：{{ currentSlot?.name }} ({{ currentSlot?.startTime }} - {{ currentSlot?.endTime }})</h2>
          <div v-if="nextSlot" class="text-lg opacity-90">
            👉 预告：距离【{{ nextSlot.name }}】还有 {{ formatTimeToNextSlot(timeToNextSlot) }}
          </div>
        </div>
      </div>
    </div>

    <!-- 页面标题和日期 -->
    <div class="flex items-center justify-between flex-wrap gap-4">
      <h1 class="text-3xl font-bold text-gray-900">今日打卡</h1>
      <div class="flex items-center gap-3">
        <div class="bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 text-gray-700">
          {{ displayDate }}
        </div>
        <div class="bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200">
          <input 
            type="date" 
            v-model="selectedDate"
            class="border-none outline-none text-gray-700 bg-transparent"
            @change="updateDisplayDate"
          />
        </div>
      </div>
    </div>
    
    <!-- 今日进度 -->
    <div class="bg-white rounded-2xl shadow-md p-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="font-semibold text-gray-900 text-lg">今日进度</h2>
        <span class="text-sm text-gray-600 font-medium">
          {{ systemStore.completedTasksCount }} / {{ systemStore.currentDayTasks.length }} 已完成
        </span>
      </div>
      <div class="w-full bg-slate-100 rounded-full h-3">
        <div 
          class="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500 ease-out"
          :style="{ width: progressPercentage + '%' }"
        ></div>
      </div>
    </div>
    
    <!-- ✨ 保留的新版：习惯打卡区（已接入全局系统防刷分） -->
    <div class="space-y-4">
      <h2 class="text-xl font-semibold text-gray-900 flex items-center gap-2">
        <span class="text-amber-500">🌟</span> 每日基石
      </h2>
      <div class="flex gap-4 overflow-x-auto pb-2 snap-x">
        <div 
          class="flex-shrink-0 w-64 bg-white rounded-2xl shadow-md p-5 cursor-pointer transition-all hover:shadow-lg transform hover:-translate-y-1 snap-start"
          :class="{ 'opacity-60 bg-gray-50': systemStore.dailyHabits.earlyRise.completed }"
          @click="systemStore.checkInHabit('earlyRise')"
        >
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-medium text-gray-900">守住 7:00 早起锚点</h3>
            <div v-if="systemStore.dailyHabits.earlyRise.completed" class="text-green-500 bg-green-50 p-2 rounded-full">
              <Check class="w-5 h-5" />
            </div>
            <div v-else class="w-10 h-10 border-2 border-slate-200 rounded-full flex items-center justify-center hover:border-blue-400 transition-colors"></div>
          </div>
          <div class="bg-yellow-50 px-3 py-2 rounded-full inline-block">
            <p class="text-sm font-medium text-yellow-700">💰 +1 分</p>
          </div>
        </div>
        
        <div 
          class="flex-shrink-0 w-64 bg-white rounded-2xl shadow-md p-5 cursor-pointer transition-all hover:shadow-lg transform hover:-translate-y-1 snap-start"
          :class="{ 'opacity-60 bg-gray-50': systemStore.dailyHabits.phoneIsolation.completed }"
          @click="systemStore.checkInHabit('phoneIsolation')"
        >
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-medium text-gray-900">全天手机物理隔离</h3>
            <div v-if="systemStore.dailyHabits.phoneIsolation.completed" class="text-green-500 bg-green-50 p-2 rounded-full">
              <Check class="w-5 h-5" />
            </div>
            <div v-else class="w-10 h-10 border-2 border-slate-200 rounded-full flex items-center justify-center hover:border-blue-400 transition-colors"></div>
          </div>
          <div class="bg-yellow-50 px-3 py-2 rounded-full inline-block">
            <p class="text-sm font-medium text-yellow-700">💰 +2 分</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 1. 保底防线 (MIN) -->
    <div class="space-y-4">
      <div class="flex items-center gap-3">
        <div class="w-3 h-3 bg-rose-500 rounded-full"></div>
        <h2 class="text-xl font-semibold text-gray-900">🚨 保底防线</h2>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TaskCard v-for="task in minTasks" :key="task.id" :task="task" @start="handleStartTask" @pause="handlePauseTask" @resume="handleResumeTask" @end="handleEndTask" />
        <div v-if="minTasks.length === 0" class="bg-white rounded-2xl shadow-sm p-8 text-center md:col-span-2 border border-slate-200 text-gray-500">
          📋 暂无保底任务
        </div>
      </div>
    </div>
    
    <!-- 2. 核心目标 (STANDARD) -->
    <div class="space-y-4">
      <div class="flex items-center gap-3">
        <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
        <h2 class="text-xl font-semibold text-gray-900">🎯 核心目标</h2>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TaskCard v-for="task in standardTasks" :key="task.id" :task="task" @start="handleStartTask" @pause="handlePauseTask" @resume="handleResumeTask" @end="handleEndTask" />
        <div v-if="standardTasks.length === 0" class="bg-white rounded-2xl shadow-sm p-8 text-center md:col-span-2 border border-slate-200 text-gray-500">
          🎯 暂无标准任务
        </div>
      </div>
    </div>
    
    <!-- 3. 超频冲刺 (EXTRA) -->
    <div class="space-y-4">
      <div class="flex items-center gap-3">
        <div class="w-3 h-3 bg-purple-500 rounded-full"></div>
        <h2 class="text-xl font-semibold text-gray-900">🚀 超频冲刺</h2>
      </div>
      
      <div v-if="!isExtraUnlocked" class="bg-white rounded-2xl shadow-sm p-8 text-center border border-slate-200">
        <Lock class="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p class="text-gray-600 font-medium">🔒 完成所有标准任务后解锁超频模式</p>
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TaskCard v-for="task in extraTasks" :key="task.id" :task="task" @start="handleStartTask" @pause="handlePauseTask" @resume="handleResumeTask" @end="handleEndTask" />
        <div v-if="extraTasks.length === 0" class="bg-white rounded-2xl shadow-sm p-8 text-center md:col-span-2 border border-slate-200 text-gray-500">
          🚀 暂无超频任务
        </div>
      </div>
    </div>
    
    <!-- 日结按钮 -->
    <div class="mt-10">
      <button 
        class="w-full py-4 rounded-2xl font-bold text-lg transition-all transform hover:-translate-y-1"
        :class="{
          'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg hover:shadow-xl': !systemStore.isTodaySettled,
          'bg-gray-400 text-gray-200 cursor-not-allowed': systemStore.isTodaySettled
        }"
        :disabled="systemStore.isTodaySettled"
        @click="handleDailySettle"
      >
        {{ systemStore.isTodaySettled ? '今日已结算' : '结束今日学习，进行结算' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useSystemStore } from '../store'
import TaskCard from '../components/TaskCard.vue'
import { Lock, Check } from 'lucide-vue-next'

const systemStore = useSystemStore()
const emit = defineEmits(['task-complete'])

const isPc = ref(window.innerWidth >= 768)
const handleResize = () => { isPc.value = window.innerWidth >= 768 }

const selectedDate = ref(systemStore.currentDate)
const displayDate = ref(systemStore.currentDate)

// 👑 找回的：动态作息 Banner 所需的全部状态与计时器
const timer = ref<number | null>(null)
const elapsedTime = ref(0)
const timeUpdateTimer = ref<number | null>(null)

const currentSlot = computed(() => systemStore.currentScheduleStatus.currentSlot)
const nextSlot = computed(() => systemStore.currentScheduleStatus.nextSlot)
const timeToNextSlot = computed(() => systemStore.currentScheduleStatus.timeToNextSlot)

const isTaskInProgress = computed(() => systemStore.allTasks.some(task => task.status === 'DOING'))
const currentTask = computed(() => systemStore.allTasks.find(task => task.status === 'DOING'))
const currentTimeString = ref(systemStore.getNow().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }))

const updateCurrentTime = () => {
  const now = systemStore.getNow()
  currentTimeString.value = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  systemStore.updateCurrentTime()
}

const formatTimeToNextSlot = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0) return `${hours} 小时 ${mins} 分钟`
  return `${mins} 分钟`
}

const formattedTime = computed(() => {
  const totalSeconds = elapsedTime.value
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

// === 任务列表计算 ===
const updateDisplayDate = () => { displayDate.value = selectedDate.value }

const minTasks = computed(() => systemStore.allTasks.filter((task: any) => task.capacity === 'MIN' && task.plannedDate === selectedDate.value && task.status !== 'DONE'))
const standardTasks = computed(() => systemStore.allTasks.filter((task: any) => task.capacity === 'STANDARD' && task.plannedDate === selectedDate.value && task.status !== 'DONE'))
const extraTasks = computed(() => systemStore.allTasks.filter((task: any) => task.capacity === 'EXTRA' && task.plannedDate === selectedDate.value && task.status !== 'DONE'))

const progressPercentage = computed(() => {
  const total = minTasks.value.length + standardTasks.value.length + extraTasks.value.length
  if (total === 0) return 0
  const completed = systemStore.allTasks.filter((task: any) => 
    (task.capacity === 'MIN' || task.capacity === 'STANDARD' || task.capacity === 'EXTRA') && 
    task.plannedDate === selectedDate.value && task.status === 'DONE'
  ).length
  return (completed / total) * 100
})

const isExtraUnlocked = computed(() => {
  return standardTasks.value.length === 0 || systemStore.allTasks.filter((task: any) => 
    task.capacity === 'STANDARD' && task.plannedDate === selectedDate.value
  ).every((task: any) => task.status === 'DONE')
})

// === 👑 找回的：倒计时生命周期 ===
const startTimer = () => {
  if (timer.value) clearInterval(timer.value)
  timer.value = window.setInterval(() => { elapsedTime.value++ }, 1000)
}

const stopTimer = () => {
  if (timer.value) {
    clearInterval(timer.value)
    timer.value = null
  }
}

const handleStartTask = (taskId: string) => {
  systemStore.startTask(taskId)
  elapsedTime.value = 0
  startTimer()
}

const handlePauseTask = (taskId: string) => {
  systemStore.pauseTask(taskId)
  stopTimer()
}

const handleResumeTask = (taskId: string) => {
  systemStore.resumeTask(taskId)
  startTimer()
}

const handleEndTask = (taskId: string | undefined) => {
  if (!taskId) return
  stopTimer()
  const timeSpent = systemStore.endTask(taskId)
  emit('task-complete', taskId, timeSpent)
}

const handleDailySettle = () => {
  if (systemStore.isTodaySettled) return
  systemStore.dailySettle()
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  if (isTaskInProgress.value) startTimer()
  timeUpdateTimer.value = window.setInterval(updateCurrentTime, 1000)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  stopTimer()
  if (timeUpdateTimer.value) {
    clearInterval(timeUpdateTimer.value)
    timeUpdateTimer.value = null
  }
})
</script>