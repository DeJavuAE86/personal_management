<template>
  <div class="space-y-6 md:space-y-8 pb-24 md:pb-8">
    <h1 class="text-2xl md:text-3xl font-bold text-gray-900">周末规划</h1>
    
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 xl:gap-8 w-full">
      <!-- 左栏：NPC 悬赏发布区 -->
      <div class="bg-white rounded-2xl shadow-lg p-6 lg:p-8 w-full h-full" :class="{ 'hidden xl:block': isSaturday }">
        <div class="flex items-center gap-3 mb-4 lg:mb-6">
          <div class="text-xl lg:text-2xl">📅</div>
          <h2 class="text-xl lg:text-2xl font-semibold text-gray-900">NPC 悬赏发布</h2>
        </div>
        
        <form @submit.prevent="handleSubmitTask" class="space-y-6">
          <!-- 任务名称 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">任务名称</label>
            <input 
              type="text" 
              v-model="taskForm.title"
              class="w-full h-12 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="请输入任务名称"
              required
            />
          </div>
          
          <!-- 归属模块 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">归属模块</label>
            <select 
              v-model="taskForm.moduleId"
              class="w-full h-12 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            >
              <option value="">请选择模块</option>
              <option value="c1">政治理论</option>
              <option value="c2">常识判断</option>
              <option value="c3">言语理解与表达</option>
              <option value="c4">数量关系</option>
              <option value="c5">判断推理</option>
              <option value="c6">资料分析</option>
            </select>
          </div>
          
          <!-- 任务类型 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">任务类型</label>
            <select 
              v-model="taskForm.type"
              class="w-full h-12 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            >
              <option value="">请选择任务类型</option>
              <option value="QUIZ">做题</option>
              <option value="VIDEO">看课</option>
              <option value="SUMMARY">总结</option>
            </select>
          </div>
          
          <!-- 任务容量 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">任务容量</label>
            <select 
              v-model="taskForm.capacity"
              class="w-full h-12 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            >
              <option value="">请选择任务容量</option>
              <option value="MIN">MIN 保底</option>
              <option value="STANDARD">STANDARD 核心</option>
              <option value="EXTRA">EXTRA 超频</option>
            </select>
          </div>
          
          <!-- 基础悬赏分 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">基础悬赏分</label>
            <input 
              type="number" 
              v-model.number="taskForm.baseScore"
              class="w-full h-12 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              min="1"
              max="100"
              required
            />
          </div>
          
          <!-- 任务绩效分设置 -->
          <div v-if="taskForm.type" class="space-y-6">
            <div class="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 class="text-sm font-semibold text-blue-800 mb-3">{{ getTaskTypeText(taskForm.type) }}任务设置</h4>
              
              <!-- 第一档（最高绩效分） -->
              <div class="space-y-4">
                <h5 class="text-sm font-medium text-gray-700">第一档（最高绩效分）</h5>
                <div class="grid grid-cols-3 gap-4">
                  <!-- 做题任务的用时限制 -->
                  <div v-if="taskForm.type === 'QUIZ'">
                    <label class="block text-xs font-medium text-gray-600 mb-1">用时限制 (分钟)</label>
                    <input 
                      type="number" 
                      v-model.number="taskForm.perfSettings.tier1.timeLimit"
                      class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      min="1"
                      max="180"
                      required
                    />
                  </div>
                  <!-- 做题任务的正确率 -->
                  <div v-if="taskForm.type === 'QUIZ'">
                    <label class="block text-xs font-medium text-gray-600 mb-1">正确率 (%)</label>
                    <input 
                      type="number" 
                      v-model.number="taskForm.perfSettings.tier1.correctRate"
                      class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      min="0"
                      max="100"
                      required
                    />
                  </div>
                  <!-- 看课任务的专注度（默认固定） -->
                  <div v-if="taskForm.type === 'VIDEO'" class="col-span-2">
                    <label class="block text-xs font-medium text-gray-600 mb-1">专注度</label>
                    <div class="w-full px-3 py-2 border border-slate-200 rounded-lg bg-gray-50">
                      A级：全神贯注
                    </div>
                  </div>
                  <!-- 总结任务的专注度（默认固定） -->
                  <div v-if="taskForm.type === 'SUMMARY'" class="col-span-2">
                    <label class="block text-xs font-medium text-gray-600 mb-1">专注度</label>
                    <div class="w-full px-3 py-2 border border-slate-200 rounded-lg bg-gray-50">
                      A级：全神贯注
                    </div>
                  </div>
                  <!-- 绩效分 -->
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">绩效分</label>
                    <input 
                      type="number" 
                      v-model.number="taskForm.perfSettings.tier1.perfScore"
                      class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      min="0"
                      max="50"
                      required
                    />
                  </div>
                </div>
              </div>
              
              <!-- 第二档（标准绩效分） -->
              <div class="space-y-4 mt-4">
                <h5 class="text-sm font-medium text-gray-700">第二档（标准绩效分）</h5>
                <div class="grid grid-cols-3 gap-4">
                  <!-- 做题任务的用时限制 -->
                  <div v-if="taskForm.type === 'QUIZ'">
                    <label class="block text-xs font-medium text-gray-600 mb-1">用时限制 (分钟)</label>
                    <input 
                      type="number" 
                      v-model.number="taskForm.perfSettings.tier2.timeLimit"
                      class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      min="1"
                      max="180"
                      required
                    />
                  </div>
                  <!-- 做题任务的正确率 -->
                  <div v-if="taskForm.type === 'QUIZ'">
                    <label class="block text-xs font-medium text-gray-600 mb-1">正确率 (%)</label>
                    <input 
                      type="number" 
                      v-model.number="taskForm.perfSettings.tier2.correctRate"
                      class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      min="0"
                      max="100"
                      required
                    />
                  </div>
                  <!-- 看课任务的专注度（默认固定） -->
                  <div v-if="taskForm.type === 'VIDEO'" class="col-span-2">
                    <label class="block text-xs font-medium text-gray-600 mb-1">专注度</label>
                    <div class="w-full px-3 py-2 border border-slate-200 rounded-lg bg-gray-50">
                      B级：偶尔走神
                    </div>
                  </div>
                  <!-- 总结任务的专注度（默认固定） -->
                  <div v-if="taskForm.type === 'SUMMARY'" class="col-span-2">
                    <label class="block text-xs font-medium text-gray-600 mb-1">专注度</label>
                    <div class="w-full px-3 py-2 border border-slate-200 rounded-lg bg-gray-50">
                      B级：偶尔走神
                    </div>
                  </div>
                  <!-- 绩效分 -->
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">绩效分</label>
                    <input 
                      type="number" 
                      v-model.number="taskForm.perfSettings.tier2.perfScore"
                      class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      min="0"
                      max="50"
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div class="mt-3 text-xs text-gray-600">
                <p>第三档：未达到标准档位，绩效分默认为 0</p>
              </div>
            </div>
          </div>
          
          <!-- 计划日期 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">计划执行日期</label>
            <select 
              v-model="taskForm.plannedDate"
              class="w-full h-12 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            >
              <option value="">请选择日期</option>
              <option v-for="option in dateOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
          
          <!-- 工作日免费次数提示 -->
          <div v-if="isWorkday" class="bg-green-100 border border-green-400 rounded-xl p-4 mb-4">
            <div class="flex items-center gap-2 text-green-600 font-medium">
              <span>🎁</span>
              <span>每日免费次数：{{ systemStore.dailyFreeTaskAdditions }}/2 次</span>
            </div>
          </div>
          
          <!-- 工作日违约金警告 -->
          <div v-if="isWorkday && systemStore.dailyFreeTaskAdditions <= 0" class="bg-red-100 border border-red-400 rounded-xl p-4 mb-4">
            <div class="flex items-center gap-2 text-red-600 font-medium">
              <span>🚨</span>
              <span>违约警告：工作日临时追加计划，每次发布将扣除 2 分违约金！</span>
            </div>
          </div>
          
          <!-- 提交按钮 -->
          <button 
            type="submit"
            class="w-full py-3 lg:py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold text-sm lg:text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
          >
            发布悬赏至任务板
          </button>
        </form>
      </div>
      
      <!-- 右栏：周六复盘与清算中心 -->
      <div class="bg-gradient-to-br from-gray-900 to-indigo-900 rounded-2xl shadow-lg p-6 lg:p-8 text-white w-full h-full" :class="{ 'hidden xl:block': !isSaturday }">
        <div class="flex items-center gap-3 mb-4 lg:mb-6">
          <div class="text-xl lg:text-2xl">🏆</div>
          <h2 class="text-xl lg:text-2xl font-semibold">周六复盘与清算中心</h2>
        </div>
        
        <!-- 本周积分 -->
        <div class="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6">
          <h3 class="text-lg font-medium mb-3">本周积累</h3>
          <div class="text-4xl font-bold text-yellow-400">
            {{ systemStore.totalScore }}
          </div>
          <div class="text-gray-300 text-sm mt-1">总积分</div>
        </div>
        
        <!-- 复盘文本框 -->
        <div class="mb-6 relative">
          <label class="block text-sm font-medium text-gray-300 mb-2">本周反思</label>
          <textarea 
            v-model="reviewText"
            class="w-full px-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-white"
            rows="6"
            placeholder="请在这里输入本周执行情况的反思，写完即可解锁周末盛典奖励..."
            :disabled="!isSaturday"
          ></textarea>
          <div class="text-right text-gray-400 text-sm mt-2">
            {{ reviewText.length }} / 10 字
          </div>
          
          <!-- 周六复盘锁 -->
          <div v-if="!isSaturday" class="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <div class="text-center text-white">
              <div class="text-4xl mb-4">🔒</div>
              <div class="text-xl font-bold">纪律锁</div>
              <div class="mt-2">复盘清算通道仅在周六开放！</div>
            </div>
          </div>
        </div>
        
        <!-- 解锁按钮 -->
        <button 
          class="w-full py-3 lg:py-4 rounded-xl font-bold text-sm lg:text-lg transition-all transform hover:-translate-y-1"
          :class="{
            'bg-gray-600 text-gray-300 cursor-not-allowed': reviewText.length < 10 || !isSaturday,
            'bg-gradient-to-r from-yellow-400 to-amber-500 text-gray-900 shadow-lg hover:shadow-xl animate-pulse': reviewText.length >= 10 && isSaturday
          }"
          :disabled="reviewText.length < 10 || !isSaturday"
          @click="handleSubmitReview"
        >
          {{ !isSaturday ? '复盘清算通道仅在周六开放' : reviewText.length < 10 ? '请输入至少 10 字的反思' : '提交复盘，解除周末封印 🔓' }}
        </button>
      </div>
    </div>
    
    <!-- 待执行任务审查区 -->
    <div class="bg-white rounded-2xl shadow-lg p-6 lg:p-8" :class="{ 'hidden xl:block': isSaturday }">
      <div class="flex items-center gap-3 mb-4 lg:mb-6">
        <div class="text-xl lg:text-2xl">📋</div>
        <h2 class="text-xl lg:text-2xl font-semibold text-gray-900">待执行任务审查区</h2>
      </div>
      
      <!-- 战时死锁警告 -->
      <div v-if="isWorkday" class="bg-red-100 border border-red-400 rounded-xl p-4 mb-6">
        <div class="flex items-center gap-2 text-red-600 font-medium">
          <span>🔒</span>
          <span>战时死锁：工作日执行期已开启，所有历史任务禁止删除、禁止篡改！</span>
        </div>
      </div>
      
      <!-- 任务列表 -->
      <div v-if="tasksByDate.length > 0" class="space-y-6">
        <div v-for="[date, tasks] in tasksByDate" :key="date" class="border border-slate-200 rounded-xl p-4">
          <h3 class="text-lg font-semibold text-gray-900 mb-3">{{ date }} {{ getDayName(new Date(date)) }}</h3>
          <div class="space-y-3">
            <div v-for="task in tasks" :key="task.id" class="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div class="flex-1">
                <div class="font-medium text-gray-900">{{ task.title }}</div>
                <div class="text-sm text-gray-600">
                  {{ task.type === 'QUIZ' ? '做题' : task.type === 'VIDEO' ? '看课' : '总结' }} · {{ task.capacity === 'MIN' ? 'MIN 保底' : task.capacity === 'STANDARD' ? 'STANDARD 核心' : 'EXTRA 超频' }}
                </div>
                <div class="text-sm text-yellow-600 font-medium mt-1">
                  悬赏分：{{ task.baseScore }} + {{ Math.max(task.perfSettings?.tier1?.perfScore || 0, task.perfSettings?.tier2?.perfScore || 0) }}
                </div>
              </div>
              <button 
                class="p-2 text-red-600 hover:bg-red-100 rounded-full transition-all"
                @click="handleDeleteTask(task.id)"
                title="删除任务"
              >
                <Trash2 class="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 空状态 -->
      <div v-else class="text-center py-12 text-gray-500">
        <div class="text-4xl mb-4">📝</div>
        <div class="text-lg">暂无待执行任务</div>
        <div class="mt-2">开始规划你的任务吧！</div>
      </div>
    </div>
    
    <!-- 成功提示 -->
    <div v-if="showSuccessToast" class="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg z-50 animate-fade-in">
      <div class="flex items-center gap-2">
        <Check class="w-5 h-5" />
        <span>{{ successMessage }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSystemStore } from '../store'
