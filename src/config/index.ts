import { EnvSchema, type EnvConfig } from '@/types';

/**
 * 加载和验证环境变量配置
 */
export function loadConfig(): EnvConfig {
  try {
    const config = EnvSchema.parse(process.env);
    return config;
  } catch (error) {
    console.error('❌ 配置加载失败:', error);
    throw new Error('环境变量配置不正确，请检查 .env 文件');
  }
}

/**
 * 获取 YouTube 频道 ID 列表
 */
export function getChannelIds(config: EnvConfig): string[] {
  return config.YOUTUBE_CHANNEL_IDS.split(',').map(id => id.trim()).filter(Boolean);
}

