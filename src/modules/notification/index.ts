import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import type { NotificationPayload, VideoInfo, VideoAnalysis } from '@/types';
import { logger } from '@/utils/logger';

/**
 * 通知服务
 */
export class NotificationService {
  private reportsDir: string;

  constructor() {
    this.reportsDir = join(process.cwd(), 'reports');
  }

  /**
   * 保存报告到本地文件
   * @param payload 通知内容
   */
  async saveToFile(payload: NotificationPayload): Promise<boolean> {
    try {
      // 确保报告目录存在
      await mkdir(this.reportsDir, { recursive: true });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const safeVideoId = payload.videoInfo.id.replace(/[^a-zA-Z0-9_-]/g, '_');
      const baseFilename = `${timestamp}_${safeVideoId}`;

      // 保存 HTML 版本
      const htmlPath = join(this.reportsDir, `${baseFilename}.html`);
      await writeFile(htmlPath, payload.htmlContent, 'utf-8');
      logger.info(`HTML 报告已保存: ${htmlPath}`);

      // 保存文本版本
      const textPath = join(this.reportsDir, `${baseFilename}.txt`);
      await writeFile(textPath, payload.textContent, 'utf-8');
      logger.info(`文本报告已保存: ${textPath}`);

      return true;
    } catch (error) {
      logger.error(`保存报告失败: ${payload.subject}`, error);
      return false;
    }
  }