import { Check, Trash2 } from 'lucide-vue-next'
import { playWarning } from '../utils/notifier'

const systemStore = useSystemStore()

// 任务表单
const taskForm = ref({
  title: '',
  moduleId: '',
  type: '',
  capacity: '',
  baseScore: 3,
  plannedDate: '',
  // 任务绩效分设置
  perfSettings: {
    // 第一档（最高绩效分）
    tier1: {
      timeLimit: 30, // 分钟（做题任务）
      correctRate: 80, // 百分比（做题任务）
      focusLevel: 'A', // 专注度（看课任务）
      perfScore: 2 // 绩效分
    },
    // 第二档（标准绩效分）
    tier2: {
      timeLimit: 45, // 分钟（做题任务）
      correctRate: 60, // 百分比（做题任务）
      focusLevel: 'B', // 专注度（看课任务）
      perfScore: 1 // 绩效分
    }
  }
})

// 辅助函数：格式化日期为 YYYY-MM-DD
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0]
}

// 辅助函数：获取星期几的中文名称
const getDayName = (date: Date): string => {
  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return dayNames[date.getDay()]
}

// 计算属性：生成日期选项
const dateOptions = computed(() => {
  const options = []
  const today = new Date()
  const currentDay = systemStore.currentSystemDay
  
  if (currentDay === 6 || currentDay === 0) { // 周末模式
    // 生成下周一到下周六的日期
    const nextMonday = new Date(today)
    nextMonday.setDate(today.getDate() + (8 - today.getDay()) % 7)
    
    for (let i = 0; i < 6; i++) {
      const date = new Date(nextMonday)
      date.setDate(nextMonday.getDate() + i)
      options.push({
        value: formatDate(date),
        label: `${formatDate(date)} ${getDayName(date)}`
      })
    }
  } else { // 工作日模式
    // 生成本周今天到本周六的日期
    const saturday = new Date(today)
    saturday.setDate(today.getDate() + (6 - today.getDay() + 7) % 7)
    
    let currentDate = new Date(today)
    while (currentDate <= saturday) {
      options.push({
        value: formatDate(currentDate),
        label: `${formatDate(currentDate)} ${getDayName(currentDate)}`
      })
      currentDate.setDate(currentDate.getDate() + 1)
    }
  }
  
  return options
})

