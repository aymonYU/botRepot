/**
 * 创建示例报告用于测试索引页面
 * 
 * 使用方法：
 * bun run scripts/create-sample-reports.ts
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const reportsDir = join(process.cwd(), 'reports');

// 确保目录存在
if (!existsSync(reportsDir)) {
  mkdirSync(reportsDir, { recursive: true });
}

// 示例数据
const sampleReports = [
  {
    videoId: 'dQw4w9WgXcQ',
    title: '如何开始价值投资 - 巴菲特的投资哲学',
    channel: 'Value Investing',
    thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    date: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2小时前
  },
  {
    videoId: 'abc123def456',
    title: '理财新手必看：财务自由的第一步',
    channel: 'Financial Education',
    thumbnail: 'https://i.ytimg.com/vi/abc123def456/maxresdefault.jpg',
    date: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5小时前
  },
  {
    videoId: 'xyz789ghi012',
    title: '2024年最值得投资的5只股票',
    channel: 'Value Investing',
    thumbnail: 'https://i.ytimg.com/vi/xyz789ghi012/maxresdefault.jpg',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1天前
  },
  {
    videoId: 'jkl345mno678',
    title: '如何避免投资陷阱：巴菲特给投资者的建议',
    channel: 'Financial Education',
    thumbnail: 'https://i.ytimg.com/vi/jkl345mno678/maxresdefault.jpg',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1天前
  },
  {
    videoId: 'pqr901stu234',
    title: '长期投资vs短期交易：哪个更适合你？',
    channel: 'Investment Insights',
    thumbnail: 'https://i.ytimg.com/vi/pqr901stu234/maxresdefault.jpg',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2天前
  },
  {
    videoId: 'vwx567yz8901',
    title: '如何读懂财报：基本面分析入门',
    channel: 'Investment Insights',
    thumbnail: 'https://i.ytimg.com/vi/vwx567yz8901/maxresdefault.jpg',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3天前
  },
];

console.log('📝 开始创建示例报告...\n');

for (const report of sampleReports) {
  const timestamp = report.date.toISOString().replace(/[:.]/g, '-');
  const filename = `${timestamp}_${report.videoId}`;
  
  // 生成 HTML 报告
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${report.title} - 视频分析报告</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
    .video-header { margin-bottom: 30px; }
    h2.video-title { color: #2d3748; margin-bottom: 15px; }
    .thumbnail { width: 100%; max-width: 600px; height: auto; border-radius: 8px; margin: 20px 0; }
    p.channel { color: #4a5568; }
    .content { line-height: 1.6; }
  </style>
</head>
<body>
  <div class="video-header">
    <h2 class="video-title">${report.title}</h2>
    <p class="channel">频道：<strong>${report.channel}</strong></p>
    <p>发布时间：${report.date.toLocaleString('zh-CN')}</p>
    <p>视频链接：<a href="https://www.youtube.com/watch?v=${report.videoId}" target="_blank">https://www.youtube.com/watch?v=${report.videoId}</a></p>
    <img src="${report.thumbnail}" alt="${report.title}" class="thumbnail" />
  </div>
  
  <div class="content">
    <h3>📝 内容摘要</h3>
    <p>这个视频深入探讨了${report.title}的相关内容，为观众提供了宝贵的投资见解和实用建议。</p>
    
    <h3>🎯 关键要点</h3>
    <ol>
      <li>理解投资的基本原则和核心概念</li>
      <li>学习如何评估投资机会</li>
      <li>掌握风险管理的重要技巧</li>
    </ol>
    
    <h3>💭 情感分析</h3>
    <p>😊 积极正面</p>
    
    <h3>🏷️ 相关标签</h3>
    <p>投资, 理财, 财务自由, 价值投资</p>
  </div>
  
  <hr style="margin: 40px 0;">
  <p style="text-align: center; color: #718096; font-size: 14px;">
    分析时间：${new Date().toLocaleString('zh-CN')}<br>
    这是一封自动生成的视频分析报告
  </p>
</body>
</html>`;

  // 生成文本报告
  const txt = `🎬 新视频分析报告

标题：${report.title}
频道：${report.channel}
发布时间：${report.date.toLocaleString('zh-CN')}
视频链接：https://www.youtube.com/watch?v=${report.videoId}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 内容摘要：
这个视频深入探讨了${report.title}的相关内容，为观众提供了宝贵的投资见解和实用建议。

🎯 关键要点：
1. 理解投资的基本原则和核心概念
2. 学习如何评估投资机会
3. 掌握风险管理的重要技巧

💭 情感分析：😊 积极正面

🏷️ 相关标签：
投资, 理财, 财务自由, 价值投资

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

分析时间：${new Date().toLocaleString('zh-CN')}
这是一封自动生成的视频分析报告`;

  // 保存文件
  const htmlPath = join(reportsDir, `${filename}.html`);
  const txtPath = join(reportsDir, `${filename}.txt`);
  
  writeFileSync(htmlPath, html, 'utf-8');
  writeFileSync(txtPath, txt, 'utf-8');
  
  console.log(`✅ 已创建: ${filename}`);
}

console.log(`\n🎉 成功创建 ${sampleReports.length} 个示例报告！`);
console.log('\n下一步：运行以下命令生成索引页面');
console.log('  bun run scripts/generate-index.ts\n');

