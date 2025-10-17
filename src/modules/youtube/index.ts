import { google } from 'googleapis';
import type { VideoInfo } from '@/types';
import { logger } from '@/utils/logger';

/**
 * YouTube API 客户端
 */
export class YouTubeClient {
  private youtube;

  constructor(apiKey: string) {
    this.youtube = google.youtube({
      version: 'v3',
      auth: apiKey,
    });
  }

  /**
   * 获取频道的最新视频
   * @param channelId 频道 ID
   * @param maxResults 最大结果数量
   */
  async getLatestVideos(channelId: string, maxResults: number = 5): Promise<VideoInfo[]> {
    try {
      logger.info(`正在获取频道 ${channelId} 的最新视频...`);

      // 首先获取频道的上传播放列表 ID
      const channelResponse = await this.youtube.channels.list({
        part: ['contentDetails'],
        id: [channelId],
      });

      if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
        logger.warn(`频道 ${channelId} 不存在或无法访问`);
        return [];
      }

      const uploadsPlaylistId = channelResponse.data.items[0].contentDetails?.relatedPlaylists?.uploads;
      
      if (!uploadsPlaylistId) {
        logger.warn(`频道 ${channelId} 没有上传播放列表`);
        return [];
      }

      // 获取播放列表中的视频
      const playlistResponse = await this.youtube.playlistItems.list({
        part: ['snippet', 'contentDetails'],
        playlistId: uploadsPlaylistId,
        maxResults,
      });

      const videos: VideoInfo[] = [];

      if (playlistResponse.data.items) {
        for (const item of playlistResponse.data.items) {
          const snippet = item.snippet;
          if (snippet && snippet.resourceId?.videoId) {
            videos.push({
              id: snippet.resourceId.videoId,
              title: snippet.title || 'Untitled',
              description: snippet.description || '',
              channelId: snippet.channelId || channelId,
              channelTitle: snippet.channelTitle || '',
              publishedAt: snippet.publishedAt || new Date().toISOString(),
              thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || '',
              url: `https://www.youtube.com/watch?v=${snippet.resourceId.videoId}`,
            });
          }
        }
      }

      logger.info(`成功获取 ${videos.length} 个视频`, { channelId, count: videos.length });
      return videos;
    } catch (error) {
      logger.error(`获取频道 ${channelId} 视频失败`, error);
      return [];
    }
  }

  /**
   * 获取视频详细信息
   * @param videoId 视频 ID
   */
  async getVideoDetails(videoId: string): Promise<VideoInfo | null> {
    try {
      const response = await this.youtube.videos.list({
        part: ['snippet', 'contentDetails'],
        id: [videoId],
      });

      if (!response.data.items || response.data.items.length === 0) {
        return null;
      }

      const video = response.data.items[0];
      const snippet = video.snippet;

      if (!snippet) {
        return null;
      }

      return {
        id: videoId,
        title: snippet.title || 'Untitled',
        description: snippet.description || '',
        channelId: snippet.channelId || '',
        channelTitle: snippet.channelTitle || '',
        publishedAt: snippet.publishedAt || new Date().toISOString(),
        thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || '',
        url: `https://www.youtube.com/watch?v=${videoId}`,
      };
    } catch (error) {
      logger.error(`获取视频 ${videoId} 详情失败`, error);
      return null;
    }
  }

  /**
   * 批量获取多个频道的最新视频
   * @param channelIds 频道 ID 列表
   * @param maxResultsPerChannel 每个频道的最大结果数
   */
  async getLatestVideosFromChannels(
    channelIds: string[],
    maxResultsPerChannel: number = 5
  ): Promise<VideoInfo[]> {
    logger.info(`正在获取 ${channelIds.length} 个频道的最新视频...`);

    const allVideos: VideoInfo[] = [];

    // 并行获取所有频道的视频
    const results = await Promise.allSettled(
      channelIds.map(channelId => this.getLatestVideos(channelId, maxResultsPerChannel))
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        allVideos.push(...result.value);
      }
    }

    // 按发布时间排序（最新的在前）
    allVideos.sort((a, b) => {
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

    logger.info(`成功获取 ${allVideos.length} 个视频`);
    return allVideos;
  }
}

