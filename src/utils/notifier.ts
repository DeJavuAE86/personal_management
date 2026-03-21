// 音频引擎与通知中枢

// 音频上下文
let audioContext: AudioContext | null = null;

// 初始化音频上下文
const initAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

// 播放Chime音效（悦耳的“叮~”声）
export const playChime = () => {
  const ctx = initAudioContext();
  
  // 创建振荡器
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  // 连接节点
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  // 配置振荡器
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(800, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 1);
  
  // 配置音量
  gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);
  
  // 播放
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 1);
};

// 播放Success音效（激昂的成功音效）
export const playSuccess = () => {
  const ctx = initAudioContext();
  
  // 创建第一个振荡器
  const oscillator1 = ctx.createOscillator();
  const gainNode1 = ctx.createGain();
  
  // 连接节点
  oscillator1.connect(gainNode1);
  gainNode1.connect(ctx.destination);
  
  // 配置第一个振荡器
  oscillator1.type = 'sine';
  oscillator1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
  oscillator1.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.3); // E5
  
  // 配置音量
  gainNode1.gain.setValueAtTime(0.3, ctx.currentTime);
  gainNode1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
  
  // 播放第一个音符
  oscillator1.start(ctx.currentTime);
  oscillator1.stop(ctx.currentTime + 0.3);
  
  // 创建第二个振荡器
  const oscillator2 = ctx.createOscillator();
  const gainNode2 = ctx.createGain();
  
  // 连接节点
  oscillator2.connect(gainNode2);
  gainNode2.connect(ctx.destination);
  
  // 配置第二个振荡器
  oscillator2.type = 'sine';
  oscillator2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.35); // E5
  oscillator2.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.65); // G5
  
  // 配置音量
  gainNode2.gain.setValueAtTime(0.4, ctx.currentTime + 0.35);
  gainNode2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.65);
  
  // 播放第二个音符
  oscillator2.start(ctx.currentTime + 0.35);
  oscillator2.stop(ctx.currentTime + 0.65);
};

// 播放Warning音效（刺耳的警告声）
export const playWarning = () => {
  const ctx = initAudioContext();
  
  // 播放三次短促的警告声
  for (let i = 0; i < 3; i++) {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    // 连接节点
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // 配置振荡器
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(220, ctx.currentTime + i * 0.2); // A3
    
    // 配置音量
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.2);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.2 + 0.15);
    
    // 播放
    oscillator.start(ctx.currentTime + i * 0.2);
    oscillator.stop(ctx.currentTime + i * 0.2 + 0.15);
  }
};

// 请求通知权限
export const requestPermission = async (): Promise<boolean> => {
  if ('Notification' in window) {
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } else if (Notification.permission === 'granted') {
      return true;
    }
  }
  return false;
};

// 发送通知
export const notify = (title: string, body: string, soundType: 'CHIME' | 'SUCCESS' | 'WARNING') => {
  // 播放音效
  switch (soundType) {
    case 'CHIME':
      playChime();
      break;
    case 'SUCCESS':
      playSuccess();
      break;
    case 'WARNING':
      playWarning();
      break;
  }
  
  // 发送桌面通知
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/pwa-192x192.svg'
    });
  }
};

// 导出所有函数
export default {
  requestPermission,
  notify,
  playChime,
  playSuccess,
  playWarning
};