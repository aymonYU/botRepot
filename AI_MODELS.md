# AI 模型配置指南 🤖

## 问题

当前 `.env` 文件中的模型配置不正确：
```env
AI_MODEL=gemini-2.5-flash-preview-04-17-thinking  ❌ 此模型不存在
```

## 可用的 Gemini 模型

### 推荐模型（按优先级排序）

#### 1. **gemini-1.5-flash** ⭐ 推荐
```env
AI_MODEL=gemini-1.5-flash
```
- ✅ 速度快，适合批量处理
- ✅ 成本低
- ✅ 稳定可靠
- 📊 128K context window
- 💰 免费额度充足

#### 2. **gemini-1.5-pro**
```env
AI_MODEL=gemini-1.5-pro
```
- ✅ 更强大的推理能力
- ✅ 适合复杂分析
- 📊 2M context window
- 💰 成本较高

#### 3. **gemini-pro**
```env
AI_MODEL=gemini-pro
```
- ✅ 基础版本
- ✅ 稳定可靠
- 📊 32K context window
- 💰 成本适中

#### 4. **gemini-2.0-flash-exp** (实验性)
```env
AI_MODEL=gemini-2.0-flash-exp
```
- ✅ 最新实验模型
- ⚠️ 可能不稳定
- 📊 功能最新

## 快速修复

### 方法 1：直接编辑 .env 文件

```bash
# 打开 .env 文件
nano .env

# 或使用 VSCode
code .env
```

找到这一行：
```env
AI_MODEL=gemini-2.5-flash-preview-04-17-thinking
```

改为：
```env
AI_MODEL=gemini-1.5-flash
```

### 方法 2：使用命令行快速替换（Mac/Linux）

```bash
# 备份原文件
cp .env .env.backup

# 替换模型名称
sed -i '' 's/AI_MODEL=.*/AI_MODEL=gemini-1.5-flash/' .env

# 验证修改
grep AI_MODEL .env
```

### 方法 3：使用 echo 重写配置行

```bash
# 创建临时文件，替换 AI_MODEL 行
grep -v "^AI_MODEL=" .env > .env.tmp
echo "AI_MODEL=gemini-1.5-flash" >> .env.tmp
mv .env.tmp .env
```

## 验证配置

修改后，重启应用：

```bash
# 停止当前进程 (Ctrl+C)

# 重新启动
bun run src/index.ts
```

检查日志，应该不再看到模型错误。

## 不同场景的推荐配置

### 1. 开发测试环境
```env
AI_MODEL=gemini-1.5-flash
```
速度快，成本低，适合频繁测试。

### 2. 生产环境（高质量分析）
```env
AI_MODEL=gemini-1.5-pro
```
分析质量更高，适合重要内容。

### 3. 预算有限
```env
AI_MODEL=gemini-1.5-flash
MAX_VIDEOS_PER_CHECK=3
```
减少每次处理的视频数量，降低 API 调用次数。

### 4. 追求最新功能
```env
AI_MODEL=gemini-2.0-flash-exp
```
使用实验性模型，但可能不稳定。

## 使用自定义 OpenAI 兼容 API

如果你使用的是自定义的 OpenAI 兼容 API 端点（如你的 Deno 代理），确保：


### 确认模型名称映射

某些代理服务可能会重命名模型。检查你的代理文档或代码，确认：
- 输入的模型名称（在 `.env` 中配置的）
- 实际调用 Google API 时使用的模型名称

### 示例：Deno 代理配置

如果你的 Deno 代理支持模型映射，可能需要这样配置：

```env
# 你的代理端点
BASE_URL=

# 使用代理支持的模型名称
AI_MODEL=gemini-1.5-flash

# 或者如果代理有特殊前缀
AI_MODEL=models/gemini-1.5-flash
```

## 完整的 AI 配置示例

```env
# === AI Configuration ===

# OpenAI 兼容 API 端点
BASE_URL=

# Gemini API Key
OPENAI_API_KEY=

# 推荐：使用 gemini-1.5-flash（速度快，成本低）
AI_MODEL=gemini-1.5-flash

# 或者使用更强大的模型（成本更高）
# AI_MODEL=gemini-1.5-pro

# 或者使用基础模型
# AI_MODEL=gemini-pro
```

## 常见错误

### 错误 1：模型不存在
```
404 models/gemini-2.5-flash-preview-04-17-thinking is not found
```
**解决**：使用正确的模型名称（如 `gemini-1.5-flash`）

### 错误 2：API 配额超限
```
Resource has been exhausted (e.g. check quota)
```
**解决**：
1. 降低 `MAX_VIDEOS_PER_CHECK` 的值
2. 增加 `CHECK_INTERVAL_MINUTES` 的值
3. 升级 API 配额

### 错误 3：API Key 无效
```
Invalid API key
```
**解决**：
1. 检查 `OPENAI_API_KEY` 是否正确
2. 确认 API Key 有使用 Gemini API 的权限
3. 在 [Google AI Studio](https://makersuite.google.com/app/apikey) 重新生成 Key

## 测试 AI 配置

创建测试脚本验证配置是否正确：

```bash
# 手动触发一次检查
curl -X POST http://localhost:3000/api/check

# 查看日志
tail -f logs/app.log | grep -i "分析"
```

如果看到类似以下日志，说明配置正确：
```
[INFO] 开始分析视频: Video Title
[INFO] AI 分析完成
```

如果看到错误，检查：
1. 模型名称是否正确
2. API Key 是否有效
3. BASE_URL 是否可访问

## 性能优化建议

### 1. 批量处理优化
```env
MAX_VIDEOS_PER_CHECK=5  # 每次处理 5 个视频
CHECK_INTERVAL_MINUTES=30  # 每 30 分钟检查一次
```

### 2. 成本优化
```env
AI_MODEL=gemini-1.5-flash  # 使用成本最低的模型
MAX_VIDEOS_PER_CHECK=3  # 减少每次处理数量
```

### 3. 质量优先
```env
AI_MODEL=gemini-1.5-pro  # 使用最强大的模型
MAX_VIDEOS_PER_CHECK=2  # 减少数量以控制成本
```

---

**更新时间**: 2024-10-16

**相关文档**:
- [Google Gemini API 文档](https://ai.google.dev/docs)
- [故障排除指南](./TROUBLESHOOTING.md)

