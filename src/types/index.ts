// 1. 任务类型配置
export type TaskType = 'QUIZ' | 'VIDEO' | 'SUMMARY'; // 做题、看课、总结
export type TaskCapacity = 'MIN' | 'STANDARD' | 'EXTRA'; // 容量等级

// 2. 任务实体
export type TaskStatus = 'TODO' | 'DOING' | 'PAUSED' | 'DONE' | 'VOID';

// 任务绩效分设置
interface TaskPerfSettings {
  tier1: {
    timeLimit?: number; // 分钟（做题任务）
    correctRate?: number; // 百分比（做题任务）
    focusLevel?: string; // 专注度（看课任务）
    perfScore: number; // 绩效分
  };
  tier2: {
    timeLimit?: number; // 分钟（做题任务）
    correctRate?: number; // 百分比（做题任务）
    focusLevel?: string; // 专注度（看课任务）
    perfScore: number; // 绩效分
  };
}

export interface Task {
  id: string;
  title: string;
  moduleId: string; // 关联 config 中的模块，如 'c1' (政治理论)
  type: TaskType;
  capacity: TaskCapacity;
  baseScore: number; // 周日规划时设定的悬赏基础分
  plannedDate: string; // 计划日期，YYYY-MM-DD
  
  // 执行状态
  status: TaskStatus; // 任务状态
  actualPerfScore: number; // 实际拿到的绩效分
  completedAt?: number; // 时间戳
  
  // 计时相关
  pauseCount: number; // 暂停次数
  accumulatedTime: number; // 累计耗时，毫秒
  lastStartTime?: number; // 最近一次开始的时间戳
  
  // 任务绩效分设置
  perfSettings: TaskPerfSettings;
  
  // 新增字段
  isPenaltyDeducted?: boolean; // 标记是否扣除了违约金
  isUsingFreeAddition?: boolean; // 标记是否使用了免费添加次数
  createdDate?: string; // 任务创建日期，YYYY-MM-DD
}

// 3. 每日记录实体 (存入历史账本)
export interface DailyRecord {
  date: string; // YYYY-MM-DD
  tasks: Task[];
  status: 'PENDING' | 'NORMAL' | 'CRIT' | 'CRASH'; // 待结算/正常/超频暴击/底线击穿
  earnedScore: number; // 今日赚取总分
  reflection?: string; // 如果 Crash，必须填写的反思
}

// 4. 奖励实体
export type RewardCategory = 'A' | 'B' | 'C' | 'D';
export interface Reward {
  id: string;
  name: string;
  category: RewardCategory;
  cost: number;
  icon?: string;
  description?: string;
}
