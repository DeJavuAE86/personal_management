<template>
  <div v-if="visible" class="fixed inset-0 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm z-9999">
    <div class="w-full max-w-md bg-white rounded-t-3xl md:rounded-3xl p-6 md:p-8 shadow-2xl transform transition-all pb-safe md:mx-4">
      <!-- 抽屉把手 -->
      <div class="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6 md:hidden"></div>
      <!-- 弹窗标题 -->
      <h3 class="text-2xl font-bold text-gray-900 mb-6 text-center">任务结算</h3>
      
      <!-- 任务信息 -->
      <div class="mb-8 p-6 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl">
        <h4 class="font-semibold text-gray-900">{{ task?.title }}</h4>
        <div class="flex items-center gap-4 mt-3">
          <div class="bg-white px-4 py-2 rounded-full shadow-sm">
            <span class="text-sm font-medium text-gray-700">基础分: 💰 {{ task?.baseScore }}</span>
          </div>
          <div class="text-gray-400">+</div>
          <div class="bg-white px-4 py-2 rounded-full shadow-sm">
            <span class="text-sm font-medium text-gray-700">绩效分: 💎 {{ calculatePerfScore() }}</span>
          </div>
        </div>
      </div>
      
      <!-- 动态内容 -->
      <div class="space-y-6">
        <!-- QUIZ 类型 -->
        <div v-if="task?.type === 'QUIZ'" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">实际耗时 (分钟)</label>
            <input 
              type="number" 
              v-model.number="formData.timeSpent" 
              class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50"
              min="1"
              max="180"
              placeholder="请输入耗时"
              readonly
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">正确率 (%)</label>
            <input 
              type="number" 
              v-model.number="formData.correctRate" 
              class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              min="0"
              max="100"
              placeholder="请输入正确率"
            />
          </div>
        </div>
        
        <!-- VIDEO 类型 -->
        <div v-else-if="task?.type === 'VIDEO'" class="space-y-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">专注度</label>
          <div class="space-y-3">
            <label class="flex items-center gap-4 p-4 border border-slate-200 rounded-xl cursor-pointer transition-all hover:bg-slate-50 hover:border-blue-200"
                  :class="{ 'border-blue-500 bg-blue-50': formData.focusLevel === 'A' }"
                  @click="formData.focusLevel = 'A'">
              <input type="radio" v-model="formData.focusLevel" value="A" class="hidden" />
              <span class="text-3xl">😎</span>
              <div class="flex-1">
                <div class="font-semibold text-gray-900">A级：全神贯注</div>
                <div class="text-sm text-gray-600">获得 100% 绩效分</div>
              </div>
            </label>
            <label class="flex items-center gap-4 p-4 border border-slate-200 rounded-xl cursor-pointer transition-all hover:bg-slate-50 hover:border-blue-200"
                  :class="{ 'border-blue-500 bg-blue-50': formData.focusLevel === 'B' }"
                  @click="formData.focusLevel = 'B'">
              <input type="radio" v-model="formData.focusLevel" value="B" class="hidden" />
              <span class="text-3xl">🤔</span>
              <div class="flex-1">
                <div class="font-semibold text-gray-900">B级：偶尔走神</div>
                <div class="text-sm text-gray-600">获得 50% 绩效分</div>
              </div>
            </label>
            <label class="flex items-center gap-4 p-4 border border-slate-200 rounded-xl cursor-pointer transition-all hover:bg-slate-50 hover:border-blue-200"
                  :class="{ 'border-blue-500 bg-blue-50': formData.focusLevel === 'C' }"
                  @click="formData.focusLevel = 'C'">
              <input type="radio" v-model="formData.focusLevel" value="C" class="hidden" />
              <span class="text-3xl">😴</span>
              <div class="flex-1">
                <div class="font-semibold text-gray-900">C级：纯属挂机</div>
                <div class="text-sm text-gray-600">获得 0 绩效分</div>
              </div>
            </label>
          </div>
        </div>
        
        <!-- SUMMARY 类型 -->
        <div v-else-if="task?.type === 'SUMMARY'" class="space-y-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">专注度</label>
          <div class="space-y-3">
            <label class="flex items-center gap-4 p-4 border border-slate-200 rounded-xl cursor-pointer transition-all hover:bg-slate-50 hover:border-blue-200"
                  :class="{ 'border-blue-500 bg-blue-50': formData.focusLevel === 'A' }"
                  @click="formData.focusLevel = 'A'">
              <input type="radio" v-model="formData.focusLevel" value="A" class="hidden" />
              <span class="text-3xl">😎</span>
              <div class="flex-1">
                <div class="font-semibold text-gray-900">A级：全神贯注</div>
                <div class="text-sm text-gray-600">获得 100% 绩效分</div>
              </div>
            </label>
            <label class="flex items-center gap-4 p-4 border border-slate-200 rounded-xl cursor-pointer transition-all hover:bg-slate-50 hover:border-blue-200"
                  :class="{ 'border-blue-500 bg-blue-50': formData.focusLevel === 'B' }"
                  @click="formData.focusLevel = 'B'">
              <input type="radio" v-model="formData.focusLevel" value="B" class="hidden" />
              <span class="text-3xl">🤔</span>
              <div class="flex-1">
                <div class="font-semibold text-gray-900">B级：偶尔走神</div>
                <div class="text-sm text-gray-600">获得 50% 绩效分</div>
              </div>
            </label>
            <label class="flex items-center gap-4 p-4 border border-slate-200 rounded-xl cursor-pointer transition-all hover:bg-slate-50 hover:border-blue-200"
                  :class="{ 'border-blue-500 bg-blue-50': formData.focusLevel === 'C' }"
                  @click="formData.focusLevel = 'C'">
              <input type="radio" v-model="formData.focusLevel" value="C" class="hidden" />
              <span class="text-3xl">😴</span>
              <div class="flex-1">
                <div class="font-semibold text-gray-900">C级：纯属挂机</div>
                <div class="text-sm text-gray-600">获得 0 绩效分</div>
              </div>
            </label>
          </div>
        </div>
      </div>
      
      <!-- 底部按钮 -->
      <div class="mt-8 flex gap-4">
        <button 
          class="flex-1 px-6 py-4 bg-slate-100 text-gray-800 rounded-xl font-medium hover:bg-slate-200 transition-all"
          @click="emit('close')"
        >
          取消
        </button>
        <button 
          class="flex-1 px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition-all transform hover:-translate-y-0.5"
          @click="handleConfirm"
        >
          确认结算并获取 💰{{ calculateTotalScore() }} 分
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  task: {
    type: Object,
    default: null
  }
})