// 计算属性：是否为工作日
const isWorkday = computed(() => {
  const currentDay = systemStore.currentSystemDay
  return currentDay >= 1 && currentDay <= 5
})

// 计算属性：是否为周六
const isSaturday = computed(() => {
  return systemStore.currentSystemDay === 6
})

// 辅助函数：获取任务类型的中文名称
const getTaskTypeText = (type: string): string => {
  switch (type) {
    case 'QUIZ': return '做题'
    case 'VIDEO': return '看课'
    case 'SUMMARY': return '总结'
    default: return ''
  }
}

// 计算属性：待执行任务（未完成的任务）
const pendingTasks = computed(() => {
  return systemStore.allTasks.filter(task => task.status !== 'DONE' && task.status !== 'VOID')
})

// 计算属性：按日期分组的待执行任务
const tasksByDate = computed(() => {
  const grouped: Record<string, any[]> = {}
  
  pendingTasks.value.forEach(task => {
    if (!grouped[task.plannedDate]) {
      grouped[task.plannedDate] = []
    }
    grouped[task.plannedDate].push(task)
  })
  
  // 按日期排序
  return Object.entries(grouped).sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
})

// 复盘文本
const reviewText = ref('')

// 成功提示
const showSuccessToast = ref(false)
const successMessage = ref('')

