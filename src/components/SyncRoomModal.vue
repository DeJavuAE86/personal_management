<template>
  <div v-if="visible" class="fixed inset-0 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm z-9999 pt-16" @click.self="emit('close')">
    <div class="w-full max-w-sm bg-white rounded-t-3xl md:rounded-3xl p-4 md:p-5 shadow-2xl transform transition-all pb-safe md:mx-4 relative">
      <!-- 抽屉把手 -->
      <div class="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4 md:hidden"></div>
      <!-- 弹窗标题 -->
      <h3 class="text-lg font-bold text-gray-900 mb-4 text-center">设置与同步大厅</h3>
      
      <!-- 本机身份展示 -->
      <div class="mb-4 p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
        <h4 class="font-semibold text-gray-900 mb-2.5 text-sm">本机配对码</h4>
        <div class="flex items-center gap-2">
          <div class="flex-1 bg-white px-2.5 py-2 rounded-lg shadow-sm font-mono text-center text-sm">
            {{ systemStore.syncKey }}
          </div>
          <button 
            class="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-all flex items-center gap-1.5 text-xs"
            @click="copySyncKey"
          >
            <Copy class="w-3.5 h-3.5" />
            复制
          </button>
        </div>
        <p class="text-xs text-gray-600 mt-2.5">其他设备输入此码即可与本机同步数据</p>
      </div>
      
      <!-- 连接已有设备 -->
      <div class="mb-4">
        <h4 class="font-semibold text-gray-900 mb-2.5 text-sm">连接已有设备</h4>
        <div class="space-y-2.5">
          <input 
            type="text" 
            v-model="newSyncKey"
            class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
            placeholder="输入其他设备的配对码"
          />
          <button 
            class="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all transform hover:-translate-y-0.5 text-sm"
            @click="connectToDevice"
            :disabled="!newSyncKey || systemStore.syncStatus === 'SYNCING'"
          >
            <span v-if="systemStore.syncStatus === 'SYNCING'">🔄 连接中...</span>
            <span v-else>🔗 连接该设备</span>
          </button>
        </div>
      </div>
      
      <!-- 同步状态 -->
      <div class="mb-4 p-3 bg-gray-50 rounded-xl">
        <h4 class="font-semibold text-gray-900 mb-2 text-sm">同步状态</h4>
        <div class="flex items-center gap-2">
          <div 
            class="w-2.5 h-2.5 rounded-full" 
            :class="{
              'bg-green-500': systemStore.syncStatus === 'CONNECTED',
              'bg-yellow-500 animate-pulse': systemStore.syncStatus === 'SYNCING',
              'bg-red-500': systemStore.syncStatus === 'OFFLINE'
            }"
          ></div>
          <span class="text-xs font-medium text-gray-700">
            {{ 
              systemStore.syncStatus === 'CONNECTED' ? '已连接云端' :
              systemStore.syncStatus === 'SYNCING' ? '数据同步中...' :
              '离线/未连接'
            }}
          </span>
        </div>
      </div>
      
      <!-- 底部按钮 -->
      <div class="mt-3">
        <button 
          class="w-full px-4 py-2.5 bg-slate-100 text-gray-800 rounded-lg font-medium hover:bg-slate-200 transition-all text-sm"
          @click="emit('close')"
        >
          关闭
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useSystemStore } from '../store'
import { Copy } from 'lucide-vue-next'
import { notify } from '../utils/notifier'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const systemStore = useSystemStore()
const newSyncKey = ref('')

// 复制 syncKey
const copySyncKey = async () => {
  try {
    await navigator.clipboard.writeText(systemStore.syncKey)
    notify('🎉 复制成功', '配对码已复制到剪贴板', 'SUCCESS')
  } catch (error) {
    console.error('Copy failed:', error)
    notify('❌ 复制失败', '请手动复制配对码', 'WARNING')
  }
}

// 连接到其他设备
const connectToDevice = async () => {
  if (!newSyncKey.value) return
  
  try {
    await systemStore.switchSyncKey(newSyncKey.value)
    notify('🎉 连接成功', '已成功连接到指定设备并同步数据', 'SUCCESS')
    emit('close')
  } catch (error) {
    console.error('Connect failed:', error)
    notify('❌ 连接失败', '无法连接到指定设备，请检查配对码是否正确', 'WARNING')
  }
}
</script>

<script lang="ts">
export default {
  name: 'SyncRoomModal'
}
</script>