// Emits
const emit = defineEmits(['close', 'confirm'])

// 表单数据
const formData = ref({
  timeSpent: 30,
  correctRate: 80,
  focusLevel: 'A'
})

// 监听任务变化，重置表单
watch(() => props.task, () => {
  formData.value = {
    timeSpent: props.task?.timeSpent !== undefined ? props.task.timeSpent : 30,
    correctRate: 80,
    focusLevel: 'A'
  }
}, { deep: true })

// 计算绩效分
const calculatePerfScore = () => {
  if (!props.task) return 0
  
  const { type, perfSettings } = props.task
  
  if (type === 'QUIZ') {
    const { correctRate, timeSpent } = formData.value
    
    // 检查是否达到第一档标准
    if (correctRate >= perfSettings.tier1.correctRate && timeSpent <= perfSettings.tier1.timeLimit) {
      return perfSettings.tier1.perfScore
    }
    // 检查是否达到第二档标准
    else if (correctRate >= perfSettings.tier2.correctRate && timeSpent <= perfSettings.tier2.timeLimit) {
      return perfSettings.tier2.perfScore
    }
    // 未达到标准，返回 0
    else {
      return 0
    }
  } else if (type === 'VIDEO') {
    const { focusLevel } = formData.value
    
    // 检查是否达到第一档标准
    if (focusLevel === perfSettings.tier1.focusLevel) {
      return perfSettings.tier1.perfScore
    }
    // 检查是否达到第二档标准
    else if (focusLevel === perfSettings.tier2.focusLevel) {
      return perfSettings.tier2.perfScore
    }
    // 未达到标准，返回 0
    else {
      return 0
    }
  } else if (type === 'SUMMARY') {
    const { focusLevel } = formData.value
    
    // 检查是否达到第一档标准
    if (focusLevel === perfSettings.tier1.focusLevel) {
      return perfSettings.tier1.perfScore
    }
    // 检查是否达到第二档标准
    else if (focusLevel === perfSettings.tier2.focusLevel) {
      return perfSettings.tier2.perfScore
    }
    // 未达到标准，返回 0
    else {
      return 0
    }
  }
  
  return 0
}

// 计算总分
const calculateTotalScore = () => {
  if (!props.task) return 0
  return props.task.baseScore + calculatePerfScore()
}

// 处理确认
const handleConfirm = () => {
  if (!props.task) return
  
  let actualPerfScore = 0
  let timeSpent = formData.value.timeSpent
  
  if (props.task.type === 'QUIZ') {
    const { correctRate } = formData.value
    const { perfSettings } = props.task
    
    // 检查是否达到第一档标准
    if (correctRate >= perfSettings.tier1.correctRate && timeSpent <= perfSettings.tier1.timeLimit) {
      actualPerfScore = perfSettings.tier1.perfScore
    }
    // 检查是否达到第二档标准
    else if (correctRate >= perfSettings.tier2.correctRate && timeSpent <= perfSettings.tier2.timeLimit) {
      actualPerfScore = perfSettings.tier2.perfScore
    }
    // 未达到标准，返回 0
    else {
      actualPerfScore = 0
    }
  } else if (props.task.type === 'VIDEO') {
    const { focusLevel } = formData.value
    const { perfSettings } = props.task
    
    // 检查是否达到第一档标准
    if (focusLevel === perfSettings.tier1.focusLevel) {
      actualPerfScore = perfSettings.tier1.perfScore
    }
    // 检查是否达到第二档标准
    else if (focusLevel === perfSettings.tier2.focusLevel) {
      actualPerfScore = perfSettings.tier2.perfScore
    }
    // 未达到标准，返回 0
    else {
      actualPerfScore = 0
    }
  } else if (props.task.type === 'SUMMARY') {
    const { focusLevel } = formData.value
    const { perfSettings } = props.task
    
    // 检查是否达到第一档标准
    if (focusLevel === perfSettings.tier1.focusLevel) {
      actualPerfScore = perfSettings.tier1.perfScore
    }
    // 检查是否达到第二档标准
    else if (focusLevel === perfSettings.tier2.focusLevel) {
      actualPerfScore = perfSettings.tier2.perfScore
    }
    // 未达到标准，返回 0
    else {
      actualPerfScore = 0
    }
  }
  
  emit('confirm', {
    taskId: props.task.id,
    timeSpent,
    actualPerfScore
  })
  
  // 关闭弹窗
  emit('close')
}
</script>

<script lang="ts">
export default {
  name: 'SettleModal'
}
</script>
