import OpenAI from 'openai';
import type { VideoInfo, VideoAnalysis } from '@/types';
import { logger } from '@/utils/logger';

/**
 * AI 分析客户端（使用 Gemini 通过 OpenAI 兼容 API）
 */
export class AIAnalyzer {
  private client: OpenAI;
  private model: string;

  constructor(baseURL: string, apiKey: string, model: string) {
    this.client = new OpenAI({
      baseURL,
      apiKey,
    });
    this.model = model;
  }

  /**
   * 分析视频内容
   * @param video 视频信息
   */
  async analyzeVideo(video: VideoInfo): Promise<VideoAnalysis> {
    try {
      logger.info(`正在分析视频: ${video.title}`, { videoId: video.id });

      const prompt = this.buildAnalysisPrompt(video);
      
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: '你是一个专业的视频内容总结和汇报助手。你需要根据视频的内容，提供清晰、准确、有价值的内容总结。注意需要中文回答。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const response = completion.choices[0]?.message?.content;
      
      if (!response) {
        throw new Error('AI 响应为空');
      }

      // 解析 AI 响应
      const analysis = this.parseAIResponse(response, video);
      
      logger.info(`视频分析完成: ${video.title}`, { videoId: video.id });
      return analysis;
    } catch (error) {
      logger.error(`分析视频失败: ${video.title}`, error);
      
      // 返回基础分析结果
      return {
        videoId: video.id,
        videoTitle: video.title,
        summary: '视频分析失败，请查看原视频内容。',
        keyPoints: [video.description.slice(0, 200) + '...'],
        tags: [],
        sentiment: 'neutral',
        analyzedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * 构建分析提示词
   */
  private buildAnalysisPrompt(video: VideoInfo): string {
    return `请分析以下 YouTube 视频的内容，并进行详细总结。`;
  }

  /**
   * 解析 AI 响应
   */
  private parseAIResponse(response: string, video: VideoInfo): VideoAnalysis {
    try {
      return {
        videoId: video.id,
        videoTitle: video.title,
        summary: response,
        keyPoints: [],
        tags: [],
        sentiment: 'neutral',
        analyzedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.warn('解析 AI 响应失败，使用默认格式', error);
    }

    // 如果解析失败，返回基础分析
    return {
      videoId: video.id,
      videoTitle: video.title,
      summary: response.slice(0, 500),
      keyPoints: [response.slice(0, 200)],
      tags: [],
      sentiment: 'neutral',
      analyzedAt: new Date().toISOString(),
    };
  }

  /**
   * 批量分析多个视频
   * @param videos 视频列表
   * @param concurrency 并发数量
   */
  async analyzeVideos(videos: VideoInfo[], concurrency: number = 2): Promise<VideoAnalysis[]> {
    logger.info(`开始批量分析 ${videos.length} 个视频...`);

    const results: VideoAnalysis[] = [];
    
    // 分批处理，避免并发过高
    for (let i = 0; i < videos.length; i += concurrency) {
      const batch = videos.slice(i, i + concurrency);
      const batchResults = await Promise.allSettled(
        batch.map(video => this.analyzeVideo(video))
      );

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        }
      }

      // 添加延迟，避免 API 限流
      if (i + concurrency < videos.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    logger.info(`批量分析完成，成功分析 ${results.length}/${videos.length} 个视频`);
    return results;
  }
}

