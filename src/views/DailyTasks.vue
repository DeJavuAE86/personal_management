<template>
  <div class="space-y-8">
    <!-- 动态 Hero Banner -->
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
          class="bg-white text-blue-900 px-6 py-3 rounded-full font-bold hover:bg-blue-50 transition-colors"
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
          <div class="text-lg mb-6 opacity-90">
            👉 自由清算中，去周末规划页写复盘解锁狂欢！
          </div>
          <div class="mt-4">
            <div class="bg-white/20 backdrop-blur-sm px-6 py-4 rounded-full inline-block">
              <span class="font-medium">
                📝 完成复盘后即可开启周末狂欢
              </span>
            </div>
          </div>
        </div>
        
        <!-- 周六已解锁状态 -->
        <div v-else-if="currentSlot?.type === 'REWARD'">
          <h2 class="text-2xl font-bold mb-4">🔥 当前状态：{{ currentSlot.name }}</h2>
          <div class="text-lg mb-6 opacity-90">
            👉 周末狂欢已开启，尽情去兑换大厅享受吧！
          </div>
          <div class="mt-4">
            <div class="bg-white/20 backdrop-blur-sm px-6 py-4 rounded-full inline-block">
              <span class="font-medium">
                🎉 封印解除，自由狂欢模式已激活
              </span>
            </div>
          </div>
        </div>
        
        <!-- 可选择时段 -->
        <div v-else-if="currentSlot?.type === 'OPTIONAL'">
          <h2 class="text-2xl font-bold mb-4">
            🔥 当前状态：
            {{ optionalSlotChoice === 'LEARN' ? '晚间学习' : currentSlot.name }} 
            ({{ currentSlot.startTime }} - {{ currentSlot.endTime }})
          </h2>
          <div class="text-lg mb-6 opacity-90">
            👉 预告：距离【{{ nextSlot?.name }}】还有 {{ formatTimeToNextSlot(timeToNextSlot) }}
          </div>
          <div v-if="!optionalSlotChoice" class="flex gap-4">
            <button 
              @click="optionalSlotChoice = 'LEARN'"
              class="bg-white text-blue-900 px-6 py-3 rounded-full font-bold hover:bg-blue-50 transition-colors"
            >
              📚 开始学习
            </button>
          </div>
          <div v-else-if="optionalSlotChoice === 'LEARN'" class="mt-4">
            <div class="bg-white/20 backdrop-blur-sm px-6 py-4 rounded-full inline-block">
              <span class="font-medium">
                📚 已选择学习
              </span>
            </div>
          </div>
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
        <!-- 日期穿梭器 -->
        <div class="bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200">
          <input 
            type="date" 
            v-model="selectedDate"
            class="border-none outline-none text-gray-700"
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
    
    <!-- 习惯打卡区 -->
    <div class="space-y-4">
      <h2 class="text-xl font-semibold text-gray-900 flex items-center gap-2">
        <span class="text-amber-500">🌟</span>
        每日基石
      </h2>
      <div class="flex flex-col md:flex-row gap-4 md:gap-4">
        <!-- 早起习惯 -->
        <div 
          class="flex-shrink-0 w-full md:w-64 bg-white rounded-2xl shadow-md p-5 cursor-pointer transition-all hover:shadow-lg transform hover:-translate-y-1"
          :class="{ 'opacity-60': habits.earlyRise.completed }"
          @click="toggleHabit('earlyRise')"
        >
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-medium text-gray-900">守住 7:00 早起锚点</h3>
            <div v-if="habits.earlyRise.completed" class="text-green-500 bg-green-50 p-2 rounded-full">
              <Check class="w-5 h-5" />
            </div>
            <div v-else class="w-10 h-10 border-2 border-slate-200 rounded-full flex items-center justify-center hover:border-blue-400 transition-colors">
              <input type="checkbox" class="hidden" />
            </div>
          </div>
          <div class="bg-yellow-50 px-3 py-2 rounded-full inline-block">
            <p class="text-sm font-medium text-yellow-700">💰 +1 分</p>
          </div>
        </div>
        
        <!-- 手机物理隔离习惯 -->
        <div 
          class="flex-shrink-0 w-full md:w-64 bg-white rounded-2xl shadow-md p-5 cursor-pointer transition-all hover:shadow-lg transform hover:-translate-y-1"
          :class="{ 'opacity-60': habits.phoneIsolation.completed }"
          @click="toggleHabit('phoneIsolation')"
        >
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-medium text-gray-900">全天手机物理隔离</h3>
            <div v-if="habits.phoneIsolation.completed" class="text-green-500 bg-green-50 p-2 rounded-full">
              <Check class="w-5 h-5" />
            </div>
            <div v-else class="w-10 h-10 border-2 border-slate-200 rounded-full flex items-center justify-center hover:border-blue-400 transition-colors">
              <input type="checkbox" class="hidden" />
            </div>
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
        <TaskCard 
          v-for="task in minTasks" 
          :key="task.id" 
          :task="task"
          @start="handleStartTask"
          @pause="handlePauseTask"
          @resume="handleResumeTask"
          @end="handleEndTask"
        />
        <div v-if="minTasks.length === 0" class="bg-white rounded-2xl shadow-sm p-8 text-center col-span-2 border border-slate-200">
          <div class="text-gray-400 mb-3">📋</div>
          <p class="text-gray-600">暂无保底任务</p>
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
        <TaskCard 
          v-for="task in standardTasks" 
          :key="task.id" 
          :task="task"
          @start="handleStartTask"
          @pause="handlePauseTask"
          @resume="handleResumeTask"
          @end="handleEndTask"
        />
        <div v-if="standardTasks.length === 0" class="bg-white rounded-2xl shadow-sm p-8 text-center col-span-2 border border-slate-200">
          <div class="text-gray-400 mb-3">🎯</div>
          <p class="text-gray-600">暂无标准任务</p>
        </div>
      </div>
    </div>
    
    <!-- 3. 超频冲刺 (EXTRA) -->
    <div class="space-y-4">
      <div class="flex items-center gap-3">
        <div class="w-3 h-3 bg-purple-500 rounded-full"></div>
        <h2 class="text-xl font-semibold text-gray-900">🚀 超频冲刺</h2>
      </div>
      
      <!-- 解锁逻辑 -->
      <div v-if="!isExtraUnlocked" class="bg-white rounded-2xl shadow-sm p-8 text-center col-span-2 border border-slate-200">
        <Lock class="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p class="text-gray-600 font-medium">🔒 完成所有标准任务后解锁超频模式</p>
      </div>
      
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TaskCard 
          v-for="task in extraTasks" 
          :key="task.id" 
          :task="task"
          @start="handleStartTask"
          @pause="handlePauseTask"
          @resume="handleResumeTask"
          @end="handleEndTask"
        />
        <div v-if="extraTasks.length === 0" class="bg-white rounded-2xl shadow-sm p-8 text-center col-span-2 border border-slate-200">
          <div class="text-gray-400 mb-3">🚀</div>
          <p class="text-gray-600">暂无超频任务</p>
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
    
    <!-- 结算结果提示 -->
    <div v-if="settleResult" class="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
      <div class="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl transform transition-all">
        <div class="text-center mb-6">
          <h3 class="text-2xl font-bold mb-3">结算结果</h3>
          <div 
            class="inline-block px-4 py-2 rounded-full text-sm font-medium"
            :class="{
              'bg-rose-100 text-rose-700': settleResult.status === 'CRASH',
              'bg-blue-100 text-blue-700': settleResult.status === 'NORMAL',
              'bg-purple-100 text-purple-700': settleResult.status === 'CRIT'
            }"
          >
            {{ getSettleStatusText(settleResult.status) }}
          </div>
        </div>
        <div class="text-center mb-6">
          <p class="text-4xl font-bold text-gray-900">{{ settleResult.finalScore }}</p>
          <p class="text-gray-600">今日收益</p>
        </div>
        <div class="flex justify-center">
          <button 
            class="px-8 py-3 bg-slate-100 text-gray-800 rounded-xl font-medium hover:bg-slate-200 transition-colors"
            @click="settleResult = null"
          >
            确定
          </button>
        </div>
      </div>
    </div>
    

    
    <!-- 成功提示 -->
    <div v-if="showSuccessToast" class="fixed top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg z-50 animate-fade-in">
      <div class="flex items-center gap-2">
        <Check class="w-5 h-5" />
        <span>任务完成！获得 {{ successScore }} 分</span>
      </div>
    </div>
    
    <!-- 时间测试切换按钮 -->
    <button 
      @click="showTimeTest = !showTimeTest"
      class="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg z-50 hover:bg-blue-600 transition-colors"
    >
      {{ showTimeTest ? '关闭时空穿梭' : '时空穿梭' }}
    </button>
    
    <!-- 时间测试控件 -->
    <div v-if="showTimeTest" class="fixed bottom-16 right-4 bg-white rounded-xl shadow-lg p-4 z-50 max-w-xs">
      <h3 class="font-medium text-gray-900 mb-2 flex justify-between items-center">
        <span>时空穿梭机</span>
        <button @click="showTimeTest = false" class="text-gray-400 hover:text-gray-600">×</button>
      </h3>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">目标日期</label>
          <input 
            type="date" 
            v-model="timeTravelDate"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">目标时间</label>
          <input 
            type="time" 
            v-model="timeTravelTime"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button 
          @click="handleTimeTravel"
          class="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-colors"
        >
          🚀 开始穿越
        </button>
        <button 
          @click="resetToRealTime"
          class="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          🔄 回到现实
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useSystemStore } from '../store'
import TaskCard from '../components/TaskCard.vue'
import { Lock, Check } from 'lucide-vue-next'

