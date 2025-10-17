/**
 * 简单的视频记录数据库（使用 JSON 文件存储）
 * 用于追踪已处理的视频，避免重复处理
 */

import { readFile, writeFile, exists } from 'fs/promises';
import { join } from 'path';

const DB_PATH = join(process.cwd(), 'data', 'processed-videos.json');

interface VideoRecord {
  videoId: string;
  processedAt: string;
  channelId: string;
}

class VideoDatabase {
  private data: VideoRecord[] = [];
  private initialized = false;

  /**
   * 初始化数据库
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      // 确保数据目录存在
      await Bun.write(join(process.cwd(), 'data', '.gitkeep'), '');
      
      // 尝试加载现有数据
      if (await exists(DB_PATH)) {
        const content = await readFile(DB_PATH, 'utf-8');
        this.data = JSON.parse(content);
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('数据库初始化失败:', error);
      this.data = [];
      this.initialized = true;
    }
  }

  /**
   * 检查视频是否已处理
   */
  async hasProcessed(videoId: string): Promise<boolean> {
    await this.init();
    return this.data.some(record => record.videoId === videoId);
  }

  /**
   * 标记视频为已处理
   */
  async markAsProcessed(videoId: string, channelId: string): Promise<void> {
    await this.init();
    
    if (await this.hasProcessed(videoId)) {
      return;
    }

    this.data.push({
      videoId,
      channelId,
      processedAt: new Date().toISOString(),
    });

    await this.save();
  }

  /**
   * 获取某个频道的所有已处理视频
   */
  async getProcessedByChannel(channelId: string): Promise<VideoRecord[]> {
    await this.init();
    return this.data.filter(record => record.channelId === channelId);
  }

  /**
   * 保存数据到文件
   */
  private async save(): Promise<void> {
    try {
      await writeFile(DB_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (error) {
      console.error('保存数据失败:', error);
    }
  }

  /**
   * 清理旧记录（保留最近 30 天的记录）
   */
  async cleanup(daysToKeep = 30): Promise<void> {
    await this.init();
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    this.data = this.data.filter(record => {
      const processedDate = new Date(record.processedAt);
      return processedDate > cutoffDate;
    });

    await this.save();
  }
}

export const videoDb = new VideoDatabase();

