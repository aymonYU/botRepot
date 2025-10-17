import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'fs';
import { join } from 'path';
import { logger } from './logger';
import type { VideoInfo, VideoAnalysis } from '@/types';

interface ReportData {
  videoId: string;
  videoTitle: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  videoUrl: string;
  thumbnailUrl: string;
  timestamp: Date;
  htmlPath: string;
  txtPath: string;
}

interface ChannelData {
  channelId: string;
  channelTitle: string;
  channelUrl: string;
  videoCount: number;
  latestVideo?: Date;
}

/**
 * 报告索引生成器
 */
export class ReportIndexGenerator {
  private reportsDir: string;
  
  constructor(reportsDir: string = 'reports') {
    this.reportsDir = reportsDir;
    
    // 确保 reports 目录存在
    if (!existsSync(this.reportsDir)) {
      mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  /**
   * 扫描 reports 目录，解析所有报告
   */
  private scanReports(): ReportData[] {
    const reports: ReportData[] = [];
    
    try {
      const files = readdirSync(this.reportsDir);
      
      // 只处理单个视频的 HTML 报告（不包括 batch_ 开头的）
      const htmlFiles = files.filter(f => 
        f.endsWith('.html') && 
        !f.startsWith('batch_') &&
        f !== 'index.html'
      );

      for (const htmlFile of htmlFiles) {
        try {
          const htmlPath = join(this.reportsDir, htmlFile);
          const content = readFileSync(htmlPath, 'utf-8');
          
          // 从文件名解析时间戳和视频ID
          // 格式: 2025-10-17T05-18-01-936Z_videoId.html
          const match = htmlFile.match(/^(.+?)_(.+?)\.html$/);
          if (!match) continue;
          
          const [, timestampStr, videoId] = match;
          
          // 将文件名时间戳转换为有效的 ISO 8601 格式
          // 2025-10-17T05-18-01-936Z -> 2025-10-17T05:18:01.936Z
          const isoTimestamp = timestampStr
            .replace(/T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z/, 'T$1:$2:$3.$4Z');
          
          const timestamp = new Date(isoTimestamp);
          
          // 验证日期有效性
          if (isNaN(timestamp.getTime())) {
            logger.warn(`无效的时间戳: ${timestampStr} (${htmlFile})`);
            continue;
          }
          
          // 从 HTML 内容解析信息
          const report = this.parseHtmlReport(content, videoId, timestamp, htmlPath);
          if (report) {
            reports.push(report);
          }
        } catch (error) {
          logger.warn(`解析报告文件失败: ${htmlFile}`, error);
        }
      }
      
      // 按时间倒序排序
      reports.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
    } catch (error) {
      logger.error('扫描报告目录失败', error);
    }
    
    return reports;
  }

  /**
   * 从 HTML 内容解析报告信息
   */
  private parseHtmlReport(html: string, videoId: string, timestamp: Date, htmlPath: string): ReportData | null {
    try {
      // 移除换行符和多余空格，使正则匹配更可靠
      const cleanHtml = html.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ');
      
      // 使用正则表达式提取信息 - 兼容多种格式
      // 格式1: <h1>🎬 标题</h1>
      // 格式2: <h2 class="video-title">标题</h2>
      let titleMatch = cleanHtml.match(/<h1[^>]*>🎬\s*([^<]+)<\/h1>/);
      if (!titleMatch) {
        titleMatch = cleanHtml.match(/<h1[^>]*>([^<]+)<\/h1>/);
      }
      if (!titleMatch) {
        titleMatch = cleanHtml.match(/<h2[^>]*class="video-title"[^>]*>([^<]+)<\/h2>/);
      }
      
      // 格式1: <div class="channel">频道：频道名</div>
      // 格式2: <p class="channel">频道：<strong>频道名</strong></p>
      let channelMatch = cleanHtml.match(/<div[^>]*class="channel"[^>]*>频道[：:]([^<]+)<\/div>/);
      if (!channelMatch) {
        channelMatch = cleanHtml.match(/<p[^>]*class="channel"[^>]*>频道[：:]<strong>([^<]+)<\/strong><\/p>/);
      }
      if (!channelMatch) {
        channelMatch = cleanHtml.match(/频道[：:]\s*([^\n<]+)/);
      }
      
      const urlMatch = cleanHtml.match(/https:\/\/www\.youtube\.com\/watch\?v=([^"'<>\s&]+)/);
      
      // 缩略图匹配 - 支持多种格式
      let thumbnailUrl = '';
      const thumbnailMatch1 = cleanHtml.match(/<img[^>]+src="([^"]+)"[^>]*class="thumbnail"/);
      const thumbnailMatch2 = cleanHtml.match(/<img[^>]+class="thumbnail"[^>]+src="([^"]+)"/);
      const thumbnailMatch3 = cleanHtml.match(/(https:\/\/i\.ytimg\.com\/vi\/[^"'\s]+)/);
      
      if (thumbnailMatch1) {
        thumbnailUrl = thumbnailMatch1[1];
      } else if (thumbnailMatch2) {
        thumbnailUrl = thumbnailMatch2[1];
      } else if (thumbnailMatch3) {
        thumbnailUrl = thumbnailMatch3[1];
      }
      
      if (!titleMatch || !channelMatch) {
        const fileName = htmlPath.split('/').pop() || htmlPath;
        logger.warn(`无法解析报告: ${fileName}`, {
          hasTitle: !!titleMatch,
          hasChannel: !!channelMatch,
          sampleHtml: cleanHtml.substring(0, 500)
        });
        return null;
      }
      
      const videoTitle = titleMatch[1].trim().replace(/^🎬\s*/, ''); // 移除emoji
      const channelTitle = channelMatch[1].trim();
      const videoUrl = urlMatch ? `https://www.youtube.com/watch?v=${urlMatch[1]}` : `https://www.youtube.com/watch?v=${videoId}`;
      
      // 生成 channelId (从URL或者使用频道名称的hash)
      const channelId = this.generateChannelId(channelTitle);
      
      return {
        videoId,
        videoTitle,
        channelId,
        channelTitle,
        publishedAt: timestamp.toISOString(),
        videoUrl,
        thumbnailUrl,
        timestamp,
        htmlPath,
        txtPath: htmlPath.replace('.html', '.txt'),
      };
    } catch (error: any) {
      const fileName = htmlPath.split('/').pop() || htmlPath;
      logger.warn(`解析 HTML 报告内容失败: ${fileName}`, {
        error: error.message || error,
        stack: error.stack
      });
      return null;
    }
  }

  /**
   * 生成频道ID（简化版）
   */
  private generateChannelId(channelTitle: string): string {
    // 简单的 hash 函数
    let hash = 0;
    for (let i = 0; i < channelTitle.length; i++) {
      const char = channelTitle.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `channel_${Math.abs(hash)}`;
  }

  /**
   * 从报告数据提取频道信息
   */
  private extractChannels(reports: ReportData[]): Map<string, ChannelData> {
    const channelsMap = new Map<string, ChannelData>();
    
    for (const report of reports) {
      const existing = channelsMap.get(report.channelId);
      
      if (existing) {
        existing.videoCount++;
        if (!existing.latestVideo || report.timestamp > existing.latestVideo) {
          existing.latestVideo = report.timestamp;
        }
      } else {
        channelsMap.set(report.channelId, {
          channelId: report.channelId,
          channelTitle: report.channelTitle,
          channelUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(report.channelTitle)}`,
          videoCount: 1,
          latestVideo: report.timestamp,
        });
      }
    }
    
    return channelsMap;
  }

  /**
   * 生成主索引页面
   */
  generateIndex(): void {
    try {
      logger.info('开始生成报告索引页面...');
      
      const reports = this.scanReports();
      const channels = this.extractChannels(reports);
      
      logger.info(`找到 ${reports.length} 个报告，${channels.size} 个频道`);
      
      const html = this.renderIndexHtml(reports, Array.from(channels.values()));
      
      const indexPath = join(this.reportsDir, 'index.html');
      writeFileSync(indexPath, html, 'utf-8');
      
      logger.info(`✅ 索引页面已生成: ${indexPath}`);
      logger.info(`📊 统计: ${reports.length} 个视频，${channels.size} 个频道`);
      
    } catch (error) {
      logger.error('生成索引页面失败', error);
      throw error;
    }
  }

  /**
   * 渲染 HTML
   */
  private renderIndexHtml(reports: ReportData[], channels: ChannelData[]): string {
    // 按日期分组
    const reportsByDate = this.groupReportsByDate(reports);
    
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>YouTube 视频分析报告 - 汇总</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      background: white;
      border-radius: 20px;
      padding: 30px;
      margin-bottom: 30px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
    }

    .header h1 {
      font-size: 32px;
      color: #2d3748;
      margin-bottom: 10px;
    }

    .header p {
      color: #718096;
      font-size: 16px;
    }

    .stats {
      display: flex;
      gap: 20px;
      margin-top: 20px;
    }

    .stat-item {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px 25px;
      border-radius: 12px;
      flex: 1;
    }

    .stat-label {
      font-size: 14px;
      opacity: 0.9;
    }

    .stat-value {
      font-size: 28px;
      font-weight: bold;
      margin-top: 5px;
    }

    /* 频道筛选器 */
    .channel-filter {
      background: white;
      border-radius: 20px;
      padding: 25px;
      margin-bottom: 30px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
    }

    .filter-title {
      font-size: 18px;
      color: #2d3748;
      margin-bottom: 20px;
      font-weight: 600;
    }

    .channel-avatars {
      display: flex;
      gap: 15px;
      overflow-x: auto;
      padding: 10px 0;
    }

    .channel-avatars::-webkit-scrollbar {
      height: 6px;
    }

    .channel-avatars::-webkit-scrollbar-thumb {
      background: #cbd5e0;
      border-radius: 3px;
    }

    .channel-avatar {
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      transition: transform 0.2s;
      min-width: 80px;
    }

    .channel-avatar:hover {
      transform: translateY(-5px);
    }

    .avatar-circle {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: bold;
      color: white;
      margin-bottom: 8px;
      border: 3px solid transparent;
      transition: all 0.3s;
      position: relative;
    }

    .channel-avatar.active .avatar-circle {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
    }

    .avatar-badge {
      position: absolute;
      top: -5px;
      right: -5px;
      background: #f56565;
      color: white;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      font-size: 11px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      border: 2px solid white;
    }

    .channel-name {
      font-size: 12px;
      color: #4a5568;
      text-align: center;
      max-width: 80px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .channel-avatar.active .channel-name {
      color: #667eea;
      font-weight: 600;
    }

    /* 日期分组 */
    .date-group {
      margin-bottom: 30px;
    }

    .date-header {
      background: white;
      padding: 15px 25px;
      border-radius: 12px;
      margin-bottom: 15px;
      font-size: 18px;
      font-weight: 600;
      color: #2d3748;
      box-shadow: 0 4px 15px rgba(0,0,0,0.08);
    }

    /* 视频卡片 */
    .video-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
    }

    .video-card {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 15px rgba(0,0,0,0.08);
      transition: all 0.3s;
      cursor: pointer;
    }

    .video-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 30px rgba(0,0,0,0.15);
    }

    .video-thumbnail {
      width: 100%;
      height: 200px;
      object-fit: cover;
      background: #e2e8f0;
    }

    .video-content {
      padding: 20px;
    }

    .video-title {
      font-size: 16px;
      font-weight: 600;
      color: #2d3748;
      margin-bottom: 10px;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .video-meta {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    }

    .channel-tag {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }

    .video-date {
      color: #718096;
      font-size: 13px;
    }

    .video-actions {
      display: flex;
      gap: 10px;
      margin-top: 15px;
    }

    .btn {
      flex: 1;
      padding: 10px;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
      text-align: center;
      display: block;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-primary:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }

    .btn-secondary {
      background: #edf2f7;
      color: #4a5568;
    }

    .btn-secondary:hover {
      background: #e2e8f0;
    }

    .empty-state {
      background: white;
      border-radius: 20px;
      padding: 60px;
      text-align: center;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
    }

    .empty-state-icon {
      font-size: 64px;
      margin-bottom: 20px;
    }

    .empty-state-text {
      font-size: 18px;
      color: #718096;
    }

    @media (max-width: 768px) {
      .video-grid {
        grid-template-columns: 1fr;
      }

      .stats {
        flex-direction: column;
      }

      .channel-avatars {
        justify-content: flex-start;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- 头部 -->
    <div class="header">
      <h1>📺 YouTube 视频分析报告</h1>
      <p>AI 驱动的视频内容智能分析与汇总</p>
      
      <div class="stats">
        <div class="stat-item">
          <div class="stat-label">总视频数</div>
          <div class="stat-value">${reports.length}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">频道数</div>
          <div class="stat-value">${channels.length}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">最新更新</div>
          <div class="stat-value">${reports.length > 0 ? this.formatDate(reports[0].timestamp) : '-'}</div>
        </div>
      </div>
    </div>

    <!-- 频道筛选器 -->
    <div class="channel-filter">
      <div class="filter-title">按 UP 主筛选</div>
      <div class="channel-avatars">
        <!-- 全部 -->
        <div class="channel-avatar active" data-channel="all" onclick="filterByChannel('all')">
          <div class="avatar-circle" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            全部
            <span class="avatar-badge">${reports.length}</span>
          </div>
          <div class="channel-name">全部</div>
        </div>
        
        ${channels.map((channel, index) => {
          const colors = this.getChannelColor(index);
          return `
        <div class="channel-avatar" data-channel="${channel.channelId}" onclick="filterByChannel('${channel.channelId}')">
          <div class="avatar-circle" style="background: ${colors};">
            ${this.getChannelInitial(channel.channelTitle)}
            <span class="avatar-badge">${channel.videoCount}</span>
          </div>
          <div class="channel-name">${channel.channelTitle}</div>
        </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- 视频列表 -->
    <div id="videoList">
      ${reportsByDate.length === 0 ? `
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <div class="empty-state-text">暂无视频报告</div>
      </div>
      ` : reportsByDate.map(({ date, reports: dateReports }) => `
      <div class="date-group" data-date="${date}">
        <div class="date-header">
          📅 ${this.formatDateHeader(date)}
        </div>
        <div class="video-grid">
          ${dateReports.map(report => this.renderVideoCard(report)).join('')}
        </div>
      </div>
      `).join('')}
    </div>
  </div>

  <script>
    // 当前选中的频道
    let currentChannel = 'all';

    // 按频道筛选
    function filterByChannel(channelId) {
      currentChannel = channelId;
      
      // 更新激活状态
      document.querySelectorAll('.channel-avatar').forEach(avatar => {
        avatar.classList.remove('active');
      });
      document.querySelector(\`[data-channel="\${channelId}"]\`).classList.add('active');
      
      // 筛选视频
      const allCards = document.querySelectorAll('.video-card');
      const allDateGroups = document.querySelectorAll('.date-group');
      
      if (channelId === 'all') {
        allCards.forEach(card => card.style.display = 'block');
        allDateGroups.forEach(group => group.style.display = 'block');
      } else {
        allCards.forEach(card => {
          const cardChannel = card.getAttribute('data-channel');
          card.style.display = cardChannel === channelId ? 'block' : 'none';
        });
        
        // 隐藏没有视频的日期组
        allDateGroups.forEach(group => {
          const visibleCards = group.querySelectorAll(\`.video-card[data-channel="\${channelId}"]\`);
          group.style.display = visibleCards.length > 0 ? 'block' : 'none';
        });
      }
    }

    // 打开视频
    function openVideo(url) {
      window.open(url, '_blank');
    }

    // 查看报告
    function viewReport(path) {
      window.open(path, '_blank');
    }

    // 页面加载完成
    document.addEventListener('DOMContentLoaded', () => {
      console.log('📊 报告索引加载完成');
      console.log('视频总数:', ${reports.length});
      console.log('频道数:', ${channels.length});
    });
  </script>
</body>
</html>`;
  }

  /**
   * 渲染视频卡片
   */
  private renderVideoCard(report: ReportData): string {
    const relativePath = report.htmlPath.split('/').pop() || report.htmlPath;
    
    return `
<div class="video-card" data-channel="${report.channelId}">
  <img 
    src="${report.thumbnailUrl || 'https://via.placeholder.com/400x200?text=No+Thumbnail'}" 
    alt="${report.videoTitle}"
    class="video-thumbnail"
    onerror="this.src='https://via.placeholder.com/400x200?text=No+Thumbnail'"
  />
  <div class="video-content">
    <div class="video-title">${report.videoTitle}</div>
    <div class="video-meta">
      <span class="channel-tag">${report.channelTitle}</span>
      <span class="video-date">${this.formatRelativeTime(report.timestamp)}</span>
    </div>
    <div class="video-actions">
      <button class="btn btn-primary" onclick="viewReport('${relativePath}')">
        📄 查看报告
      </button>
      <button class="btn btn-secondary" onclick="openVideo('${report.videoUrl}')">
        ▶️ 观看视频
      </button>
    </div>
  </div>
</div>`;
  }

  /**
   * 按日期分组
   */
  private groupReportsByDate(reports: ReportData[]): Array<{ date: string; reports: ReportData[] }> {
    const groups = new Map<string, ReportData[]>();
    
    for (const report of reports) {
      const dateKey = report.timestamp.toISOString().split('T')[0];
      const existing = groups.get(dateKey);
      
      if (existing) {
        existing.push(report);
      } else {
        groups.set(dateKey, [report]);
      }
    }
    
    // 转换为数组并按日期倒序排序
    return Array.from(groups.entries())
      .map(([date, reports]) => ({ date, reports }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  /**
   * 获取频道首字母
   */
  private getChannelInitial(channelTitle: string): string {
    return channelTitle.charAt(0).toUpperCase();
  }

  /**
   * 获取频道颜色
   */
  private getChannelColor(index: number): string {
    const colors = [
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)',
      'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
    ];
    
    return colors[index % colors.length];
  }

  /**
   * 格式化日期头部
   */
  private formatDateHeader(dateStr: string): string {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const dateKey = date.toISOString().split('T')[0];
    const todayKey = today.toISOString().split('T')[0];
    const yesterdayKey = yesterday.toISOString().split('T')[0];
    
    if (dateKey === todayKey) {
      return '今天';
    } else if (dateKey === yesterdayKey) {
      return '昨天';
    } else {
      return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    }
  }

  /**
   * 格式化相对时间
   */
  private formatRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }

  /**
   * 格式化日期（用于统计）
   */
  private formatDate(date: Date): string {
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return '今天';
    }
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }
}