const systemStore = useSystemStore()

// Emits
const emit = defineEmits(['task-complete'])

// 判断是否为 PC 端
const isPc = ref(window.innerWidth >= 768)

// 监听窗口大小变化
const handleResize = () => {
  isPc.value = window.innerWidth >= 768
}

// 习惯打卡
const habits = ref({
  earlyRise: {
    completed: false,
    score: 1
  },
  phoneIsolation: {
    completed: false,
    score: 2
  }
})

// 日期穿梭器
const selectedDate = ref(systemStore.currentDate)
const displayDate = ref(systemStore.currentDate)

// 成功提示
const showSuccessToast = ref(false)
const successScore = ref(0)

// 结算结果
const settleResult = ref<{ status: string; finalScore: number } | null>(null)

// 计时器
const timer = ref<number | null>(null)
const elapsedTime = ref(0)

// 可选择时段的状态
const optionalSlotChoice = ref<'LEARN' | 'REST' | null>(null) // LEARN表示选择学习，REST表示选择休息

// 时间测试控件显示状态
const showTimeTest = ref(false)

// 时间穿越测试的日期和时间
const timeTravelDate = ref(systemStore.getNow().toISOString().split('T')[0])
const timeTravelTime = ref(systemStore.getNow().toTimeString().split(' ')[0].substring(0, 5))