// 处理任务提交
const handleSubmitTask = () => {
  // 验证表单
  if (!taskForm.value.title || !taskForm.value.moduleId || !taskForm.value.type || !taskForm.value.capacity || !taskForm.value.plannedDate) {
    alert('请填写所有必填项')
    return
  }
  
  // 工作日违约金惩罚
  let isPenaltyDeducted = false
  let isUsingFreeAddition = false
  
  if (isWorkday.value) {
    // 优先使用免费次数
    if (systemStore.dailyFreeTaskAdditions > 0) {
      isUsingFreeAddition = true
    } else {
      // 免费次数不足，扣除违约金
      if (systemStore.totalScore < 2) {
        alert('余额不足，禁止发布任务！')
        return
      }
      // 扣除违约金
      systemStore.totalScore -= 2
      isPenaltyDeducted = true
      // 播放警告音效
      playWarning()
    }
  }
  
  // 添加任务
  systemStore.addTask({
    title: taskForm.value.title,
    moduleId: taskForm.value.moduleId,
    type: taskForm.value.type as 'QUIZ' | 'VIDEO' | 'SUMMARY',
    capacity: taskForm.value.capacity as 'MIN' | 'STANDARD' | 'EXTRA',
    baseScore: taskForm.value.baseScore,
    plannedDate: taskForm.value.plannedDate,
    // 传递任务绩效分设置
    perfSettings: taskForm.value.perfSettings
  }, isPenaltyDeducted, isUsingFreeAddition)
  
  // 清空表单
  taskForm.value = {
    title: '',
    moduleId: '',
    type: '',
    capacity: '',
    baseScore: 3,
    plannedDate: '',
    // 重置任务绩效分设置
    perfSettings: {
      tier1: {
        timeLimit: 30,
        correctRate: 80,
        focusLevel: 'A',
        perfScore: 2
      },
      tier2: {
        timeLimit: 45,
        correctRate: 60,
        focusLevel: 'B',
        perfScore: 1
      }
    }
  }
  
  // 显示成功提示
  if (isWorkday.value) {
    if (isUsingFreeAddition) {
      successMessage.value = '任务发布成功！使用了 1 次免费添加机会'
    } else {
      successMessage.value = '任务发布成功！已扣除 2 分违约金'
    }
  } else {
    successMessage.value = '任务发布成功！'
  }
  showSuccessToast.value = true
  
  // 3秒后隐藏提示
  setTimeout(() => {
    showSuccessToast.value = false
  }, 3000)
}

