# 📊 视频分析报告目录

这个目录包含所有的视频分析报告。

## 📁 文件说明

- **`index.html`** ⭐ - 主索引页面，汇总所有报告
- **`YYYY-MM-DDTHH-MM-SS-SSSZ_videoId.html`** - 单个视频的 HTML 报告
- **`YYYY-MM-DDTHH-MM-SS-SSSZ_videoId.txt`** - 单个视频的文本报告
- **`batch_YYYY-MM-DDTHH-MM-SS-SSSZ.html`** - 批量视频报告（合并）

## 🌐 查看报告

### 方法 1: 直接打开

```bash
# 打开主索引页面
open index.html
```

### 方法 2: 使用 HTTP 服务器

```bash
# 启动本地服务器
python3 -m http.server 8000

# 然后在浏览器访问
# http://localhost:8000
```

## ✨ 索引页面功能

- **按日期分组** - 今天、昨天、具体日期
- **按频道筛选** - 点击UP主头像查看特定频道
- **视频卡片** - 包含缩略图、标题、频道、时间
- **快速访问** - 一键查看报告或观看视频
- **实时统计** - 总视频数、频道数、最新更新时间

## 🔄 自动更新

索引页面会在以下情况自动更新：

- 生成新的视频报告时
- 手动调用 API: `POST /api/generate-index`
- 运行脚本: `bun run scripts/generate-index.ts`

## 📝 报告格式

### 单个视频报告

文件名格式：
```
2025-10-17T05-30-45-123Z_dQw4w9WgXcQ.html
```

包含内容：
- 视频标题
- 频道信息
- 发布时间
- 视频链接
- 缩略图
- AI 分析结果（摘要、关键点、情感分析、标签）

### 批量报告

文件名格式：
```
batch_2025-10-17T05-30-45-123Z.html
```

包含多个视频的合并报告。

## 🎨 自定义

如果需要自定义索引页面样式，请编辑：
```
src/utils/report-index.ts
```

## 📊 统计

报告目录会随时间增长。建议定期清理旧报告：

```bash
# 删除 30 天前的报告
find . -name "*.html" -mtime +30 -delete
find . -name "*.txt" -mtime +30 -delete

# 重新生成索引
curl -X POST http://localhost:3000/api/generate-index
```

## 🔗 相关链接

- [主项目文档](../README.md)
- [索引生成指南](../INDEX_GENERATION.md)
- [快速开始](../QUICK_START.md)

---

**自动生成** - 此目录由 YouTube Bot Report 系统管理