// 获取当前作息状态
const currentSlot = computed(() => {
  return systemStore.currentScheduleStatus.currentSlot
})

const nextSlot = computed(() => {
  return systemStore.currentScheduleStatus.nextSlot
})

const timeToNextSlot = computed(() => {
  return systemStore.currentScheduleStatus.timeToNextSlot
})

// 检查是否有任务在进行中
const isTaskInProgress = computed(() => {
  return systemStore.allTasks.some(task => task.status === 'DOING')
})

// 获取当前进行中的任务
const currentTask = computed(() => {
  return systemStore.allTasks.find(task => task.status === 'DOING')
})

// 当前时间字符串
const currentTimeString = ref(systemStore.getNow().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }))

// 实时更新时间
const updateCurrentTime = () => {
  // 使用系统的唯一时间源
  const now = systemStore.getNow()
  currentTimeString.value = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  // 强制重新计算作息状态，确保预告时间实时更新
  systemStore.updateCurrentTime()
}

// 格式化距离下一个时段的时间
const formatTimeToNextSlot = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0) {
    return `${hours} 小时 ${mins} 分钟`
  }
  return `${mins} 分钟`
}

// 格式化专注时间
const formattedTime = computed(() => {
  const totalSeconds = elapsedTime.value
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

// 更新显示日期
const updateDisplayDate = () => {
  displayDate.value = selectedDate.value
}

// 过滤不同类型的任务
const minTasks = computed(() => {
  return systemStore.allTasks.filter((task: any) => task.capacity === 'MIN' && task.plannedDate === selectedDate.value && task.status !== 'DONE')
})

const standardTasks = computed(() => {
  return systemStore.allTasks.filter((task: any) => task.capacity === 'STANDARD' && task.plannedDate === selectedDate.value && task.status !== 'DONE')
})

const extraTasks = computed(() => {
  return systemStore.allTasks.filter((task: any) => task.capacity === 'EXTRA' && task.plannedDate === selectedDate.value && task.status !== 'DONE')
})

// 计算进度百分比
const progressPercentage = computed(() => {
  const total = minTasks.value.length + standardTasks.value.length + extraTasks.value.length
  if (total === 0) return 0
  const completed = systemStore.allTasks.filter((task: any) => 
    (task.capacity === 'MIN' || task.capacity === 'STANDARD' || task.capacity === 'EXTRA') && 
    task.plannedDate === selectedDate.value && 
    task.status === 'DONE'
  ).length
  return (completed / total) * 100
})

// 判断是否解锁超频任务
const isExtraUnlocked = computed(() => {
  // 检查是否所有标准任务都已完成
  return standardTasks.value.length === 0 || systemStore.allTasks.filter((task: any) => 
    task.capacity === 'STANDARD' && task.plannedDate === selectedDate.value
  ).every((task: any) => task.status === 'DONE')
})

// 处理习惯打卡
const toggleHabit = (habitKey: string) => {
  const habit = habits.value[habitKey as keyof typeof habits.value]
  if (!habit.completed) {
    // 标记为完成并增加积分
    habit.completed = true
    systemStore.checkInHabit(habit.score)
  }
}

// 处理任务开始
const handleStartTask = (taskId: string) => {
  systemStore.startTask(taskId)
  // 重置并开始计时器
  elapsedTime.value = 0
  startTimer()
}

// 处理任务暂停
const handlePauseTask = (taskId: string) => {
  systemStore.pauseTask(taskId)
  // 停止计时器
  stopTimer()
}

// 处理任务继续
const handleResumeTask = (taskId: string) => {
  systemStore.resumeTask(taskId)
  // 开始计时器
  startTimer()
}

// 处理任务结束
const handleEndTask = (taskId: string | undefined) => {
  if (!taskId) return
  // 停止计时器
  stopTimer()
  // 计算任务耗时
  const timeSpent = systemStore.endTask(taskId)
  // 触发任务完成事件，传递耗时
  emit('task-complete', taskId, timeSpent)
}

// 开始计时器
const startTimer = () => {
  // 清除之前的计时器
  if (timer.value) {
    clearInterval(timer.value)
  }
  // 开始新的计时器
  timer.value = window.setInterval(() => {
    elapsedTime.value++
  }, 1000)
}

// 停止计时器
const stopTimer = () => {
  if (timer.value) {
    clearInterval(timer.value)
    timer.value = null
  }
}

// 时间穿越
const handleTimeTravel = () => {
  systemStore.jumpToDateTime(timeTravelDate.value, timeTravelTime.value)
  // 更新当前时间字符串
  currentTimeString.value = systemStore.getNow().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// 重置为真实时间
const resetToRealTime = () => {
  systemStore.resetRealTime()
  // 更新时间穿越测试的日期和时间
  timeTravelDate.value = systemStore.getNow().toISOString().split('T')[0]
  timeTravelTime.value = systemStore.getNow().toTimeString().split(' ')[0].substring(0, 5)
  // 更新当前时间字符串
  currentTimeString.value = systemStore.getNow().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// 处理日结
const handleDailySettle = () => {
  if (systemStore.isTodaySettled) return
  const result = systemStore.dailySettle()
  if (result.status !== 'PENDING') {
    settleResult.value = result
  }
}

// 获取结算状态文本
const getSettleStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    'CRASH': '底线宕机',
    'NORMAL': '正常完成',
    'CRIT': '超频暴击'
  }
  return statusMap[status] || status
}

// 时间更新计时器
const timeUpdateTimer = ref<number | null>(null)

onMounted(() => {
  // 初始化 Store
  systemStore.initStore()
  // 添加窗口大小变化监听
  window.addEventListener('resize', handleResize)
  // 检查是否有任务在进行中，如果有则开始计时器
  if (isTaskInProgress.value) {
    startTimer()
  }
  // 开始时间更新计时器，每秒更新一次
  timeUpdateTimer.value = window.setInterval(updateCurrentTime, 1000)
})

onBeforeUnmount(() => {
  // 移除窗口大小变化监听
  window.removeEventListener('resize', handleResize)
  // 停止计时器
  stopTimer()
  // 停止时间更新计时器
  if (timeUpdateTimer.value) {
    clearInterval(timeUpdateTimer.value)
    timeUpdateTimer.value = null
  }
})
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
