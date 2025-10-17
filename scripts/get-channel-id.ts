/**
 * 辅助脚本：通过频道用户名或自定义 URL 获取频道 ID
 * 
 * 使用方法：
 * 1. 单个频道：
 *    bun run scripts/get-channel-id.ts <频道用户名或URL>
 * 
 * 2. 多个频道：
 *    bun run scripts/get-channel-id.ts <频道1> <频道2> <频道3>
 * 
 * 3. 从文件批量读取：
 *    bun run scripts/get-channel-id.ts --file channels.txt
 * 
 * 示例：
 * bun run scripts/get-channel-id.ts @FinancialEducation
 * bun run scripts/get-channel-id.ts FinancialEducation Value-Investing
 * bun run scripts/get-channel-id.ts --file channels.txt
 */

import { google } from 'googleapis';
import { readFileSync, existsSync } from 'fs';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

if (!YOUTUBE_API_KEY) {
  console.error('❌ 错误: 请设置 YOUTUBE_API_KEY 环境变量');
  process.exit(1);
}

// 获取输入列表
let inputs: string[] = [];

if (process.argv[2] === '--file' || process.argv[2] === '-f') {
  // 从文件读取
  const filePath = process.argv[3] || 'channels.txt';
  
  if (!existsSync(filePath)) {
    console.error(`❌ 错误: 文件 ${filePath} 不存在`);
    console.log('\n💡 提示: 创建一个文本文件，每行一个频道名称');
    console.log('示例:');
    console.log('  echo "FinancialEducation\\nValue-Investing\\nOtherChannel" > channels.txt');
    process.exit(1);
  }
  
  const content = readFileSync(filePath, 'utf-8');
  inputs = content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#')); // 过滤空行和注释
    
  console.log(`📄 从文件 ${filePath} 读取了 ${inputs.length} 个频道\n`);
} else if (process.argv.length > 2) {
  // 从命令行参数获取
  inputs = process.argv.slice(2);
} else {
  console.error('❌ 错误: 请提供频道用户名、URL 或文件');
  console.log('\n使用方法:');
  console.log('  单个频道:');
  console.log('    bun run scripts/get-channel-id.ts <频道用户名或URL>');
  console.log('  多个频道:');
  console.log('    bun run scripts/get-channel-id.ts <频道1> <频道2> <频道3>');
  console.log('  从文件读取:');
  console.log('    bun run scripts/get-channel-id.ts --file channels.txt');
  console.log('\n示例:');
  console.log('  bun run scripts/get-channel-id.ts @FinancialEducation');
  console.log('  bun run scripts/get-channel-id.ts FinancialEducation Value-Investing');
  console.log('  bun run scripts/get-channel-id.ts --file channels.txt');
  process.exit(1);
}

async function getChannelId(input: string, youtube: any): Promise<{ id: string; title: string; } | null> {
  // 清理输入
  let username = input
    .replace('https://www.youtube.com/', '')
    .replace('http://www.youtube.com/', '')
    .replace('@', '')
    .replace('/c/', '')
    .replace('/user/', '')
    .replace('/channel/', '')
    .trim();

  try {
    // 方法 1: 尝试通过 forUsername 搜索
    const userResponse = await youtube.channels.list({
      part: ['id', 'snippet', 'statistics'],
      forUsername: username,
    });

    if (userResponse.data.items && userResponse.data.items.length > 0) {
      const channel = userResponse.data.items[0];
      return {
        id: channel.id,
        title: channel.snippet?.title || username,
      };
    }

    // 方法 2: 如果已经是频道 ID，直接获取
    if (username.startsWith('UC') && username.length === 24) {
      const idResponse = await youtube.channels.list({
        part: ['id', 'snippet', 'statistics'],
        id: [username],
      });

      if (idResponse.data.items && idResponse.data.items.length > 0) {
        const channel = idResponse.data.items[0];
        return {
          id: channel.id,
          title: channel.snippet?.title || username,
        };
      }
    }

    // 方法 3: 通过搜索 API 查找
    const searchResponse = await youtube.search.list({
      part: ['snippet'],
      q: username,
      type: ['channel'],
      maxResults: 1,
    });

    if (searchResponse.data.items && searchResponse.data.items.length > 0) {
      const item = searchResponse.data.items[0];
      if (item.snippet?.channelId) {
        return {
          id: item.snippet.channelId,
          title: item.snippet?.title || username,
        };
      }
    }

    return null;
  } catch (error: any) {
    console.error(`  ❌ 错误: ${error.message}`);
    return null;
  }
}

async function getChannelDetails(channelId: string, youtube: any): Promise<any> {
  const response = await youtube.channels.list({
    part: ['id', 'snippet', 'statistics'],
    id: [channelId],
  });
  
  return response.data.items?.[0] || null;
}

