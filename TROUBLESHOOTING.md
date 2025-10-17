# 故障排除指南 🔧

本文档帮助你解决使用 YouTube Bot Report 时可能遇到的常见问题。

## 目录

1. [YouTube Data API v3 未启用](#youtube-data-api-v3-未启用)
2. [端口被占用](#端口被占用)
3. [频道 ID 错误](#频道-id-错误)
4. [邮件发送失败](#邮件发送失败)
5. [AI API 调用失败](#ai-api-调用失败)
6. [数据库问题](#数据库问题)

---

## YouTube Data API v3 未启用

### 错误信息
```
YouTube Data API v3 has not been used in project XXXXXXX before or it is disabled.
```

### 解决方案

#### 方法 1: 直接启用（推荐）

1. 点击错误信息中提供的链接，或访问：
   ```
   https://console.developers.google.com/apis/api/youtube.googleapis.com
   ```

2. 选择你的 Google Cloud 项目

3. 点击 **"ENABLE"** 按钮

4. 等待 2-5 分钟让更改生效

#### 方法 2: 通过 Console 手动启用

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)

2. 在左侧菜单中，选择 **"APIs & Services"** > **"Library"**

3. 在搜索框中输入 "YouTube Data API v3"

4. 点击搜索结果中的 **"YouTube Data API v3"**

5. 点击 **"ENABLE"** 按钮

6. 等待几分钟让更改生效

#### 验证 API 是否已启用

运行以下命令测试 API：

```bash
bun run scripts/get-channel-id.ts @FinancialEducation
```

如果能看到频道信息，说明 API 已成功启用。

---

## 端口被占用

### 错误信息
```
error: Failed to start server. Is port 3000 in use?
code: "EADDRINUSE"
```

### 解决方案

#### 方法 1: 杀死占用端口的进程

```bash
# 查找并杀死占用 3000 端口的进程
lsof -ti:3000 | xargs kill -9
```

#### 方法 2: 使用不同的端口

修改 `.env` 文件中的端口号：

```env
PORT=3001
```

或在运行时指定：

```bash
PORT=3001 bun run src/index.ts
```

#### 方法 3: 优雅重启

```bash
# 停止所有 Node/Bun 进程
pkill -f "bun"

# 重新启动
bun run src/index.ts
```

---

## 频道 ID 错误

### 问题描述

YouTube API 需要使用频道 ID（通常以 `UC` 开头），而不是频道的用户名或自定义 URL。

### 错误的格式 ❌
```env
YOUTUBE_CHANNEL_IDS=FinancialEducation,Value-Investing
YOUTUBE_CHANNEL_IDS=@FinancialEducation,@Value-Investing
YOUTUBE_CHANNEL_IDS=https://www.youtube.com/@FinancialEducation
```

### 正确的格式 ✅
```env
YOUTUBE_CHANNEL_IDS=UCxxxxxxxxxxxxxxxxxxxxxx,UCyyyyyyyyyyyyyyyyyyyyyy
```

### 如何获取频道 ID

#### 方法 1: 使用辅助脚本（推荐）

```bash
# 通过用户名获取
bun run scripts/get-channel-id.ts FinancialEducation

# 通过 @ 用户名获取
bun run scripts/get-channel-id.ts @FinancialEducation

# 通过完整 URL 获取
bun run scripts/get-channel-id.ts "https://www.youtube.com/@FinancialEducation"
```

脚本会显示频道 ID，复制到你的 `.env` 文件中。

#### 方法 2: 从浏览器获取

1. 访问 YouTube 频道页面
2. 右键点击页面，选择 **"查看页面源代码"**
3. 搜索 `"channelId"` 或 `"externalId"`
4. 复制找到的 ID（格式：`UCxxxxxxxxxxxxxxxxxxxxxx`）

#### 方法 3: 使用浏览器扩展

安装 Chrome 扩展 [YouTube Channel ID Finder](https://chrome.google.com/webstore)

#### 批量获取多个频道 ID

创建一个临时脚本：

```bash
# 创建文件 channels.txt，每行一个频道用户名
echo "FinancialEducation
Value-Investing
OtherChannel" > channels.txt

# 批量获取
while read channel; do
  echo "=== $channel ==="
  bun run scripts/get-channel-id.ts "$channel"
  echo ""
done < channels.txt
```

---

## 邮件发送失败

### 问题 1: Gmail 认证失败

#### 错误信息
```
Invalid login: 535-5.7.8 Username and Password not accepted
```

#### 解决方案

Gmail 需要使用 **应用专用密码**，而不是你的 Gmail 密码。

1. 访问 [Google Account Security](https://myaccount.google.com/security)

2. 确保启用了 **两步验证**

3. 在 "Signing in to Google" 部分，找到 **"App passwords"**

4. 创建新的应用专用密码：
   - 选择应用：选择 "Mail"
   - 选择设备：选择 "Other" 并输入 "YouTube Bot Report"

5. 复制生成的 16 位密码

6. 更新 `.env` 文件：
   ```env
   EMAIL_PASSWORD=your_16_digit_app_password
   ```

### 问题 2: SMTP 连接失败

#### 检查配置

确保 `.env` 中的 SMTP 设置正确：

```env
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_SECURE=false
```

或使用 SSL：

```env
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=465
EMAIL_SMTP_SECURE=true
```

### 问题 3: 使用其他邮件服务

#### Outlook/Hotmail
```env
EMAIL_SMTP_HOST=smtp-mail.outlook.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_SECURE=false
```

#### QQ 邮箱
```env
EMAIL_SMTP_HOST=smtp.qq.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_SECURE=false
```

#### 163 邮箱
```env
EMAIL_SMTP_HOST=smtp.163.com
EMAIL_SMTP_PORT=465
EMAIL_SMTP_SECURE=true
```

---

## AI API 调用失败

### 问题 1: API Key 无效

#### 错误信息
```
Error: Invalid API key
```

#### 解决方案

1. 检查 `.env` 文件中的 `OPENAI_API_KEY` 是否正确

2. 如果使用 Gemini API，确保 API Key 有效：
   - 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)
   - 创建或检查你的 API Key
   - 更新 `.env` 文件

### 问题 2: 配额超限

#### 错误信息
```
Error: Resource has been exhausted (e.g. check quota)
```

#### 解决方案

1. 检查你的 API 配额使用情况

2. 升级到付费计划或等待配额重置

3. 临时降低 `MAX_VIDEOS_PER_CHECK` 的值：
   ```env
   MAX_VIDEOS_PER_CHECK=2
   ```

### 问题 3: 自定义 API 端点

如果使用自定义的 OpenAI 兼容 API：

```env
BASE_URL=https://your-api-endpoint.com/v1/
OPENAI_API_KEY=your_api_key
AI_MODEL=your_model_name
```

确保：
- URL 以 `/` 结尾
- 端点支持 OpenAI 兼容格式
- 模型名称正确

---

## 数据库问题

### 问题 1: SQLite 文件权限

#### 错误信息
```
SQLITE_CANTOPEN: unable to open database file
```

#### 解决方案

```bash
# 检查数据目录权限
ls -la data/

# 如果不存在，创建目录
mkdir -p data

# 设置权限
chmod 755 data
```

### 问题 2: 数据库被锁定

#### 错误信息
```
SQLITE_BUSY: database is locked
```

#### 解决方案

```bash
# 关闭所有使用数据库的进程
pkill -f "bun"

# 如果问题持续，删除锁文件
rm -f data/youtube-bot.db-wal
rm -f data/youtube-bot.db-shm

# 重启应用
bun run src/index.ts
```

### 问题 3: 重置数据库

如果数据库损坏，可以重置：

```bash
# 备份现有数据库（可选）
cp data/youtube-bot.db data/youtube-bot.db.backup

# 删除数据库
rm data/youtube-bot.db

# 重启应用会自动创建新数据库
bun run src/index.ts
```

---

## 常见命令

### 检查应用状态
```bash
curl http://localhost:3000/api/status
```

### 手动触发检查
```bash
curl -X POST http://localhost:3000/api/check
```

### 查看日志
```bash
# 实时查看日志
tail -f logs/app.log

# 查看错误日志
grep ERROR logs/app.log
```

### 测试配置
```bash
# 测试 YouTube API
bun run scripts/get-channel-id.ts @test

# 测试邮件配置
# TODO: 创建邮件测试脚本
```

---

## 获取帮助

如果以上方法都无法解决你的问题：

1. **查看详细日志**
   ```bash
   tail -n 100 logs/app.log
   ```

2. **启用调试模式**
   ```env
   NODE_ENV=development
   ```

3. **检查环境变量**
   ```bash
   # 验证所有必需的环境变量
   node -e "require('dotenv').config(); console.log(process.env)"
   ```

4. **提交 Issue**
   - 包含错误信息
   - 包含你的配置（隐藏敏感信息）
   - 描述复现步骤

---

## 预防性维护

### 定期检查

每周运行：

```bash
# 检查 API 配额
# 检查磁盘空间
df -h

# 检查数据库大小
ls -lh data/youtube-bot.db

# 清理旧日志
find logs/ -name "*.log" -mtime +30 -delete
```

### 监控

设置监控脚本：

```bash
# 检查服务是否运行
curl -f http://localhost:3000/ || echo "Service is down!"

# 检查最近的错误
grep ERROR logs/app.log | tail -n 10
```

---

**最后更新**: 2024-10-16

