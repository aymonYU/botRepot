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
            content: '你是一个专业的视频内容总结和回报助手。你需要根据视频的内容，提供清晰、准确、有价值的内容总结和分析。',
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
    return `请分析以下 YouTube 视频的内容，并提供结构化的分析结果：

视频标题：${video.title}
频道名称：${video.channelTitle}
发布时间：${video.publishedAt}
视频描述：
${video.description}

请按以下 JSON 格式返回分析结果：
{
  "summary": "视频内容总结和分析（200-400字）",
  "keyPoints": ["关键点1", "关键点2", "关键点3"],
  "tags": ["标签1", "标签2", "标签3"],
  "sentiment": "positive/neutral/negative"
}

要求：
1. summary 应该汇总视频内容，并给出分析和总结。
2. keyPoints 应该列出3-5个关键要点
3. tags 应该包含3-5个相关主题标签
4. sentiment 根据内容判断情感倾向（positive=积极/正面, neutral=中性, negative=消极/负面）

请直接返回 JSON 格式的结果，不要包含其他文字。`;
  }

  /**
   * 解析 AI 响应
   */
  private parseAIResponse(response: string, video: VideoInfo): VideoAnalysis {
    try {
      // 尝试提取 JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          videoId: video.id,
          videoTitle: video.title,
          summary: parsed.summary || '无法生成摘要',
          keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
          tags: Array.isArray(parsed.tags) ? parsed.tags : [],
          sentiment: ['positive', 'neutral', 'negative'].includes(parsed.sentiment)
            ? parsed.sentiment
            : 'neutral',
          analyzedAt: new Date().toISOString(),
        };
      }
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