function printChannelInfo(channel: any): void {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ 频道信息:\n');
  console.log(`📺 频道名称: ${channel.snippet?.title}`);
  console.log(`🆔 频道 ID: ${channel.id}`);
  console.log(`📝 描述: ${channel.snippet?.description?.slice(0, 150)}...`);
  console.log(`👥 订阅者: ${formatNumber(channel.statistics?.subscriberCount)}`);
  console.log(`🎬 视频数: ${formatNumber(channel.statistics?.videoCount)}`);
  console.log(`👀 总观看: ${formatNumber(channel.statistics?.viewCount)}`);
  console.log(`🔗 链接: https://www.youtube.com/channel/${channel.id}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('💡 复制以下频道 ID 到你的 .env 文件中:');
  console.log(`   ${channel.id}\n`);
}

function formatNumber(num: string | undefined): string {
  if (!num) return 'N/A';
  return parseInt(num).toLocaleString();
}

// 主函数：批量处理
async function main() {
  const youtube = google.youtube({
    version: 'v3',
    auth: YOUTUBE_API_KEY,
  });

  // 可配置的延迟时间（毫秒）
  const DELAY_MS = parseInt(process.env.BATCH_DELAY || '1000');
  
  console.log(`🚀 开始处理 ${inputs.length} 个频道...`);
  console.log(`⏱️  每个请求间隔: ${DELAY_MS}ms`);
  console.log(`📊 预计耗时: ~${Math.ceil(inputs.length * DELAY_MS / 1000)}秒\n`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const results: Array<{ input: string; id: string | null; title: string | null; error?: string }> = [];
  let errorCount = 0;

  // 批量获取频道 ID
  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    console.log(`[${i + 1}/${inputs.length}] 🔍 查找频道: ${input}`);
    
    try {
      const result = await getChannelId(input, youtube);
      
      if (result) {
        console.log(`  ✅ 找到: ${result.title}`);
        console.log(`  🆔 ID: ${result.id}\n`);
        results.push({ input, id: result.id, title: result.title });
      } else {
        console.log(`  ❌ 未找到\n`);
        results.push({ input, id: null, title: null });
      }
    } catch (error: any) {
      errorCount++;
      console.log(`  ⚠️  查询失败: ${error.message}\n`);
      results.push({ input, id: null, title: null, error: error.message });
      
      // 如果是配额错误，提示用户
      if (error.message.includes('quota') || error.message.includes('Quota')) {
        console.log('  ⚠️  可能遇到 API 配额限制，但会继续尝试...\n');
      }
    }
    
    // 添加延迟以避免 API 限流（最后一个不需要延迟）
    if (i < inputs.length - 1) {
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 统计结果
  const successCount = results.filter(r => r.id).length;
  const failCount = results.filter(r => !r.id).length;

  console.log(`📊 处理完成: 总共 ${inputs.length} 个频道`);
  console.log(`   ✅ 成功: ${successCount} 个`);
  console.log(`   ❌ 失败: ${failCount} 个`);
  if (errorCount > 0) {
    console.log(`   ⚠️  错误: ${errorCount} 个\n`);
  } else {
    console.log('');
  }

  // 显示成功的频道详细信息
  if (successCount > 0) {
    console.log('✅ 成功获取的频道:\n');
    
    for (const result of results) {
      if (result.id) {
        const details = await getChannelDetails(result.id, youtube);
        if (details) {
          printChannelInfo(details);
        }
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 复制以下内容到 .env 文件中:\n');
    
    const channelIds = results
      .filter(r => r.id)
      .map(r => r.id)
      .join(',');
    
    console.log('YOUTUBE_CHANNEL_IDS=' + channelIds);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 显示对照表
    console.log('📝 频道名称对照:\n');
    for (const result of results) {
      if (result.id) {
        console.log(`  ${result.title}`);
        console.log(`  └─ ${result.id}\n`);
      }
    }
  }

  // 显示失败的频道
  if (failCount > 0) {
    console.log('\n❌ 未找到或失败的频道:\n');
    for (const result of results) {
      if (!result.id) {
        if (result.error) {
          console.log(`  - ${result.input}`);
          console.log(`    错误: ${result.error}`);
        } else {
          console.log(`  - ${result.input} (未找到)`);
        }
      }
    }
    console.log('\n💡 提示:');
    console.log('  1. 检查频道名称拼写是否正确');
    console.log('  2. 尝试使用完整的 YouTube URL');
    console.log('  3. 如果遇到配额错误，等待一段时间后重试');
    console.log('  4. 可以设置更长的延迟: BATCH_DELAY=2000 bun run scripts/get-channel-id.ts ...\n');
  }
  
  // 显示总体信息
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✨ 批量处理完成！成功率: ${Math.round(successCount / inputs.length * 100)}%`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// 运行脚本
main().catch(error => {
  console.error('❌ 脚本执行失败:', error);
  
  if (error.message && error.message.includes('YouTube Data API v3 has not been used')) {
    console.log('\n⚠️  YouTube Data API v3 未启用！');
    console.log('📝 请按以下步骤操作：');
    console.log('1. 访问: https://console.developers.google.com/apis/api/youtube.googleapis.com');
    console.log('2. 选择你的项目');
    console.log('3. 点击 "Enable" 按钮启用 API');
    console.log('4. 等待几分钟后重试');
  }
  
  process.exit(1);
});

