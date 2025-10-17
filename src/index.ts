import { Hono } from 'hono';
import { loadConfig } from '@/config';
import { VideoScheduler } from '@/scheduler';
import { logger } from '@/utils/logger';

const app = new Hono();

// 全局调度器实例 - 使用 globalThis 避免热重载时重复创建
declare global {
  var __scheduler: VideoScheduler | null;
}

let scheduler = globalThis.__scheduler || null;

// 健康检查端点
app.get('/', (c) => {
  return c.json({
    status: 'ok',
    message: 'YouTube Bot Report API is running',
    timestamp: new Date().toISOString(),
  });
});

// 获取服务状态
app.get('/api/status', (c) => {
  return c.json({
    status: scheduler ? 'running' : 'stopped',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
  });
});

// 手动触发一次检查
app.post('/api/check', async (c) => {
  try {
    logger.info('收到手动触发检查请求');
    
    if (!scheduler) {
      scheduler = new VideoScheduler();
    }

    // 在后台执行检查
    scheduler.runOnce().catch(error => {
      logger.error('手动检查失败', error);
    });

    return c.json({
      success: true,
      message: '视频检查任务已启动',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('手动触发检查失败', error);
    return c.json({
      success: false,
      message: '触发检查失败',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// 手动生成报告索引
app.post('/api/generate-index', async (c) => {
  try {
    logger.info('收到手动生成索引请求');
    
    const { ReportIndexGenerator } = await import('@/utils/report-index');
    const { join } = await import('path');
    
    const reportsDir = join(process.cwd(), 'reports');
    const generator = new ReportIndexGenerator(reportsDir);
    generator.generateIndex();

    return c.json({
      success: true,
      message: '报告索引页面已生成',
      path: 'reports/index.html',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('生成索引失败', error);
    return c.json({
      success: false,
      message: '生成索引失败',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// 启动调度器端点
app.post('/api/scheduler/start', async (c) => {
  try {
    if (scheduler) {
      return c.json({
        success: false,
        message: '调度器已经在运行',
      }, 400);
    }

    const config = loadConfig();
    scheduler = new VideoScheduler();
    scheduler.start(config.CHECK_INTERVAL_MINUTES);

    return c.json({
      success: true,
      message: `调度器已启动，检查间隔: ${config.CHECK_INTERVAL_MINUTES} 分钟`,
    });
  } catch (error) {
    logger.error('启动调度器失败', error);
    return c.json({
      success: false,
      message: '启动调度器失败',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// 停止调度器端点
app.post('/api/scheduler/stop', (c) => {
  if (!scheduler) {
    return c.json({
      success: false,
      message: '调度器未运行',
    }, 400);
  }

  scheduler.stop();
  scheduler = null;

  return c.json({
    success: true,
    message: '调度器已停止',
  });
});

// 404 处理
app.notFound((c) => {
  return c.json({
    error: 'Not Found',
    path: c.req.path,
  }, 404);
});

// 错误处理
app.onError((err, c) => {
  logger.error('API 错误', err);
  return c.json({
    error: 'Internal Server Error',
    message: err.message,
  }, 500);
});

// 启动服务器（仅在首次加载时执行）
if (!globalThis.__scheduler) {
  const config = loadConfig();
  
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.info('🚀 YouTube Bot Report 正在启动...');
  logger.info(`📡 服务器端口: ${config.PORT || 3000}`);
  logger.info(`🔧 环境: ${config.NODE_ENV}`);
  logger.info(`⏰ 检查间隔: ${config.CHECK_INTERVAL_MINUTES} 分钟`);
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // 自动启动调度器
  scheduler = new VideoScheduler();
  scheduler.start(config.CHECK_INTERVAL_MINUTES);
  
  // 保存到全局，防止热重载时重复创建
  globalThis.__scheduler = scheduler;

  // 优雅关闭
  process.on('SIGINT', () => {
    logger.info('收到退出信号，正在关闭服务...');
    if (scheduler) {
      scheduler.stop();
    }
    globalThis.__scheduler = null;
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    logger.info('收到退出信号，正在关闭服务...');
    if (scheduler) {
      scheduler.stop();
    }
    globalThis.__scheduler = null;
    process.exit(0);
  });
}

// 导出 Bun 服务器配置（Bun 原生方式）
const config = loadConfig();
export default {
  port: config.PORT || 3000,
  fetch: app.fetch,
};