  /**
   * 生成视频分析报告的邮件内容
   * @param video 视频信息
   * @param analysis 分析结果
   */
  generateReportPayload(video: VideoInfo, analysis: VideoAnalysis): NotificationPayload {
    const subject = `🎬 新视频分析报告：${video.title}`;

    // HTML 邮件内容
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background: white;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      border-bottom: 3px solid #ff0000;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    h1 {
      color: #ff0000;
      margin: 0 0 10px 0;
      font-size: 24px;
    }
    .channel {
      color: #666;
      font-size: 14px;
    }
    .thumbnail {
      width: 100%;
      max-width: 600px;
      height: auto;
      border-radius: 8px;
      margin: 20px 0;
    }
    .section {
      margin: 25px 0;
    }
    .section-title {
      color: #ff0000;
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 10px;
      border-left: 4px solid #ff0000;
      padding-left: 10px;
    }
    .summary {
      background: #f8f8f8;
      padding: 15px;
      border-radius: 5px;
      font-size: 16px;
      line-height: 1.8;
    }
    .key-points {
      list-style: none;
      padding: 0;
    }
    .key-points li {
      padding: 10px 0;
      border-bottom: 1px solid #eee;
    }
    .key-points li:before {
      content: "✓ ";
      color: #ff0000;
      font-weight: bold;
      margin-right: 8px;
    }
    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 10px;
    }
    .tag {
      background: #ff0000;
      color: white;
      padding: 5px 12px;
      border-radius: 15px;
      font-size: 13px;
    }
    .sentiment {
      display: inline-block;
      padding: 5px 15px;
      border-radius: 20px;
      font-weight: bold;
      font-size: 14px;
    }
    .sentiment.positive {
      background: #4caf50;
      color: white;
    }
    .sentiment.neutral {
      background: #9e9e9e;
      color: white;
    }
    .sentiment.negative {
      background: #f44336;
      color: white;
    }
    .button {
      display: inline-block;
      background: #ff0000;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 5px;
      margin-top: 20px;
      font-weight: bold;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      color: #999;
      font-size: 12px;
      text-align: center;
    }
    .meta {
      color: #666;
      font-size: 14px;
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎬 ${video.title}</h1>
      <div class="channel">频道：${video.channelTitle}</div>
      <div class="meta">发布时间：${new Date(video.publishedAt).toLocaleString('zh-CN')}</div>
      <div class="meta">分析时间：${new Date(analysis.analyzedAt).toLocaleString('zh-CN')}</div>
    </div>

    ${video.thumbnailUrl ? `<img src="${video.thumbnailUrl}" alt="视频缩略图" class="thumbnail">` : ''}

    <div class="section">
      <div class="section-title">📝 内容摘要</div>
      <div class="summary">${analysis.summary}</div>
    </div>

    ${analysis.keyPoints.length > 0 ? `
    <div class="section">
      <div class="section-title">🎯 关键要点</div>
      <ul class="key-points">
        ${analysis.keyPoints.map(point => `<li>${point}</li>`).join('')}
      </ul>
    </div>
    ` : ''}

    <div class="section">
      <div class="section-title">💭 情感分析</div>
      <span class="sentiment ${analysis.sentiment}">
        ${analysis.sentiment === 'positive' ? '😊 积极正面' : analysis.sentiment === 'negative' ? '😔 消极负面' : '😐 中性'}
      </span>
    </div>

    ${analysis.tags.length > 0 ? `
    <div class="section">
      <div class="section-title">🏷️ 相关标签</div>
      <div class="tags">
        ${analysis.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
      </div>
    </div>
    ` : ''}

    <div style="text-align: center;">
      <a href="${video.url}" class="button">🎥 观看视频</a>
    </div>

    <div class="footer">
      <p>这是一封自动生成的视频分析报告</p>
      <p>由 YouTube Bot Report 系统提供支持</p>
    </div>
  </div>
</body>
</html>
    `;

    // 纯文本邮件内容
    const textContent = `
🎬 新视频分析报告

标题：${video.title}
频道：${video.channelTitle}
发布时间：${new Date(video.publishedAt).toLocaleString('zh-CN')}
视频链接：${video.url}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 内容摘要：
${analysis.summary}

🎯 关键要点：
${analysis.keyPoints.map((point, index) => `${index + 1}. ${point}`).join('\n')}

💭 情感分析：${analysis.sentiment === 'positive' ? '😊 积极正面' : analysis.sentiment === 'negative' ? '😔 消极负面' : '😐 中性'}

🏷️ 相关标签：${analysis.tags.map(tag => `#${tag}`).join(' ')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

分析时间：${new Date(analysis.analyzedAt).toLocaleString('zh-CN')}
这是一封自动生成的视频分析报告
    `;

    return {
      subject,
      htmlContent,
      textContent,
      videoInfo: video,
      analysis,
    };
  }

  /**
   * 保存视频分析报告
   * @param video 视频信息
   * @param analysis 分析结果
   */
  async saveVideoReport(video: VideoInfo, analysis: VideoAnalysis): Promise<boolean> {
    const payload = this.generateReportPayload(video, analysis);
    return this.saveToFile(payload);
  }

  /**
   * 批量保存多个视频的报告
   * @param reports 视频和分析结果列表
   */
  async saveBatchReport(reports: Array<{ video: VideoInfo; analysis: VideoAnalysis }>): Promise<boolean> {
    if (reports.length === 0) {
      logger.info('没有需要保存的报告');
      return true;
    }

    logger.info(`正在保存 ${reports.length} 个视频报告...`);

    // 方案1：保存为单个合并文件
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const subject = `🎬 YouTube 视频分析报告 (${reports.length} 个新视频)`;
    
    const htmlReports = reports.map(({ video, analysis }) => {
      const payload = this.generateReportPayload(video, analysis);
      return payload.htmlContent;
    }).join('<hr style="margin: 40px 0; border: none; border-top: 2px solid #ddd;">');

    const textReports = reports.map(({ video, analysis }, index) => {
      const payload = this.generateReportPayload(video, analysis);
      return `\n\n【视频 ${index + 1}】\n${payload.textContent}`;
    }).join('\n\n' + '═'.repeat(60));

    const batchPayload: NotificationPayload = {
      subject,
      htmlContent: htmlReports,
      textContent: `YouTube 视频分析报告 - 共 ${reports.length} 个新视频\n${textReports}`,
      videoInfo: reports[0].video,
      analysis: reports[0].analysis,
    };

    // 保存合并报告
    try {
      await mkdir(this.reportsDir, { recursive: true });
      
      const htmlPath = join(this.reportsDir, `batch_${timestamp}.html`);
      await writeFile(htmlPath, batchPayload.htmlContent, 'utf-8');
      logger.info(`✅ 批量 HTML 报告已保存: ${htmlPath}`);

      const textPath = join(this.reportsDir, `batch_${timestamp}.txt`);
      await writeFile(textPath, batchPayload.textContent, 'utf-8');
      logger.info(`✅ 批量文本报告已保存: ${textPath}`);

      // 方案2：同时保存每个视频的独立报告
      for (const report of reports) {
        await this.saveVideoReport(report.video, report.analysis);
      }

      return true;
    } catch (error) {
      logger.error('保存批量报告失败', error);
      return false;
    }
  }
}

