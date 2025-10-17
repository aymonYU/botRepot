import { CronJob } from 'cron';
import { loadConfig, getChannelIds } from '@/config';
import { YouTubeClient } from '@/modules/youtube';
import { AIAnalyzer } from '@/modules/ai';
import { NotificationService } from '@/modules/notification';
import { videoDb } from '@/utils/database';
import { logger } from '@/utils/logger';
import type { VideoInfo, VideoAnalysis } from '@/types';

/**
 * 视频检查和分析调度器
 */
export class VideoScheduler {
  private youtubeClient: YouTubeClient;
  private aiAnalyzer: AIAnalyzer;
  private notificationService: NotificationService;
  private channelIds: string[];
  private maxVideosPerCheck: number;
  private cronJob?: CronJob;

  constructor() {
    const config = loadConfig();

    this.youtubeClient = new YouTubeClient(config.YOUTUBE_API_KEY);
    
    this.aiAnalyzer = new AIAnalyzer(
      config.BASE_URL,
      config.OPENAI_API_KEY,
      config.AI_MODEL
    );

    this.notificationService = new NotificationService();

    this.channelIds = getChannelIds(config);
    this.maxVideosPerCheck = config.MAX_VIDEOS_PER_CHECK;

    logger.info('视频调度器初始化完成', {
      channelCount: this.channelIds.length,
      maxVideos: this.maxVideosPerCheck,
    });
  }

  /**
   * 执行一次视频检查和分析
   */
  async runOnce(): Promise<void> {
    try {
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.info('开始执行视频检查任务...');
      
      // 1. 获取所有频道的最新视频
      const allVideos = await this.youtubeClient.getLatestVideosFromChannels(
        this.channelIds,
        this.maxVideosPerCheck
      );

      if (allVideos.length === 0) {
        logger.info('没有找到任何视频');
        return;
      }

      // 2. 过滤出未处理的视频
      const newVideos: VideoInfo[] = [];
      for (const video of allVideos) {
        const hasProcessed = await videoDb.hasProcessed(video.id);
        if (!hasProcessed) {
          newVideos.push(video);
        }
      }

      logger.info(`找到 ${newVideos.length} 个新视频需要处理`);

      if (newVideos.length === 0) {
        logger.info('没有新视频需要处理');
        return;
      }

      // 3. 分析视频内容
      const analyses = await this.aiAnalyzer.analyzeVideos(newVideos);

      // 4. 生成报告并发送通知
      const reports: Array<{ video: VideoInfo; analysis: VideoAnalysis }> = [];
      
      for (let i = 0; i < newVideos.length; i++) {
        const video = newVideos[i];
        const analysis = analyses[i];
        
        if (analysis) {
          reports.push({ video, analysis });
          // 标记为已处理
          await videoDb.markAsProcessed(video.id, video.channelId);
        }
      }

      // 5. 保存批量报告到本地文件
      if (reports.length > 0) {
        const success = await this.notificationService.saveBatchReport(reports);
        if (success) {
          logger.info(`✅ 成功处理并保存 ${reports.length} 个视频的分析报告`);
        } else {
          logger.error(`❌ 保存报告失败`);
        }
      }

      logger.info('视频检查任务完成');
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } catch (error) {
      logger.error('执行视频检查任务时出错', error);
    }
  }

  /**
   * 启动定时任务
   * @param intervalMinutes 检查间隔（分钟）
   */
  start(intervalMinutes: number): void {
    // 立即执行一次
    this.runOnce();

    // 设置定时任务
    const cronPattern = `*/${intervalMinutes} * * * *`;
    
    this.cronJob = new CronJob(
      cronPattern,
      () => this.runOnce(),
      null,
      true,
      'Asia/Shanghai'
    );

    logger.info(`定时任务已启动，每 ${intervalMinutes} 分钟检查一次`);
  }

  /**
   * 停止定时任务
   */
  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      logger.info('定时任务已停止');
    }
  }
}

// 如果直接运行此文件，执行一次检查
if (import.meta.main) {
  const scheduler = new VideoScheduler();
  await scheduler.runOnce();
  process.exit(0);
}

