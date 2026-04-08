<template>
  <div
    v-if="visible"
    class="fixed inset-0 z-9999 flex items-end justify-center bg-black/50 pt-16 backdrop-blur-sm md:items-center"
    @click.self="emit('close')"
  >
    <div class="relative w-full max-w-sm rounded-t-3xl bg-white p-4 pb-safe shadow-2xl md:mx-4 md:rounded-3xl md:p-5">
      <div class="mx-auto mb-4 h-1.5 w-12 rounded-full bg-gray-300 md:hidden"></div>
      <h3 class="mb-4 text-center text-lg font-bold text-gray-900">同步中心</h3>

      <div class="mb-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-3.5">
        <h4 class="mb-2.5 text-sm font-semibold text-gray-900">当前同步码</h4>
        <div class="flex items-center gap-2">
          <div class="flex-1 rounded-lg bg-white px-2.5 py-2 text-center font-mono text-sm shadow-sm">
            {{ systemStore.syncKey }}
          </div>
          <button
            class="flex items-center gap-1.5 rounded-lg bg-blue-500 px-3 py-2 text-xs text-white transition-all hover:bg-blue-600"
            @click="copySyncKey"
          >
            <Copy class="h-3.5 w-3.5" />
            复制
          </button>
        </div>
        <p class="mt-2.5 text-xs text-gray-600">其他设备输入这个同步码后，才会加入同一份云端数据。</p>
      </div>

      <div class="mb-4 rounded-xl bg-gray-50 p-3">
        <h4 class="mb-2 text-sm font-semibold text-gray-900">同步状态</h4>
        <div class="flex items-center gap-2">
          <div
            class="h-2.5 w-2.5 rounded-full"
            :class="{
              'bg-green-500': systemStore.syncStatus === 'CONNECTED',
              'bg-yellow-500 animate-pulse': systemStore.syncStatus === 'SYNCING',
              'bg-orange-500': systemStore.syncStatus === 'CONFLICT',
              'bg-red-500': systemStore.syncStatus === 'OFFLINE' || systemStore.syncStatus === 'ERROR'
            }"
          ></div>
          <span class="text-xs font-medium text-gray-700">{{ statusLabel }}</span>
        </div>
        <p class="mt-2 text-xs text-gray-600">{{ systemStore.syncMessage }}</p>
        <div class="mt-3 space-y-1 text-xs text-gray-600">
          <p>设备 ID：{{ shortDeviceId }}</p>
          <p>云端版本：v{{ systemStore.lastSyncedVersion }}</p>
          <p>最后同步：{{ lastSyncedAtText }}</p>
        </div>
        <p v-if="systemStore.lastSyncError" class="mt-3 rounded-lg bg-red-50 px-2.5 py-2 text-xs text-red-600">
          {{ systemStore.lastSyncError }}
        </p>
        <button
          class="mt-3 w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="systemStore.syncStatus === 'SYNCING'"
          @click="handleManualSync"
        >
          立即同步
        </button>
      </div>

      <div class="mb-4">
        <h4 class="mb-2.5 text-sm font-semibold text-gray-900">连接已有设备</h4>
        <div class="space-y-2.5">
          <input
            v-model="newSyncKey"
            type="text"
            class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="输入其他设备的同步码"
          />
          <button
            class="w-full rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="!newSyncKey || systemStore.syncStatus === 'SYNCING'"
            @click="connectToDevice"
          >
            {{ systemStore.syncStatus === 'SYNCING' ? '连接中...' : '连接该设备' }}
          </button>
        </div>
      </div>

      <div class="mt-3">
        <button
          class="w-full rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-medium text-gray-800 transition-all hover:bg-slate-200"
          @click="emit('close')"
        >
          关闭
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Copy } from 'lucide-vue-next'
import { useSystemStore } from '../store'
import { notify } from '../utils/notifier'

defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const systemStore = useSystemStore()
const newSyncKey = ref('')

const statusLabel = computed(() => {
  switch (systemStore.syncStatus) {
    case 'CONNECTED':
      return '已连接云端'
    case 'SYNCING':
      return '正在同步'
    case 'CONFLICT':
      return '检测到冲突，已自动刷新'
    case 'ERROR':
      return '同步异常'
    default:
      return '未连接'
  }
})

const shortDeviceId = computed(() => {
  if (!systemStore.deviceId) return '未生成'
  return systemStore.deviceId.slice(0, 8)
})

const lastSyncedAtText = computed(() => {
  if (!systemStore.lastSyncedAt) return '尚未同步'

  const parsed = new Date(systemStore.lastSyncedAt)
  if (Number.isNaN(parsed.getTime())) return systemStore.lastSyncedAt

  return parsed.toLocaleString('zh-CN', {
    hour12: false
  })
})

const copySyncKey = async () => {
  try {
    await navigator.clipboard.writeText(systemStore.syncKey)
    notify('复制成功', '同步码已复制到剪贴板。', 'SUCCESS')
  } catch (error) {
    console.error('Copy failed:', error)
    notify('复制失败', '请手动复制同步码。', 'WARNING')
  }
}

const handleManualSync = async () => {
  const success = await systemStore.forceSync()
  if (success) {
    notify('同步完成', '当前设备已和云端完成对齐。', 'SUCCESS')
  } else if (systemStore.syncStatus !== 'CONFLICT') {
    notify('同步失败', '请查看同步状态中的错误信息。', 'WARNING')
  }
}

const connectToDevice = async () => {
  if (!newSyncKey.value) return

  try {
    await systemStore.switchSyncKey(newSyncKey.value)
    notify('连接成功', '已连接到目标设备的同步空间。', 'SUCCESS')
    emit('close')
  } catch (error: any) {
    console.error('Connect failed:', error)
    const message = error?.message === 'SYNC_KEY_NOT_FOUND'
      ? '没有找到这个同步码对应的云端数据。'
      : '无法连接到目标设备，请检查同步码是否正确。'
    notify('连接失败', message, 'WARNING')
  }
}
</script>

<script lang="ts">
export default {
  name: 'SyncRoomModal'
}
</script>
