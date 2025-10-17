# 报告索引页面生成指南 📊

## 功能说明

系统会自动生成一个漂亮的 `index.html` 页面，汇总所有视频分析报告。

### ✨ 主要功能

1. **自动更新** - 每次保存新报告时自动更新索引
2. **按日期归类** - 今天、昨天、具体日期
3. **按 UP 主筛选** - 点击头像查看特定频道的视频
4. **响应式设计** - 支持手机、平板、电脑
5. **实时统计** - 显示总视频数、频道数、最新更新时间

### 🎨 界面特点

- **频道头像** - 每个频道都有独特的颜色和徽章（显示视频数量）
- **视频卡片** - 包含缩略图、标题、频道、时间
- **一键访问** - 直接查看报告或观看视频
- **美观UI** - 渐变色、阴影效果、动画交互

## 使用方法

### 自动生成（推荐）

系统会在每次生成新报告时自动更新索引页面，无需手动操作！

```bash
# 正常运行应用即可
bun run src/index.ts

# 或手动触发一次检查
curl -X POST http://localhost:3000/api/check
```

### 手动生成

如果需要手动重新生成索引页面：

```bash
# 方法 1: 使用 TypeScript 脚本
bun run scripts/generate-index.ts

# 方法 2: 使用 tsx（如果安装了）
npx tsx scripts/generate-index.ts

# 方法 3: 通过 API
curl -X POST http://localhost:3000/api/generate-index
```

### 查看索引页面

```bash
# 在浏览器中打开
open reports/index.html

# 或访问（如果服务器运行中）
open http://localhost:3000/reports/
```

## 页面结构

```
reports/
├── index.html                         # 主索引页面 ⭐
├── 2025-10-17T03-00-00-000Z_abc.html # 单个视频报告
├── 2025-10-17T02-30-00-000Z_xyz.html
├── 2025-10-16T15-20-00-000Z_123.html
├── batch_2025-10-17T03-00-00-000Z.html  # 批量报告
└── ...
```

## 索引页面功能

### 1. 频道筛选

点击顶部的频道头像可以筛选该频道的视频：

- **全部** - 显示所有视频（默认）
- **频道 A** - 只显示频道 A 的视频
- **频道 B** - 只显示频道 B 的视频
- ...

每个头像右上角的徽章数字表示该频道的视频数量。

### 2. 日期分组

视频按发布日期自动分组：

- **今天** - 今天生成的报告
- **昨天** - 昨天生成的报告
- **具体日期** - 更早的报告（如"10月15日"）

### 3. 视频卡片

每个视频卡片包含：

- **缩略图** - 视频封面
- **标题** - 视频标题（最多显示2行）
- **频道标签** - 彩色渐变标签
- **相对时间** - "2小时前"、"昨天"等
- **操作按钮**：
  - 📄 查看报告 - 打开详细分析报告
  - ▶️ 观看视频 - 跳转到 YouTube

### 4. 统计信息

页面顶部显示：

- **总视频数** - 所有已分析的视频数量
- **频道数** - 监控的频道总数
- **最新更新** - 最近一次报告生成时间

## 自定义

### 修改样式

编辑 `src/utils/report-index.ts` 中的 CSS 样式：

```typescript
// 修改主题颜色
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

// 修改频道颜色
const colors = [
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  // 添加更多颜色...
];
```

### 添加新功能

在 `src/utils/report-index.ts` 中的 `renderIndexHtml` 方法中添加新的 HTML 和 JavaScript。

## 故障排除

### 问题 1: 索引页面没有更新

**解决方案**：

```bash
# 手动重新生成
bun run scripts/generate-index.ts

# 或删除旧索引，重新生成
rm reports/index.html
curl -X POST http://localhost:3000/api/check
```

### 问题 2: 某些视频没有显示

**原因**：
- 报告文件名格式不正确
- HTML 内容格式不符合解析规则

**解决方案**：

确保报告文件名格式为：
```
YYYY-MM-DDTHH-MM-SS-SSSZ_videoId.html
```

### 问题 3: 频道筛选不工作

**解决方案**：

