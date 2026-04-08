import { defineStore } from 'pinia'
import { computed, nextTick, ref, watch } from 'vue'
import type { DailyRecord, Task, TaskStatus } from '@/types'
import { getCurrentSlot, getNextSlot, getTimeToNextSlot, SUNDAY_SCHEDULE, WORKDAY_SCHEDULE } from '@/config/schedule'
import { notify } from '@/utils/notifier'
import supabase from '@/utils/supabase'

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

const generateSyncKey = (): string => {
  return Math.random().toString(36).substring(2, 14)
}

const generateDeviceId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 10)}`
}

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0]
}

type SyncStatus = 'OFFLINE' | 'SYNCING' | 'CONNECTED' | 'CONFLICT' | 'ERROR'

interface HabitState {
  completed: boolean
  score: number
}

interface AppStatePayload {
  currentDate: string
  totalScore: number
  allTasks: Task[]
  historyRecords: DailyRecord[]
  isWeekendUnlocked: boolean
  isTodaySettled: boolean
  dailyHabits: {
    earlyRise: HabitState
    phoneIsolation: HabitState
  }
  dailyFreeTaskAdditions: number
  lastFreeTaskResetDate: string
}

interface CloudStateData extends AppStatePayload {
  version: number
  updatedAt: string
  updatedBy: string
}

interface SaveStateRpcResult {
  status?: 'created' | 'updated' | 'conflict'
  version?: number
  updated_at?: string
  state_data?: CloudStateData
  message?: string
}

interface RemoteStateResponse {
  stateData: CloudStateData
  updatedAt: string
}

const cloneHabits = (habits?: Partial<AppStatePayload['dailyHabits']>): AppStatePayload['dailyHabits'] => ({
  earlyRise: {
    completed: habits?.earlyRise?.completed ?? false,
    score: habits?.earlyRise?.score ?? 1
  },
  phoneIsolation: {
    completed: habits?.phoneIsolation?.completed ?? false,
    score: habits?.phoneIsolation?.score ?? 2
  }
})

export const useSystemStore = defineStore('system', () => {
  const totalScore = ref(0)
  const allTasks = ref<Task[]>([])
  const historyRecords = ref<DailyRecord[]>([])
  const isWeekendUnlocked = ref(false)
  const isTodaySettled = ref(false)
  const mockDay = ref<'REAL' | 'SATURDAY' | 'SUNDAY'>('REAL')
  const timeOffset = ref(0)

  function getNow() {
    return new Date(Date.now() + timeOffset.value)
  }

  const currentTime = ref(getNow())
  const currentDate = ref(formatDate(getNow()))
  const dailyHabits = ref(cloneHabits())

  const syncKey = ref('')
  const syncStatus = ref<SyncStatus>('OFFLINE')
  const syncMessage = ref('等待首次云端对齐')
  const deviceId = ref('')
  const lastSyncedVersion = ref(0)
  const lastSyncedAt = ref('')
  const lastSyncError = ref('')
  const hasHydratedFromCloud = ref(false)
  const isDirty = ref(false)

  const dailyFreeTaskAdditions = ref(2)
  const lastFreeTaskResetDate = ref(formatDate(getNow()))

  let isReceivingCloudUpdate = false
  let isSavingToCloud = false
  let syncChannel: any = null
  let syncTimeout: number | null = null

  const currentSystemDay = computed(() => {
    if (mockDay.value === 'SATURDAY') return 6
    if (mockDay.value === 'SUNDAY') return 0
    return currentTime.value.getDay()
  })

  const updateCurrentTime = () => {
    currentTime.value = getNow()
  }

  const jumpToDateTime = (targetDateStr: string, targetTimeStr: string) => {
    const [year, month, day] = targetDateStr.split('-').map(Number)
    const [hours, minutes] = targetTimeStr.split(':').map(Number)
    const targetDate = new Date(year, month - 1, day, hours, minutes, 0, 0)
    timeOffset.value = targetDate.getTime() - Date.now()
    currentTime.value = getNow()
  }

  const resetRealTime = () => {
    timeOffset.value = 0
    currentTime.value = getNow()
  }

  const currentScheduleStatus = computed(() => {
    const dayOfWeek = currentSystemDay.value

    if (dayOfWeek === 6) {
      if (isWeekendUnlocked.value) {
        return {
          currentSlot: {
            name: '周末奖励模式',
            type: 'REWARD' as const,
            startTime: '现在',
            endTime: '周日'
          },
          nextSlot: null,
          timeToNextSlot: 0
        }
      }

      return {
        currentSlot: {
          name: '周末复盘模式',
          type: 'REVIEW' as const,
          startTime: '任意时间',
          endTime: '直到复盘完成'
        },
        nextSlot: null,
        timeToNextSlot: 0
      }
    }

    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      const currentSlot = getCurrentSlot(currentTime.value, WORKDAY_SCHEDULE)
      const nextSlot = getNextSlot(currentTime.value, WORKDAY_SCHEDULE)
      const timeToNextSlot = nextSlot ? getTimeToNextSlot(currentTime.value, nextSlot) : 0
      return { currentSlot, nextSlot, timeToNextSlot }
    }

    if (dayOfWeek === 0) {
      const currentSlot = getCurrentSlot(currentTime.value, SUNDAY_SCHEDULE)
      const nextSlot = getNextSlot(currentTime.value, SUNDAY_SCHEDULE)
      const timeToNextSlot = nextSlot ? getTimeToNextSlot(currentTime.value, nextSlot) : 0
      return { currentSlot, nextSlot, timeToNextSlot }
    }

    return {
      currentSlot: null,
      nextSlot: null,
      timeToNextSlot: 0
    }
  })

  const currentDayTasks = computed(() => {
    return allTasks.value.filter(task => task.plannedDate === currentDate.value)
  })

  const completedTasksCount = computed(() => {
    return currentDayTasks.value.filter(task => task.status === 'DONE').length
  })

  const todayBaseScore = computed(() => {
    return currentDayTasks.value
      .filter(task => task.status === 'DONE')
      .reduce((sum, task) => sum + task.baseScore, 0)
  })

  const todayPerfScore = computed(() => {
    return currentDayTasks.value
      .filter(task => task.status === 'DONE')
      .reduce((sum, task) => sum + task.actualPerfScore, 0)
  })

  const todayEarnedSoFar = computed(() => {
    return currentDayTasks.value
      .filter(task => task.status === 'DONE')
      .reduce((sum, task) => sum + task.baseScore + task.actualPerfScore, 0)
  })

  const isCritTriggered = computed(() => {
    const standardTasks = currentDayTasks.value.filter(task => task.capacity === 'STANDARD')
    const allStandardCompleted = standardTasks.length > 0 && standardTasks.every(task => task.status === 'DONE')
    const extraTasksCompleted = currentDayTasks.value.some(task => task.capacity === 'EXTRA' && task.status === 'DONE')
    return allStandardCompleted && extraTasksCompleted
  })

  const isCrashTriggered = computed(() => {
    const minTasks = currentDayTasks.value.filter(task => task.capacity === 'MIN')
    const anyMinNotCompleted = minTasks.length > 0 && minTasks.some(task => task.status !== 'DONE')
    return anyMinNotCompleted
  })

  const buildStatePayload = (): AppStatePayload => ({
    currentDate: currentDate.value,
    totalScore: totalScore.value,
    allTasks: allTasks.value,
    historyRecords: historyRecords.value,
    isWeekendUnlocked: isWeekendUnlocked.value,
    isTodaySettled: isTodaySettled.value,
    dailyHabits: cloneHabits(dailyHabits.value),
    dailyFreeTaskAdditions: dailyFreeTaskAdditions.value,
    lastFreeTaskResetDate: lastFreeTaskResetDate.value
  })

  const buildCloudState = (version: number): CloudStateData => ({
    ...buildStatePayload(),
    version,
    updatedAt: new Date().toISOString(),
    updatedBy: deviceId.value
  })

  const updateSyncPresence = (status: SyncStatus, message: string, errorMessage: string = '') => {
    syncStatus.value = status
    syncMessage.value = message
    lastSyncError.value = errorMessage
  }

  const markDirty = () => {
    if (!hasHydratedFromCloud.value || isReceivingCloudUpdate) return
    isDirty.value = true
  }

  const normalizeCloudState = (rawState: any, updatedAt?: string): CloudStateData | null => {
    if (!rawState) return null

    return {
      currentDate: rawState.currentDate ?? currentDate.value,
      totalScore: rawState.totalScore ?? 0,
      allTasks: rawState.allTasks ?? [],
      historyRecords: rawState.historyRecords ?? [],
      isWeekendUnlocked: rawState.isWeekendUnlocked ?? false,
      isTodaySettled: rawState.isTodaySettled ?? false,
      dailyHabits: cloneHabits(rawState.dailyHabits),
      dailyFreeTaskAdditions: rawState.dailyFreeTaskAdditions ?? 2,
      lastFreeTaskResetDate: rawState.lastFreeTaskResetDate ?? formatDate(getNow()),
      version: Number(rawState.version ?? 0),
      updatedAt: rawState.updatedAt ?? updatedAt ?? new Date().toISOString(),
      updatedBy: rawState.updatedBy ?? 'legacy'
    }
  }

  const fetchCloudState = async (targetSyncKey: string): Promise<RemoteStateResponse | null> => {
    const { data, error } = await supabase
      .from('app_state')
      .select('state_data, updated_at')
      .eq('id', targetSyncKey)
      .maybeSingle()

    if (error) {
      throw error
    }

    if (!data?.state_data) {
      return null
    }

    const normalized = normalizeCloudState(data.state_data, data.updated_at)
    if (!normalized) {
      return null
    }

    return {
      stateData: normalized,
      updatedAt: data.updated_at ?? normalized.updatedAt
    }
  }

  const applyCloudState = async (stateData: CloudStateData, incomingUpdatedAt?: string) => {
    if (stateData.version < lastSyncedVersion.value) {
      return false
    }

    isReceivingCloudUpdate = true

    totalScore.value = stateData.totalScore
    allTasks.value = stateData.allTasks
    historyRecords.value = stateData.historyRecords
    isWeekendUnlocked.value = stateData.isWeekendUnlocked

    if (stateData.currentDate === currentDate.value) {
      isTodaySettled.value = stateData.isTodaySettled
      dailyHabits.value = cloneHabits(stateData.dailyHabits)
      dailyFreeTaskAdditions.value = stateData.dailyFreeTaskAdditions
      lastFreeTaskResetDate.value = stateData.lastFreeTaskResetDate
    } else {
      setTimeout(() => {
        void syncToCloud(true)
      }, 1000)
    }

    lastSyncedVersion.value = stateData.version
    lastSyncedAt.value = incomingUpdatedAt ?? stateData.updatedAt
    isDirty.value = false

    await nextTick()
    setTimeout(() => {
      isReceivingCloudUpdate = false
    }, 100)

    return true
  }

  const scheduleSync = (force = false) => {
    if (!hasHydratedFromCloud.value && !force) return
    if (isReceivingCloudUpdate || !syncKey.value) return

    if (syncTimeout) {
      clearTimeout(syncTimeout)
    }

    syncTimeout = window.setTimeout(() => {
      void syncToCloud(force)
    }, force ? 0 : 500)
  }

  const handleSyncConflict = async () => {
    updateSyncPresence('CONFLICT', '检测到其他设备已更新，正在刷新最新数据')
    notify('同步已刷新', '检测到其他设备更新，系统已拉取最新数据。', 'WARNING')
    await pullInitialData()
  }

  const initStore = () => {
    const today = formatDate(getNow())

    if (today !== currentDate.value) {
      currentDate.value = today
      isTodaySettled.value = false
      dailyHabits.value.earlyRise.completed = false
      dailyHabits.value.phoneIsolation.completed = false
    }

    if (today !== lastFreeTaskResetDate.value) {
      dailyFreeTaskAdditions.value = 2
      lastFreeTaskResetDate.value = today
    }

    if (!syncKey.value) {
      syncKey.value = generateSyncKey()
    }

    if (!deviceId.value) {
      deviceId.value = generateDeviceId()
    }
  }

  const addTask = (
    task: Omit<Task, 'id' | 'status' | 'actualPerfScore' | 'completedAt' | 'pauseCount' | 'accumulatedTime' | 'lastStartTime' | 'isPenaltyDeducted' | 'createdDate' | 'isUsingFreeAddition'>,
    isPenaltyDeducted: boolean = false,
    isUsingFreeAddition: boolean = false
  ) => {
    if (isUsingFreeAddition) {
      dailyFreeTaskAdditions.value--
    }

    const newTask: Task = {
      id: generateId(),
      status: 'TODO',
      actualPerfScore: 0,
      pauseCount: 0,
      accumulatedTime: 0,
      isPenaltyDeducted,
      isUsingFreeAddition,
      createdDate: currentDate.value,
      ...task
    }

    allTasks.value.push(newTask)
  }

  const checkIn = (taskId: string, _timeSpent: number, actualPerfScore: number) => {
    const taskIndex = allTasks.value.findIndex(task => task.id === taskId)

    if (taskIndex !== -1) {
      const task = allTasks.value[taskIndex]
      const earnedScore = task.baseScore + actualPerfScore

      allTasks.value[taskIndex] = {
        ...task,
        status: 'DONE',
        actualPerfScore,
        completedAt: getNow().getTime()
      }

      totalScore.value += earnedScore
      notify('任务完成', `已获得 ${earnedScore} 积分。`, 'SUCCESS')
      scheduleSync(true)
    }
  }

  const startTask = (taskId: string) => {
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

  const pauseTask = (taskId: string) => {
    const taskIndex = allTasks.value.findIndex(task => task.id === taskId)
    if (taskIndex !== -1) {
      const task = allTasks.value[taskIndex]
      if (task.status === 'DOING' && task.lastStartTime) {
        const now = getNow().getTime()
        const duration = now - task.lastStartTime
        const newAccumulatedTime = task.accumulatedTime + duration
        const newPauseCount = task.pauseCount + 1

        let newStatus: TaskStatus = 'PAUSED'
        if (newPauseCount >= 2) {
          newStatus = 'VOID'
          notify('任务作废警告', '暂停次数超限，任务已作废。', 'WARNING')
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

  const resumeTask = (taskId: string) => {
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

  const endTask = (taskId: string): number => {
    const taskIndex = allTasks.value.findIndex(task => task.id === taskId)
    if (taskIndex !== -1) {
      const task = allTasks.value[taskIndex]
      if (task.status === 'DOING' && task.lastStartTime) {
        const now = getNow().getTime()
        const duration = now - task.lastStartTime
        const totalTimeSpent = task.accumulatedTime + duration
        return Math.round(totalTimeSpent / 60000)
      }
    }
    return 0
  }

  const checkInHabit = (habitKey: 'earlyRise' | 'phoneIsolation') => {
    const habit = dailyHabits.value[habitKey]
    if (!habit.completed) {
      habit.completed = true
      totalScore.value += habit.score
      scheduleSync(true)
    }
  }

  const removeTask = (taskId: string) => {
    try {
      const taskIndex = allTasks.value.findIndex(task => task.id === taskId)

      if (taskIndex !== -1) {
        const task = allTasks.value[taskIndex]

        if (task.status === 'DONE' || task.status === 'VOID') {
          notify('无法删除', '只允许删除未完成的任务。', 'WARNING')
          return
        }

        if (task.isPenaltyDeducted) {
          totalScore.value += 2
        }

        if (task.isUsingFreeAddition) {
          dailyFreeTaskAdditions.value++
        }

        allTasks.value.splice(taskIndex, 1)
        scheduleSync(true)
      }
    } catch (error) {
      console.error('删除任务失败:', error)
      notify('删除失败', '任务删除失败，请稍后重试。', 'WARNING')
    }
  }

  const dailySettle = () => {
    if (isTodaySettled.value) {
      return { status: 'PENDING', finalScore: 0 }
    }

    const todayEarned = todayEarnedSoFar.value
    let status: 'PENDING' | 'NORMAL' | 'CRIT' | 'CRASH' = 'PENDING'
    let finalScore = 0

    if (isCrashTriggered.value) {
      status = 'CRASH'
      finalScore = 0
      totalScore.value -= todayEarned
    } else if (isCritTriggered.value) {
      status = 'CRIT'
      finalScore = Math.floor(todayEarned * 1.1)
      totalScore.value += Math.floor(todayEarned * 0.1)
    } else {
      status = 'NORMAL'
      finalScore = todayEarned
    }

    const record: DailyRecord = {
      date: currentDate.value,
      tasks: [...currentDayTasks.value],
      status,
      earnedScore: finalScore
    }

    historyRecords.value.unshift(record)
    allTasks.value = allTasks.value.filter(task => task.plannedDate !== currentDate.value || task.status !== 'DONE')

    const tomorrow = getNow()
    tomorrow.setDate(tomorrow.getDate() + 1)
    currentDate.value = formatDate(tomorrow)
    isTodaySettled.value = true

    scheduleSync(true)

    return {
      status,
      finalScore
    }
  }

  const redeemReward = (cost: number) => {
    if (totalScore.value >= cost) {
      totalScore.value -= cost
      scheduleSync(true)
      return true
    }
    return false
  }

  const addReflection = (reflection: string) => {
    const yesterdayRecord = historyRecords.value[0]
    if (yesterdayRecord && yesterdayRecord.status === 'CRASH') {
      yesterdayRecord.reflection = reflection
      scheduleSync(true)
    }
  }

  const submitWeeklyReview = (reviewText: string) => {
    const latestRecord = historyRecords.value[0]
    if (latestRecord) {
      latestRecord.reflection = reviewText
    }

    isWeekendUnlocked.value = true
    scheduleSync(true)
  }

  const syncToCloud = async (force = false) => {
    if (!syncKey.value) return false
    if (!hasHydratedFromCloud.value && !force) return false
    if (isReceivingCloudUpdate || isSavingToCloud) return false
    if (!force && !isDirty.value) return true

    isSavingToCloud = true
    updateSyncPresence('SYNCING', '正在同步到云端')

    try {
      const baseVersion = lastSyncedVersion.value
      const stateData = buildCloudState(baseVersion + 1)

      const { data, error } = await supabase.rpc('save_app_state_if_version_matches', {
        p_id: syncKey.value,
        p_base_version: baseVersion,
        p_state_data: stateData,
        p_updated_by: deviceId.value
      })

      if (error) {
        throw error
      }

      const result = (Array.isArray(data) ? data[0] : data) as SaveStateRpcResult | null
      if (!result?.status) {
        throw new Error('RPC returned empty result')
      }

      if (result.status === 'conflict') {
        await handleSyncConflict()
        return false
      }

      lastSyncedVersion.value = result.version ?? stateData.version
      lastSyncedAt.value = result.updated_at ?? stateData.updatedAt
      isDirty.value = false
      updateSyncPresence('CONNECTED', `已同步到云端版本 v${lastSyncedVersion.value}`)
      return true
    } catch (error: any) {
      console.error('Sync to cloud failed:', error)
      updateSyncPresence('ERROR', '同步失败，请稍后重试', error?.message ?? 'Unknown error')
      return false
    } finally {
      isSavingToCloud = false
    }
  }

  const forceSync = async () => {
    return syncToCloud(true)
  }

  const pullInitialData = async () => {
    if (!syncKey.value) return

    updateSyncPresence('SYNCING', '正在从云端拉取最新数据')

    try {
      const remoteState = await fetchCloudState(syncKey.value)

      if (!remoteState) {
        hasHydratedFromCloud.value = true
        isDirty.value = true
        updateSyncPresence('CONNECTED', '云端空间为空，下一次同步会创建数据')
        return
      }

      await applyCloudState(remoteState.stateData, remoteState.updatedAt)
      hasHydratedFromCloud.value = true
      updateSyncPresence('CONNECTED', `已同步到云端版本 v${lastSyncedVersion.value}`)
    } catch (error: any) {
      console.error('Pull initial data failed:', error)
      hasHydratedFromCloud.value = true
      updateSyncPresence('ERROR', '拉取云端数据失败，当前使用本地缓存', error?.message ?? 'Unknown error')
    }
  }

  const setupRealtimeSubscription = () => {
    if (syncChannel) {
      syncChannel.unsubscribe()
    }

    if (!syncKey.value) {
      updateSyncPresence('OFFLINE', '未配置同步空间')
      return
    }

    syncChannel = supabase.channel(`sync-channel:${syncKey.value}`)

    syncChannel
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'app_state',
        filter: `id=eq.${syncKey.value}`
      }, async (payload: any) => {
        if (isReceivingCloudUpdate) return

        const stateData = normalizeCloudState(payload.new?.state_data, payload.new?.updated_at)
        if (!stateData) return
        if (stateData.version <= lastSyncedVersion.value) return

        const applied = await applyCloudState(stateData, payload.new?.updated_at)
        if (applied) {
          updateSyncPresence('CONNECTED', `已接收云端版本 v${lastSyncedVersion.value}`)
        }
      })
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          updateSyncPresence('CONNECTED', syncMessage.value || '实时同步已连接')
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          updateSyncPresence('OFFLINE', '实时同步连接中断')
        }
      })
  }

  const switchSyncKey = async (newSyncKey: string) => {
    const normalizedKey = newSyncKey.trim()
    if (!normalizedKey) {
      throw new Error('SYNC_KEY_REQUIRED')
    }

    updateSyncPresence('SYNCING', '正在连接新的同步空间')

    const remoteState = await fetchCloudState(normalizedKey)
    if (!remoteState) {
      updateSyncPresence('ERROR', '目标同步空间不存在')
      throw new Error('SYNC_KEY_NOT_FOUND')
    }

    if (syncChannel) {
      syncChannel.unsubscribe()
    }

    syncKey.value = normalizedKey
    lastSyncedVersion.value = 0
    lastSyncedAt.value = ''
    hasHydratedFromCloud.value = true
    isDirty.value = false

    await applyCloudState(remoteState.stateData, remoteState.updatedAt)
    updateSyncPresence('CONNECTED', `已连接到云端版本 v${lastSyncedVersion.value}`)
    setupRealtimeSubscription()
  }

  watch(
    [totalScore, allTasks, historyRecords, isWeekendUnlocked, isTodaySettled, dailyHabits, currentDate, dailyFreeTaskAdditions, lastFreeTaskResetDate],
    () => {
      markDirty()
      scheduleSync()
    },
    { deep: true }
  )

  initStore()

  return {
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
    syncMessage,
    deviceId,
    lastSyncedVersion,
    lastSyncedAt,
    lastSyncError,
    hasHydratedFromCloud,
    dailyFreeTaskAdditions,
    lastFreeTaskResetDate,

    completedTasksCount,
    todayBaseScore,
    todayPerfScore,
    todayEarnedSoFar,
    isCritTriggered,
    isCrashTriggered,
    currentDayTasks,
    currentSystemDay,
    currentScheduleStatus,

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
    forceSync,
    setupRealtimeSubscription,
    switchSyncKey,
    pullInitialData
  }
}, {
  persist: {
    storage: localStorage,
    key: 'personal-management-system',
    pick: [
      'totalScore',
      'allTasks',
      'historyRecords',
      'isWeekendUnlocked',
      'isTodaySettled',
      'currentDate',
      'dailyHabits',
      'syncKey',
      'mockDay',
      'timeOffset',
      'dailyFreeTaskAdditions',
      'lastFreeTaskResetDate',
      'deviceId',
      'lastSyncedVersion',
      'lastSyncedAt'
    ]
  }
})
