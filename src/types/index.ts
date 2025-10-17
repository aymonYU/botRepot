import { z } from 'zod';

// 环境变量配置 Schema
export const EnvSchema = z.object({
  // AI Configuration
  BASE_URL: z.string().url(),
  OPENAI_API_KEY: z.string(),
  AI_MODEL: z.string(),
  
  // YouTube Configuration
  YOUTUBE_API_KEY: z.string(),
  YOUTUBE_CHANNEL_IDS: z.string(),
  
  // Server Configuration
  PORT: z.string().transform(Number).default('3000'),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  
  // Scheduler Configuration
  CHECK_INTERVAL_MINUTES: z.string().transform(Number).default('30'),
  MAX_VIDEOS_PER_CHECK: z.string().transform(Number).default('5'),
});

export type EnvConfig = z.infer<typeof EnvSchema>;

// YouTube 视频信息
export interface VideoInfo {
  id: string;
  title: string;
  description: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  thumbnailUrl: string;
  url: string;
}

// AI 分析结果
export interface VideoAnalysis {
  videoId: string;
  videoTitle: string;
  summary: string;
  keyPoints: string[];
  tags: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  duration?: string;
  analyzedAt: string;
}

// 通知内容
export interface NotificationPayload {
  subject: string;
  htmlContent: string;
  textContent: string;
  videoInfo: VideoInfo;
  analysis: VideoAnalysis;
}

// 日志级别
export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

