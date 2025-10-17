# 🎬 YouTube Bot Report

一个自动监听 YouTube 频道视频更新，使用 AI 分析视频内容，并生成本地报告文件的智能系统。

## ✨ 功能特点

- 🔍 **自动监控**: 定时检查指定 YouTube 频道的新视频
- 🤖 **AI 分析**: 使用 Gemini Flash 模型分析视频内容
- 📊 **智能报告**: 生成包含摘要、关键点、标签和情感分析的详细报告
- 📄 **本地报告**: 自动生成精美的 HTML 和纯文本报告文件
- 🚀 **高性能**: 基于 Bun.js 运行时，性能卓越
- 🔄 **防重复**: 自动追踪已处理的视频，避免重复分析
- 🎯 **RESTful API**: 提供 HTTP API 进行手动控制

## 🛠️ 技术栈

- **运行时**: [Bun.js](https://bun.sh/)
- **Web 框架**: [Hono.js](https://hono.dev/)
- **AI 模型**: Gemini 2.5 Flash (通过 OpenAI 兼容 API)
- **YouTube API**: Google APIs Node.js Client
- **类型验证**: Zod
- **定时任务**: node-cron
- **语言**: TypeScript

## 📋 前置要求

1. **Bun.js**: 安装 [Bun](https://bun.sh/)
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

2. **YouTube API Key**: 
   - 访问 [Google Cloud Console](https://console.cloud.google.com/)
   - 创建项目并启用 YouTube Data API v3
   - 创建 API 密钥

3. **Gemini API Key**:
   - 已配置自定义 Gemini API 端点

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd botRepot
```

### 2. 安装依赖

```bash
bun install
```

### 3. 配置环境变量

复制 `.env.example` 创建 `.env` 文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的配置：

```env
# AI Configuration
BASE_URL=https://aymonyu-gemini-play-24.deno.dev/
OPENAI_API_KEY=你的_Gemini_API_密钥
AI_MODEL=gemini-2.5-flash-preview-04-17-thinking

# YouTube Configuration
YOUTUBE_API_KEY=你的_YouTube_API_密钥
YOUTUBE_CHANNEL_IDS=频道ID1,频道ID2,频道ID3

# Server Configuration
PORT=3000
NODE_ENV=development

# Scheduler Configuration
CHECK_INTERVAL_MINUTES=30
MAX_VIDEOS_PER_CHECK=5
```

### 4. 获取 YouTube 频道 ID

访问你想监控的频道页面，从 URL 中获取频道 ID：
- 方式1: `https://www.youtube.com/channel/UC...` (UC 后面的就是频道 ID)
- 方式2: 在频道页面查看源代码，搜索 `channelId`

### 5. 运行服务

#### 开发模式（自动重启）

```bash
bun run dev
```

#### 生产模式

```bash
bun start
```

#### 单次手动检查

```bash
bun run check
```

## 📡 API 端点

服务启动后，默认运行在 `http://localhost:3000`

### GET /

健康检查

```bash
curl http://localhost:3000/
```

### GET /api/status

获取服务状态

```bash
curl http://localhost:3000/api/status
```

### POST /api/check

手动触发一次视频检查

```bash
curl -X POST http://localhost:3000/api/check
```

### POST /api/scheduler/start

启动定时调度器

```bash
curl -X POST http://localhost:3000/api/scheduler/start
```

### POST /api/scheduler/stop

停止定时调度器

```bash
curl -X POST http://localhost:3000/api/scheduler/stop
```

## 📁 项目结构

```
botRepot/
├── src/
│   ├── config/           # 配置加载
│   │   └── index.ts
│   ├── modules/          # 功能模块
│   │   ├── youtube/      # YouTube API 客户端
│   │   ├── ai/           # AI 分析模块
│   │   └── notification/ # 通知服务
│   ├── utils/            # 工具函数
│   │   ├── logger.ts     # 日志工具
│   │   └── database.ts   # 视频记录数据库
│   ├── types/            # 类型定义
│   │   └── index.ts
│   ├── scheduler.ts      # 调度器
│   └── index.ts          # 主入口
├── data/                 # 数据存储目录
│   └── processed-videos.json
├── .specify/             # Speckit 配置
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 配置说明

### 环境变量详解

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `BASE_URL` | AI API 基础 URL | https://api.example.com/ |
| `OPENAI_API_KEY` | AI API 密钥 | AIza... |
| `AI_MODEL` | AI 模型名称 | gemini-2.5-flash-preview-04-17-thinking |
| `YOUTUBE_API_KEY` | YouTube API 密钥 | AIza... |
| `YOUTUBE_CHANNEL_IDS` | 监控的频道 ID（逗号分隔） | UC123,UC456 |
| `PORT` | HTTP 服务端口 | 3000 |
| `NODE_ENV` | 运行环境 | development/production |
| `CHECK_INTERVAL_MINUTES` | 检查间隔（分钟） | 30 |
| `MAX_VIDEOS_PER_CHECK` | 每次检查的最大视频数 | 5 |

## 📄 报告文件

系统会在 `reports/` 目录下生成报告文件，包含：

### 单个视频报告
- `{时间戳}_{视频ID}.html` - HTML 格式的精美报告
- `{时间戳}_{视频ID}.txt` - 纯文本格式报告

### 批量报告
- `batch_{时间戳}.html` - 合并的 HTML 批量报告
- `batch_{时间戳}.txt` - 合并的纯文本批量报告

### 报告内容包括：
- 📌 视频标题和频道信息
- 🖼️ 视频缩略图
- 📝 AI 生成的内容摘要
- 🎯 关键要点列表
- 💭 情感分析（积极/中性/消极）
- 🏷️ 相关标签
- 🔗 视频直达链接

## 🔄 工作流程

1. **定时检查**: 系统按照配置的间隔时间检查指定频道
2. **获取视频**: 通过 YouTube API 获取最新视频列表
3. **过滤处理**: 过滤出未处理的新视频
4. **AI 分析**: 使用 Gemini Flash 分析视频内容
5. **生成报告**: 生成包含分析结果的精美 HTML 和文本报告
6. **保存文件**: 将报告保存到本地 `reports/` 目录
7. **记录追踪**: 标记视频为已处理，避免重复

## 📝 Speckit 开发

项目使用 Speckit 进行开发管理。查看 constitution.md 了解项目规范。

### 使用 Speckit 命令

在 Cursor 中可以使用以下命令：

- `/speckit.analyze`: 分析项目需求
- `/speckit.plan`: 制定开发计划
- `/speckit.specify`: 编写功能规范
- `/speckit.implement`: 实现功能
- `/speckit.constitution`: 查看项目规范

## 🛡️ 最佳实践

### API 限制

- **YouTube API**: 每天有配额限制，合理设置 `CHECK_INTERVAL_MINUTES`
- **Gemini API**: 注意 API 调用频率限制

### 性能优化

- 增加 `CHECK_INTERVAL_MINUTES` 减少检查频率
- 减少 `MAX_VIDEOS_PER_CHECK` 降低每次处理量
- 监控 API 配额使用情况

## 🐛 故障排除

### 问题：无法连接 YouTube API

- 检查 API 密钥是否正确
- 确认 YouTube Data API v3 已启用
- 检查 API 配额是否用尽

### 问题：报告文件未生成

- 检查 `reports/` 目录权限
- 查看日志了解具体错误
- 确认磁盘空间充足

### 问题：AI 分析失败

- 检查 BASE_URL 和 API_KEY 是否正确
- 查看日志了解具体错误信息
- 确认 API 服务是否可用

## 📊 日志说明

系统使用结构化日志，包含：

- **INFO**: 常规操作信息
- **WARN**: 警告信息（不影响运行）
- **ERROR**: 错误信息（需要关注）
- **DEBUG**: 调试信息（仅开发环境）

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🙏 致谢

- [Bun.js](https://bun.sh/) - 超快的 JavaScript 运行时
- [Hono.js](https://hono.dev/) - 轻量级 Web 框架
- [Google APIs](https://github.com/googleapis/google-api-nodejs-client) - YouTube API 客户端
- [OpenAI](https://openai.com/) - AI 模型接口标准

---

**注意**: 请妥善保管 API 密钥和密码，不要将 `.env` 文件提交到版本控制系统。