// 处理任务删除
const handleDeleteTask = (taskId: string) => {
  try {
    const task = systemStore.allTasks.find(t => t.id === taskId)
    if (!task) return
    
    // 检查是否为待执行任务
    if (task.status === 'DONE' || task.status === 'VOID') {
      alert('只能删除待执行任务！')
      return
    }
    
    // 执行日删除规则：只能删除当天添加的任务
    if (isWorkday.value) {
      if (task.createdDate !== systemStore.currentDate) {
        alert('执行日只能删除当天添加的任务！')
        return
      }
    }
    
    if (confirm('确定要删除这个任务吗？删除后无法恢复！')) {
      systemStore.removeTask(taskId)
      successMessage.value = '任务删除成功！'
      showSuccessToast.value = true
      setTimeout(() => {
        showSuccessToast.value = false
      }, 3000)
    }
  } catch (error) {
    console.error('删除任务失败:', error)
    alert('删除任务失败，请稍后重试')
  }
}

// 处理复盘提交
const handleSubmitReview = () => {
  if (reviewText.value.length < 10) return
  
  // 提交复盘
  systemStore.submitWeeklyReview(reviewText.value)
  
  // 重置复盘文本
  reviewText.value = ''
  
  // 显示成功提示
  successMessage.value = '封印解除！快去兑换大厅享受周末吧！'
  showSuccessToast.value = true
  
  // 3秒后隐藏提示
  setTimeout(() => {
    showSuccessToast.value = false
  }, 3000)
  
  // 播放撒花特效
  playConfetti()
}

// 播放撒花特效
const playConfetti = () => {
  // 简单的撒花动画效果
  const confettiCount = 100
  const confettiColors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722']
  
  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div')
    confetti.style.position = 'fixed'
    confetti.style.top = '-10px'
    confetti.style.left = Math.random() * 100 + '%'
    confetti.style.width = Math.random() * 10 + 5 + 'px'
    confetti.style.height = Math.random() * 10 + 5 + 'px'
    confetti.style.backgroundColor = confettiColors[Math.floor(Math.random() * confettiColors.length)]
    confetti.style.borderRadius = '50%'
    confetti.style.opacity = '0.7'
    confetti.style.zIndex = '9999'
    confetti.style.animation = 'fall ' + (Math.random() * 3 + 2) + 's linear'
    
    document.body.appendChild(confetti)
    
    setTimeout(() => {
      confetti.remove()
    }, 5000)
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

@keyframes fall {
  0% {
    transform: translateY(-10px) rotate(0deg);
    opacity: 0.7;
  }
  100% {
    transform: translateY(100vh) rotate(360deg);
    opacity: 0;
  }
}
</style>