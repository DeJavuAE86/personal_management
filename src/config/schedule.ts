export type ScheduleType = 'ROUTINE' | 'CORE' | 'REST' | 'RECREATION' | 'SLEEP' | 'OPTIONAL' | 'PLAN' | 'REVIEW' | 'REWARD';

export interface ScheduleSlot {
  startTime: string;
  endTime: string;
  name: string;
  type: ScheduleType;
}

// 工作日作息表（周一至周五）
export const WORKDAY_SCHEDULE: ScheduleSlot[] = [
  {
    startTime: '07:00',
    endTime: '08:30',
    name: '晨间启动',
    type: 'ROUTINE'
  },
  {
    startTime: '08:30',
    endTime: '12:00',
    name: '上午核心',
    type: 'CORE'
  },
  {
    startTime: '12:00',
    endTime: '14:00',
    name: '午休',
    type: 'REST'
  },
  {
    startTime: '14:00',
    endTime: '17:00',
    name: '下午核心',
    type: 'CORE'
  },
  {
    startTime: '17:00',
    endTime: '19:00',
    name: '晚间交接',
    type: 'RECREATION'
  },
  {
    startTime: '19:00',
    endTime: '22:00',
    name: '晚间学习',
    type: 'CORE'
  },
  {
    startTime: '22:00',
    endTime: '07:00',
    name: '禁手机',
    type: 'SLEEP'
  }
];

// 周日作息表
export const SUNDAY_SCHEDULE: ScheduleSlot[] = [
  {
    startTime: '07:00',
    endTime: '20:00',
    name: '积极休息/奖励消耗',
    type: 'REST'
  },
  {
    startTime: '20:00',
    endTime: '21:00',
    name: '下周规划制定',
    type: 'PLAN'
  },
  {
    startTime: '21:00',
    endTime: '23:00',
    name: '收心准备',
    type: 'ROUTINE'
  },
  {
    startTime: '23:00',
    endTime: '07:00',
    name: '禁手机',
    type: 'SLEEP'
  }
];

export function getCurrentSlot(currentTime: Date, schedule: ScheduleSlot[]): ScheduleSlot | null {
  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const currentMinutes = hours * 60 + minutes;

  for (const slot of schedule) {
    const timeParts = slot.startTime.split(':');
    const startHour = Number(timeParts[0]);
    const startMinute = Number(timeParts[1]);
    
    const endTimeParts = slot.endTime.split(':');
    const endHour = Number(endTimeParts[0]);
    const endMinute = Number(endTimeParts[1]);
    
    const startMinutes = startHour * 60 + startMinute;
    let endMinutes = endHour * 60 + endMinute;
    
    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60;
      const adjustedCurrentMinutes = currentMinutes < startMinutes ? currentMinutes + 24 * 60 : currentMinutes;
      if (adjustedCurrentMinutes >= startMinutes && adjustedCurrentMinutes < endMinutes) {
        return slot;
      }
    } else {
      if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
        return slot;
      }
    }
  }
  
  return null;
}

export function getNextSlot(currentTime: Date, schedule: ScheduleSlot[]): ScheduleSlot | null {
  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const currentMinutes = hours * 60 + minutes;

  let currentSlotIndex = -1;
  for (let i = 0; i < schedule.length; i++) {
    const slot = schedule[i];
    const timeParts = slot.startTime.split(':');
    const startHour = Number(timeParts[0]);
    const startMinute = Number(timeParts[1]);
    
    const endTimeParts = slot.endTime.split(':');
    const endHour = Number(endTimeParts[0]);
    const endMinute = Number(endTimeParts[1]);
    
    const startMinutes = startHour * 60 + startMinute;
    let endMinutes = endHour * 60 + endMinute;
    
    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60;
      const adjustedCurrentMinutes = currentMinutes < startMinutes ? currentMinutes + 24 * 60 : currentMinutes;
      if (adjustedCurrentMinutes >= startMinutes && adjustedCurrentMinutes < endMinutes) {
        currentSlotIndex = i;
        break;
      }
    } else {
      if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
        currentSlotIndex = i;
        break;
      }
    }
  }

  if (currentSlotIndex !== -1) {
    return schedule[(currentSlotIndex + 1) % schedule.length];
  }
  
  return schedule[0];
}

export function getTimeToNextSlot(currentTime: Date, nextSlot: ScheduleSlot): number {
  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const currentMinutes = hours * 60 + minutes;
  
  const timeParts = nextSlot.startTime.split(':');
  const nextHour = Number(timeParts[0]);
  const nextMinute = Number(timeParts[1]);
  
  let nextStartMinutes = nextHour * 60 + nextMinute;
  
  if (nextStartMinutes < currentMinutes) {
    nextStartMinutes += 24 * 60;
  }
  
  return nextStartMinutes - currentMinutes;
}