打开浏览器开发者工具（F12）查看 JavaScript 错误。通常是因为：
- 浏览器缓存问题 - 按 Ctrl+F5 强制刷新
- JavaScript 被禁用 - 启用浏览器 JavaScript

### 问题 4: 样式显示异常

**解决方案**：

```bash
# 清除浏览器缓存
# Chrome: Ctrl+Shift+Del
# Firefox: Ctrl+Shift+Del
# Safari: Cmd+Option+E

# 重新生成索引
bun run scripts/generate-index.ts
```

## 性能优化

### 大量报告（100+ 个）

如果报告数量很多，页面加载可能变慢。优化建议：

1. **分页显示** - 修改代码添加分页功能
2. **懒加载** - 只加载可见区域的图片
3. **归档旧报告** - 将旧报告移到 `reports/archive/` 目录

### 定期清理

```bash
# 删除 30 天前的报告
find reports/ -name "*.html" -mtime +30 -delete
find reports/ -name "*.txt" -mtime +30 -delete

# 重新生成索引
bun run scripts/generate-index.ts
```

## API 端点

### 生成索引（未来功能）

```bash
# POST /api/generate-index
curl -X POST http://localhost:3000/api/generate-index

# 响应
{
  "success": true,
  "videoCount": 42,
  "channelCount": 5,
  "message": "索引页面已生成"
}
```

## 示例

### 创建测试数据

```bash
# 创建示例报告
node << 'EOF'
const fs = require('fs');
const path = require('path');

const reportsDir = path.join(process.cwd(), 'reports');
fs.mkdirSync(reportsDir, { recursive: true });

const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>测试</title></head>
<body>
  <h2 class="video-title">测试视频标题</h2>
  <p class="channel">频道：<strong>测试频道</strong></p>
  <img src="https://via.placeholder.com/400x200" class="thumbnail" />
</body></html>`;

fs.writeFileSync(
  path.join(reportsDir, `${new Date().toISOString().replace(/[:.]/g, '-')}_test123.html`),
  html
);
console.log('✅ 测试报告已创建');
EOF

# 生成索引
bun run scripts/generate-index.ts

# 打开查看
open reports/index.html
```

## 技术细节

### 报告解析

系统通过正则表达式从 HTML 中提取以下信息：

- **视频标题**：`<h2 class="video-title">...</h2>`
- **频道名称**：`<p class="channel">频道：<strong>...</strong></p>`
- **视频链接**：`https://www.youtube.com/watch?v=...`
- **缩略图**：`<img ... class="thumbnail" ... />`

### 数据结构

```typescript
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
```

### 工作流程

```
1. 扫描 reports/ 目录
2. 解析所有 .html 文件（跳过 batch_ 和 index.html）
3. 提取视频和频道信息
4. 按日期分组
5. 统计频道数据
6. 生成 HTML
7. 保存为 index.html
```

## 预览

索引页面效果：

```
┌─────────────────────────────────────────────┐
│ 📺 YouTube 视频分析报告                     │
│ AI 驱动的视频内容智能分析与汇总             │
├─────────────────────────────────────────────┤
│ 总视频数 | 频道数 | 最新更新                │
│   42     |   5    |  今天                   │
├─────────────────────────────────────────────┤
│ 按 UP 主筛选                                │
│ [全部 42] [频道A 15] [频道B 12] [频道C 8]  │
├─────────────────────────────────────────────┤
│ 📅 今天                                     │
│ ┌────────┐ ┌────────┐ ┌────────┐          │
│ │[缩略图]│ │[缩略图]│ │[缩略图]│          │
│ │ 标题   │ │ 标题   │ │ 标题   │          │
│ │ [频道] │ │ [频道] │ │ [频道] │          │
│ └────────┘ └────────┘ └────────┘          │
├─────────────────────────────────────────────┤
│ 📅 昨天                                     │
│ ┌────────┐ ┌────────┐                     │
│ │[缩略图]│ │[缩略图]│                     │
│ │ 标题   │ │ 标题   │                     │
│ │ [频道] │ │ [频道] │                     │
│ └────────┘ └────────┘                     │
└─────────────────────────────────────────────┘
```

---

**更新时间**: 2024-10-17
**相关文档**: [README.md](./README.md), [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

