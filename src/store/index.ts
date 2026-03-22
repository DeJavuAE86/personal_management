import { defineStore } from 'pinia'
import { ref, computed, nextTick, watch } from 'vue'
import type { Task, DailyRecord, TaskStatus } from '@/types'
import { getCurrentSlot, getNextSlot, getTimeToNextSlot, WORKDAY_SCHEDULE, SUNDAY_SCHEDULE } from '@/config/schedule'
import { notify } from '@/utils/notifier'
import supabase from '@/utils/supabase'

// 生成唯一ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 生成同步密钥
const generateSyncKey = (): string => {
  return Math.random().toString(36).substring(2, 14)
}

// 格式化日期为 YYYY-MM-DD
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0]
}

/**
 * 系统状态管理 Store
 * 使用 Setup Store 语法（组合式 API）
 */
export const useSystemStore = defineStore('system', () => {
  
  // ==================== 状态定义 ====================
  
  // 总积分
  const totalScore = ref(0)
  
  // 所有任务列表
  const allTasks = ref<Task[]>([])
  
  // 历史记录
  const historyRecords = ref<DailyRecord[]>([])
  
  // 周末解锁状态
  const isWeekendUnlocked = ref(false)
  
  // 今日结算状态
  const isTodaySettled = ref(false)
  
  // 模拟星期几（用于测试时空锁）
  const mockDay = ref<'REAL' | 'SATURDAY' | 'SUNDAY'>('REAL')
  
  // 时间偏移量（毫秒），默认0表示使用真实时间
  const timeOffset = ref(0)
  
  // 系统的唯一时间源，所有业务代码获取当前时间必须调用此方法
  function getNow() { return new Date(Date.now() + timeOffset.value) }
  
  // 响应式时间变量，用于触发作息状态的重新计算
  const currentTime = ref(getNow())
  
  // 当前日期
  const currentDate = ref(formatDate(getNow()))
  
  // 每日习惯状态
  const dailyHabits = ref({
    earlyRise: { completed: false, score: 1 },
    phoneIsolation: { completed: false, score: 2 }
  })
  
  // 同步相关状态
  const syncKey = ref('')
  const syncStatus = ref<'OFFLINE' | 'SYNCING' | 'CONNECTED'>('OFFLINE')
  
  // 防死循环锁
  let isReceivingCloudUpdate = false
  // Supabase Channel 实例
  let syncChannel: any = null
  // 同步超时计时器
  let syncTimeout: any = null
  
  // ==================== 计算属性 ====================
  
  // 计算当前系统星期几（0-6，0 为周日）
  const currentSystemDay = computed(() => {
    if (mockDay.value === 'SATURDAY') return 6
    if (mockDay.value === 'SUNDAY') return 0
    return currentTime.value.getDay()
  })
  
  // 更新当前时间
  const updateCurrentTime = () => {
    currentTime.value = getNow()
  }
  
  // 穿越到指定日期时间
  const jumpToDateTime = (targetDateStr: string, targetTimeStr: string) => {
    const [year, month, day] = targetDateStr.split('-').map(Number)
    const [hours, minutes] = targetTimeStr.split(':').map(Number)
    const targetDate = new Date(year, month - 1, day, hours, minutes, 0, 0)
    const targetTimestamp = targetDate.getTime()
    timeOffset.value = targetTimestamp - Date.now()
    currentTime.value = getNow()
  }
  
  // 重置为真实时间
  const resetRealTime = () => {
    timeOffset.value = 0
    currentTime.value = getNow()
  }
  
  // 计算当前作息状态
  const currentScheduleStatus = computed(() => {
    const dayOfWeek = currentSystemDay.value
    
    // 周六特殊处理 - 状态驱动
    if (dayOfWeek === 6) {
      if (isWeekendUnlocked.value) {
        // 已解锁周末狂欢
        const currentSlot = {
          name: '🎉 封印解除：周末狂欢',
          type: 'REWARD' as const,
          startTime: '现在',
          endTime: '周日晚'
        }
        return {
          currentSlot,
          nextSlot: null,
          timeToNextSlot: 0
        }
      } else {
        // 未解锁 - 自由扫尾与周度复盘
        const currentSlot = {
          name: '🎯 自由扫尾与周度复盘',
          type: 'REVIEW' as const,
          startTime: '随时',
          endTime: '完成复盘为止'
        }
        return {
          currentSlot,
          nextSlot: null,
          timeToNextSlot: 0
        }
      }
    }
    
    // 工作日（周一至周五）
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      const currentSlot = getCurrentSlot(currentTime.value, WORKDAY_SCHEDULE)
      const nextSlot = getNextSlot(currentTime.value, WORKDAY_SCHEDULE)
      const timeToNextSlot = nextSlot ? getTimeToNextSlot(currentTime.value, nextSlot) : 0
      
      return {
        currentSlot,
        nextSlot,
        timeToNextSlot
      }
    }
    
    // 周日
    if (dayOfWeek === 0) {
      const currentSlot = getCurrentSlot(currentTime.value, SUNDAY_SCHEDULE)
      const nextSlot = getNextSlot(currentTime.value, SUNDAY_SCHEDULE)
      const timeToNextSlot = nextSlot ? getTimeToNextSlot(currentTime.value, nextSlot) : 0
      
      return {
        currentSlot,
        nextSlot,
        timeToNextSlot
      }
    }
    
    // 默认情况（不应该发生）
    return {
      currentSlot: null,
      nextSlot: null,
      timeToNextSlot: 0
    }
  })
  
  // 计算今日任务
  const currentDayTasks = computed(() => {
    return allTasks.value.filter(task => task.plannedDate === currentDate.value)
  })
  
  // 计算今日已完成的任务数
  const completedTasksCount = computed(() => {
    return currentDayTasks.value.filter(task => task.status === 'DONE').length
  })
  
  // 计算今日基础分
  const todayBaseScore = computed(() => {
    return currentDayTasks.value
      .filter(task => task.status === 'DONE')
      .reduce((sum, task) => sum + task.baseScore, 0)
  })
  
  // 计算今日绩效分
  const todayPerfScore = computed(() => {
    return currentDayTasks.value
      .filter(task => task.status === 'DONE')
      .reduce((sum, task) => sum + task.actualPerfScore, 0)
  })
  
  // 计算今日已赚取的积分（实时）
  const todayEarnedSoFar = computed(() => {
    return currentDayTasks.value
      .filter(task => task.status === 'DONE')
      .reduce((sum, task) => sum + task.baseScore + task.actualPerfScore, 0)
  })
  
  // 判断是否触发超频暴击
  const isCritTriggered = computed(() => {
    // 检查是否所有 STANDARD 任务都已完成
    const standardTasks = currentDayTasks.value.filter(task => task.capacity === 'STANDARD')
    const allStandardCompleted = standardTasks.length > 0 && standardTasks.every(task => task.status === 'DONE')
    
    // 检查是否至少完成了一个 EXTRA 任务
    const extraTasksCompleted = currentDayTasks.value.some(task => task.capacity === 'EXTRA' && task.status === 'DONE')
    
    return allStandardCompleted && extraTasksCompleted
  })
  
  // 判断是否触发底线宕机
  const isCrashTriggered = computed(() => {
    // 检查是否有 MIN 任务未完成或变为 VOID
    const minTasks = currentDayTasks.value.filter(task => task.capacity === 'MIN')
    const anyMinNotCompleted = minTasks.length > 0 && minTasks.some(task => task.status !== 'DONE')
    
    return anyMinNotCompleted
  })
  
  // ==================== 核心动作 ====================
  
  /**
   * 初始化 Store
   * 检查日期是否跨天，只更新日期，不清空任务
   */
  const initStore = () => {
    const today = formatDate(getNow())
    
    // 如果日期已变化，只更新日期，不清空任务
    if (today !== currentDate.value) {
      currentDate.value = today
      isTodaySettled.value = false
      // 重置每日习惯状态
      dailyHabits.value.earlyRise.completed = false
      dailyHabits.value.phoneIsolation.completed = false
    }
    
    // 如果 syncKey 为空，生成一个新的
    if (!syncKey.value) {
      syncKey.value = generateSyncKey()
    }
  }
  
  /**
   * 添加任务
   * @param task 任务信息（不包含 id、status、actualPerfScore、completedAt、pauseCount、accumulatedTime、lastStartTime）
   */
  const addTask = (task: Omit<Task, 'id' | 'status' | 'actualPerfScore' | 'completedAt' | 'pauseCount' | 'accumulatedTime' | 'lastStartTime'>) => {
    const newTask: Task = {
      id: generateId(),
      status: 'TODO',
      actualPerfScore: 0,
      pauseCount: 0,
      accumulatedTime: 0,
      ...task
    }
    
    allTasks.value.push(newTask)
  }
  
  /**
   * 打卡动作
   * 任务完成后，计算绩效分并实时发放积分
   * @param taskId 任务ID
   * @param _timeSpent 耗时（分钟）
   * @param actualPerfScore 实际绩效分
   */
  const checkIn = (taskId: string, _timeSpent: number, actualPerfScore: number) => {
    const taskIndex = allTasks.value.findIndex(task => task.id === taskId)
    
    if (taskIndex !== -1) {
      const task = allTasks.value[taskIndex]
      
      // 计算本次可获得的积分
      const earnedScore = task.baseScore + actualPerfScore
      
      // 更新任务状态
      allTasks.value[taskIndex] = {
        ...task,
        status: 'DONE',
        actualPerfScore,
        completedAt: getNow().getTime()
      }
      
      // 实时发放积分
      totalScore.value += earnedScore
      
      // 触发任务完成通知
      notify('🎉 任务完成', `完美执行！已获得 ${earnedScore} 枚金币奖励！`, 'SUCCESS')
    }
  }
  
  /**
   * 开始任务
   * @param taskId 任务ID
   */
  const startTask = (taskId: string) => {
    // 检查是否有正在进行的任务
    const doingTask = allTasks.value.find(task => task.status === 'DOING')
    if (doingTask) {
      alert('请先完成或暂停当前任务')
      return
    }
    
    const taskIndex = allTasks.value.findIndex(task => task.id === taskId)
    if (taskIndex !== -1) {
      const task = allTasks.value[taskIndex]
      if (task.status === 'TODO' || task.status === 'PAUSED') {
        allTasks.value[taskIndex] = {
          ...task,
          status: 'DOING',
          lastStartTime: getNow().getTime()
        }
      }
    }
  }
  
  /**
   * 暂停任务
   * @param taskId 任务ID
   */
  const pauseTask = (taskId: string) => {
    const taskIndex = allTasks.value.findIndex(task => task.id === taskId)
    if (taskIndex !== -1) {
      const task = allTasks.value[taskIndex]
      if (task.status === 'DOING' && task.lastStartTime) {
        const currentTime = getNow().getTime()
        const duration = currentTime - task.lastStartTime
        const newAccumulatedTime = task.accumulatedTime + duration
        const newPauseCount = task.pauseCount + 1
        
        // 检查是否超过暂停次数限制
        let newStatus: TaskStatus = 'PAUSED'
        if (newPauseCount >= 2) {
          newStatus = 'VOID'
          // 触发任务作废警告
          notify('🚨 任务作废警告', '你已超出最大暂停次数！任务已作废，今晚锁定底线宕机！', 'WARNING')
        }
        
        allTasks.value[taskIndex] = {
          ...task,
          status: newStatus,
          pauseCount: newPauseCount,
          accumulatedTime: newAccumulatedTime,
          lastStartTime: undefined
        }
      }
    }
  }
  
  /**
   * 继续任务
   * @param taskId 任务ID
   */
  const resumeTask = (taskId: string) => {
    // 检查是否有正在进行的任务
    const doingTask = allTasks.value.find(task => task.status === 'DOING')
    if (doingTask) {
      alert('请先完成或暂停当前任务')
      return
    }
    
    const taskIndex = allTasks.value.findIndex(task => task.id === taskId)
    if (taskIndex !== -1) {
      const task = allTasks.value[taskIndex]
      if (task.status === 'PAUSED') {
        allTasks.value[taskIndex] = {
          ...task,
          status: 'DOING',
          lastStartTime: getNow().getTime()
        }
      }
    }
  }
  
  /**
   * 结束任务
   * @param taskId 任务ID
   * @returns 总耗时（分钟）
   */
  const endTask = (taskId: string): number => {
    const taskIndex = allTasks.value.findIndex(task => task.id === taskId)
    if (taskIndex !== -1) {
      const task = allTasks.value[taskIndex]
      if (task.status === 'DOING' && task.lastStartTime) {
        const currentTime = getNow().getTime()
        const duration = currentTime - task.lastStartTime
        const totalTimeSpent = task.accumulatedTime + duration
        // 转换为分钟并四舍五入
        const totalMinutes = Math.round(totalTimeSpent / 60000)
        
        return totalMinutes
      }
    }
    return 0
  }
  
  /**
   * 习惯打卡
   * @param habitKey 习惯键名
   */
  const checkInHabit = (habitKey: 'earlyRise' | 'phoneIsolation') => {
    const habit = dailyHabits.value[habitKey]
    if (!habit.completed) {
      habit.completed = true
      totalScore.value += habit.score
    }
  }
  
  /**
   * 删除任务
   * @param taskId 任务ID
   */
  const removeTask = (taskId: string) => {
    const taskIndex = allTasks.value.findIndex(task => task.id === taskId)
    
    if (taskIndex !== -1) {
      const task = allTasks.value[taskIndex]
      
      // 如果任务已完成，需要从总积分中扣除
      if (task.status === 'DONE') {
        const earnedScore = task.baseScore + task.actualPerfScore
        totalScore.value -= earnedScore
      }
      
      // 从任务列表中删除
      allTasks.value.splice(taskIndex, 1)
    }
  }
  
  /**
   * 每日结算引擎
   * 执行日结逻辑，包括奖惩核算
   * @returns 结算结果
   */
  const dailySettle = () => {
    // 检查是否已经结算过
    if (isTodaySettled.value) {
      return { status: 'PENDING', finalScore: 0 }
    }
    
    // 计算今日已赚取的积分
    const todayEarned = todayEarnedSoFar.value
    
    let status: 'PENDING' | 'NORMAL' | 'CRIT' | 'CRASH' = 'PENDING'
    let finalScore = 0
    
    // 判定 1: 底线宕机
    if (isCrashTriggered.value) {
      status = 'CRASH'
      finalScore = 0
      
      // 系统追回：扣除今日所有已赚取的积分
      totalScore.value -= todayEarned
    }
    // 判定 2: 超频暴击
    else if (isCritTriggered.value) {
      status = 'CRIT'
      finalScore = Math.floor(todayEarned * 1.1)
      
      // 补发奖金：发放 10% 的暴击分
      const bonus = Math.floor(todayEarned * 0.1)
      totalScore.value += bonus
    }
    // 判定 3: 正常
    else {
      status = 'NORMAL'
      finalScore = todayEarned
      // 不做任何调整，因为白天已经发过了
    }
    
    // 创建今日记录
    const record: DailyRecord = {
      date: currentDate.value,
      tasks: [...currentDayTasks.value],
      status,
      earnedScore: finalScore
    }
    
    // 添加到历史记录
    historyRecords.value.unshift(record)
    
    // 只移除已完成的任务，保留未完成的任务
    allTasks.value = allTasks.value.filter(task => 
      task.plannedDate !== currentDate.value || task.status !== 'DONE'
    )
    
    // 更新当前日期为明天
    const tomorrow = getNow()
    tomorrow.setDate(tomorrow.getDate() + 1)
    currentDate.value = formatDate(tomorrow)
    
    // 标记今日已结算
    isTodaySettled.value = true
    
    return {
      status,
      finalScore
    }
  }
  
  /**
   * 兑换奖励
   * @param cost 奖励花费
   * @returns 是否兑换成功
   */
  const redeemReward = (cost: number) => {
    if (totalScore.value >= cost) {
      totalScore.value -= cost
      return true
    }
    return false
  }
  
  /**
   * 添加反思（当触发底线宕机时）
   * @param reflection 反思内容
   */
  const addReflection = (reflection: string) => {
    const yesterdayRecord = historyRecords.value[0]
    if (yesterdayRecord && yesterdayRecord.status === 'CRASH') {
      yesterdayRecord.reflection = reflection
    }
  }
  
  /**
   * 提交每周复盘
   * @param reviewText 复盘文本
   */
  const submitWeeklyReview = (reviewText: string) => {
    // 保存复盘文本到最近的历史记录
    const latestRecord = historyRecords.value[0]
    if (latestRecord) {
      latestRecord.reflection = reviewText
    }
    
    // 解锁周末奖励
    isWeekendUnlocked.value = true
  }
  
  /**
   * 同步本地状态到云端
   */
  const syncToCloud = () => {
    if (isReceivingCloudUpdate || !syncKey.value) return;
    
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(async () => {
      syncStatus.value = 'SYNCING';
      try {
        const stateData = {
            totalScore: totalScore.value,
            allTasks: allTasks.value,
            historyRecords: historyRecords.value,
            isWeekendUnlocked: isWeekendUnlocked.value,
            isTodaySettled: isTodaySettled.value,
            dailyHabits: dailyHabits.value
          };
        const { error } = await supabase.from('app_state').upsert({
          id: syncKey.value,
          state_data: stateData,
          updated_at: new Date().toISOString()
        });
        if (!error) syncStatus.value = 'CONNECTED';
        else {
          console.error('Sync to cloud failed:', error);
          syncStatus.value = 'OFFLINE';
        }
      } catch (e) {
        console.error('Sync to cloud error:', e);
        syncStatus.value = 'OFFLINE';
      }
    }, 500);
  }
  
  /**
   * 设置实时订阅
   */
  const setupRealtimeSubscription = () => {
    // 断开旧的订阅
    if (syncChannel) {
      syncChannel.unsubscribe()
    }
    
    // 如果没有 syncKey，不执行订阅
    if (!syncKey.value) {
      syncStatus.value = 'OFFLINE'
      return
    }
    
    // 创建新的订阅
    syncChannel = supabase.channel('sync-channel')
    
    syncChannel
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'app_state',
        filter: `id=eq.${syncKey.value}`
      }, async (payload: any) => {
        // 防止在处理过程中再次触发
        if (isReceivingCloudUpdate) return;
        
        try {
          isReceivingCloudUpdate = true
          
          const newStateData = payload.new?.state_data
          if (newStateData) {
            // 更新本地状态
            totalScore.value = newStateData.totalScore
            allTasks.value = newStateData.allTasks
            historyRecords.value = newStateData.historyRecords
            isWeekendUnlocked.value = newStateData.isWeekendUnlocked
            isTodaySettled.value = newStateData.isTodaySettled
            if (newStateData.dailyHabits) {
              dailyHabits.value = newStateData.dailyHabits
            }
          }
          
          // 延迟恢复防死循环锁，确保 Vue 响应式更新
          await nextTick()
          setTimeout(() => {
            isReceivingCloudUpdate = false
          }, 100)
          
          syncStatus.value = 'CONNECTED'
        } catch (error) {
          console.error('Realtime subscription error:', error)
          syncStatus.value = 'OFFLINE'
          isReceivingCloudUpdate = false
        }
      })
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          syncStatus.value = 'CONNECTED'
        } else {
          syncStatus.value = 'OFFLINE'
        }
      })
  }
  
  /**
   * 切换 syncKey 并重新同步
   * @param newSyncKey 新的 syncKey
   */
  const switchSyncKey = async (newSyncKey: string) => {
    // 断开旧的订阅
    if (syncChannel) {
      syncChannel.unsubscribe()
    }
    
    // 更新 syncKey
    syncKey.value = newSyncKey
    syncStatus.value = 'SYNCING'
    
    try {
      // 从云端拉取数据
      const { data, error } = await supabase
        .from('app_state')
        .select('state_data')
        .eq('id', newSyncKey)
        .single()
      
      if (error || !data) {
        // 如果没有数据，保持本地状态
        console.warn('No data found for syncKey:', newSyncKey)
      } else {
        // 覆盖前必须先上锁，防止死循环
        isReceivingCloudUpdate = true;
        
        // 覆盖本地状态
        const stateData = data.state_data
        totalScore.value = stateData.totalScore
        allTasks.value = stateData.allTasks
        historyRecords.value = stateData.historyRecords
        isWeekendUnlocked.value = stateData.isWeekendUnlocked
        isTodaySettled.value = stateData.isTodaySettled
        if (stateData.dailyHabits) {
          dailyHabits.value = stateData.dailyHabits
        }
        
        // 覆盖完成后解锁
        await nextTick();
        setTimeout(() => {
          isReceivingCloudUpdate = false;
        }, 100);
      }
      
      // 重新设置订阅
      setupRealtimeSubscription()
    } catch (error) {
      console.error('Switch syncKey error:', error)
      syncStatus.value = 'OFFLINE'
    }
  }
  
  // 为核心状态添加监听器，自动同步到云端
  watch([totalScore, allTasks, historyRecords, isWeekendUnlocked, isTodaySettled, dailyHabits], () => {
    syncToCloud()
  }, { deep: true })
  
  // 初始化 Store
  initStore()
  
  return {
    // 状态
    totalScore,
    allTasks,
    historyRecords,
    currentDate,
    isWeekendUnlocked,
    isTodaySettled,
    mockDay,
    timeOffset,
    dailyHabits,
    syncKey,
    syncStatus,
    
    // 计算属性
    completedTasksCount,
    todayBaseScore,
    todayPerfScore,
    todayEarnedSoFar,
    isCritTriggered,
    isCrashTriggered,
    currentDayTasks,
    currentSystemDay,
    currentScheduleStatus,
    
    // 方法
    getNow,
    initStore,
    addTask,
    checkIn,
    checkInHabit,
    removeTask,
    dailySettle,
    redeemReward,
    addReflection,
    submitWeeklyReview,
    startTask,
    pauseTask,
    resumeTask,
    endTask,
    updateCurrentTime,
    jumpToDateTime,
    resetRealTime,
    syncToCloud,
    setupRealtimeSubscription,
    switchSyncKey
  }
}, {
  // 持久化配置
  persist: {
    storage: localStorage,
    key: 'personal-management-system'
  }
})
