<template>
  <div class="bg-white rounded-2xl shadow-md p-6 transition-all hover:shadow-xl hover:-translate-y-1 relative" :class="{ 'opacity-50': task.status === 'VOID' }">
    <!-- 容量标识 -->
    <div v-if="task.capacity === 'MIN'" class="absolute top-4 right-4 bg-rose-100 text-rose-700 text-xs px-3 py-1.5 rounded-full font-medium">
      保底
    </div>
    <div v-else-if="task.capacity === 'EXTRA'" class="absolute top-4 right-4 bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white text-xs px-3 py-1.5 rounded-full font-medium">
      超频
    </div>
    
    <!-- 任务状态指示器 -->
    <div v-if="task.status === 'DOING'" class="absolute top-4 left-4 flex items-center gap-1 text-sm text-yellow-600">
      <div class="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
      <span>Doing...</span>
    </div>
    
    <!-- 实时计时器 -->
    <div v-if="task.status === 'DOING' || task.status === 'PAUSED'" class="absolute bottom-4 right-4 flex items-center gap-1 text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
      <Clock class="w-3 h-3" />
      <span>{{ formattedTime }}</span>
    </div>
    
    <!-- 任务标题 -->
    <h3 class="font-semibold text-gray-900 text-lg mb-4">{{ task.title }}</h3>
    
    <!-- 任务信息 -->
    <div class="flex gap-3 mb-6">
      <!-- 模块名称 Badge -->
      <span class="px-3 py-1.5 bg-slate-100 text-gray-700 text-xs rounded-full font-medium">
        {{ getModuleName(task.moduleId) }}
      </span>
      <!-- 任务类型 Badge -->
      <span 
        class="px-3 py-1.5 text-xs rounded-full font-medium"
        :class="{
          'bg-green-100 text-green-700': task.type === 'QUIZ',
          'bg-blue-100 text-blue-700': task.type === 'VIDEO',
          'bg-purple-100 text-purple-700': task.type === 'SUMMARY'
        }"
      >
        {{ getTaskTypeText(task.type) }}
      </span>
    </div>
    
    <!-- 底部信息 -->
    <div class="flex flex-col gap-4">
      <!-- 悬赏金额 -->
      <div class="flex items-center gap-3">
        <div class="bg-yellow-50 px-3 py-2 rounded-full">
          <span class="text-sm font-medium text-yellow-700">💰 {{ task.baseScore }}</span>
        </div>
        <div class="text-gray-400">+</div>
        <div class="bg-blue-50 px-3 py-2 rounded-full">
          <span class="text-sm font-medium text-blue-700">💎 {{ task.targetPerfScore }}</span>
        </div>
      </div>
      
      <!-- 任务操作按钮 -->
      <div class="flex gap-2">
        <!-- TODO 状态 -->
        <button 
          v-if="task.status === 'TODO'"
          class="flex-1 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
          @click="emit('start', task.id)"
        >
          <span>▶</span>
          <span>开始</span>
        </button>
        
        <!-- DOING 状态 -->
        <template v-else-if="task.status === 'DOING'">
          <button 
            class="flex-1 py-3 bg-yellow-500 text-white rounded-xl font-medium hover:bg-yellow-600 transition-colors flex items-center justify-center gap-2"
            @click="emit('pause', task.id)"
            :title="`还剩 ${2 - task.pauseCount} 次机会`"
          >
            <span>⏸</span>
            <span>暂停</span>
          </button>
          <button 
            class="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
            @click="emit('end', task.id)"
          >
            <span>⏹</span>
            <span>结束并结算</span>
          </button>
        </template>
        
        <!-- PAUSED 状态 -->
        <template v-else-if="task.status === 'PAUSED'">
          <button 
            class="flex-1 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
            @click="emit('resume', task.id)"
          >
            <span>▶</span>
            <span>继续</span>
          </button>
          <button 
            class="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
            @click="emit('end', task.id)"
          >
            <span>⏹</span>
            <span>结束</span>
          </button>
        </template>
        
        <!-- DONE 状态 -->
        <button 
          v-else-if="task.status === 'DONE'"
          class="flex-1 py-3 bg-gray-400 text-white rounded-xl font-medium cursor-not-allowed flex items-center justify-center gap-2"
          disabled
        >
          <span>✅</span>
          <span>已完成</span>
        </button>
        
        <!-- VOID 状态 -->
        <button 
          v-else-if="task.status === 'VOID'"
          class="flex-1 py-3 bg-red-700 text-white rounded-xl font-medium cursor-not-allowed flex items-center justify-center gap-2"
          disabled
        >
          <span>❌</span>
          <span>任务已作废</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Clock } from 'lucide-vue-next'
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'

const props = defineProps({
  task: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['start', 'pause', 'resume', 'end'])

// 计时器相关
const timerInterval = ref<number | null>(null)
const currentTime = ref(Date.now())

// 计算当前任务的总耗时
const totalElapsedTime = computed(() => {
  if (props.task.status === 'DOING' && props.task.lastStartTime) {
    return props.task.accumulatedTime + (currentTime.value - props.task.lastStartTime)
  }
  return props.task.accumulatedTime
})

// 格式化时间显示
const formattedTime = computed(() => {
  const ms = totalElapsedTime.value
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (hours > 0) {
    const remainingMinutes = minutes % 60
    return `${hours}小时${remainingMinutes}分钟`
  } else if (minutes > 0) {
    const remainingSeconds = seconds % 60
    return `${minutes}分钟${remainingSeconds}秒`
  } else {
    return `${seconds}秒`
  }
})

// 开始计时器
const startTimer = () => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
  }
  // 立即更新一次时间
  currentTime.value = Date.now()
  // 然后每秒更新一次
  timerInterval.value = window.setInterval(() => {
    currentTime.value = Date.now()
  }, 1000)
}

// 停止计时器
const stopTimer = () => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }
}

// 监听任务状态变化
watch(() => props.task.status, (newStatus) => {
  if (newStatus === 'DOING') {
    startTimer()
  } else {
    stopTimer()
  }
}, { immediate: true })

// 组件挂载时
onMounted(() => {
  if (props.task.status === 'DOING') {
    startTimer()
  }
})

// 组件卸载时
onUnmounted(() => {
  stopTimer()
})

const getModuleName = (moduleId: string) => {
  const moduleMap: Record<string, string> = {
    'c1': '政治理论',
    'c2': '常识判断',
    'c3': '言语理解与表达',
    'c4': '数量关系',
    'c5': '判断推理',
    'c6': '资料分析'
  }
  return moduleMap[moduleId] || moduleId
}

const getTaskTypeText = (type: string) => {
  const typeMap: Record<string, string> = {
    'QUIZ': '做题',
    'VIDEO': '看课',
    'SUMMARY': '总结'
  }
  return typeMap[type] || type
}
</script>

<script lang="ts">
export default {
  name: 'TaskCard'
}
</script>
