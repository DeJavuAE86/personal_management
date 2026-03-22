import { createClient } from '@supabase/supabase-js'

// 读取环境变量
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 检查环境变量是否存在
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase 环境变量缺失，请检查 .env.local 并重启 Vite 服务！')
}

// 创建并导出 Supabase 客户端
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default supabase
