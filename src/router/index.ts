import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'DailyTasks',
      component: () => import('../views/DailyTasks.vue')
    },
    {
      path: '/rewards',
      name: 'RewardCenter',
      component: () => import('../views/RewardCenter.vue')
    },
    {
      path: '/plan',
      name: 'WeeklyPlan',
      component: () => import('../views/WeeklyPlan.vue')
    }
  ]
})

export default router
