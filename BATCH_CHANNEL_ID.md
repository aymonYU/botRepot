# 批量获取 YouTube 频道 ID 指南 📺

## 功能说明

`get-channel-id.ts` 脚本支持三种使用方式：
1. **单个频道**：获取单个频道的 ID
2. **多个频道**：批量获取多个频道的 ID
3. **从文件读取**：从文本文件批量读取并获取频道 ID

## 使用方法

### 1. 单个频道

```bash
bun run scripts/get-channel-id.ts FinancialEducation
```

或使用 @ 前缀：
```bash
bun run scripts/get-channel-id.ts @FinancialEducation
```

或使用完整 URL：
```bash
bun run scripts/get-channel-id.ts "https://www.youtube.com/@FinancialEducation"
```

### 2. 批量获取多个频道（推荐）⭐

直接在命令行传入多个频道名：

```bash
bun run scripts/get-channel-id.ts FinancialEducation Value-Investing TechChannel
```

**优点**：
- ✅ 快速方便
- ✅ 一次性获取多个频道
- ✅ 自动输出可直接复制到 `.env` 的格式

**示例输出**：
```
🚀 开始处理 3 个频道...

[1/3] 🔍 查找频道: FinancialEducation
  ✅ 找到: Financial Education
  🆔 ID: UCnMn36GT_H0X-w5_ckLtlgQ

[2/3] 🔍 查找频道: Value-Investing
  ✅ 找到: Value Investing
  🆔 ID: UCabc123def456...

[3/3] 🔍 查找频道: TechChannel
  ✅ 找到: Tech Channel
  🆔 ID: UCxyz789ghi012...

📊 处理完成: 3 成功, 0 失败

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 复制以下内容到 .env 文件中:

YOUTUBE_CHANNEL_IDS=UCnMn36GT_H0X-w5_ckLtlgQ,UCabc123def456...,UCxyz789ghi012...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 3. 从文件批量读取

#### 步骤 1：创建频道列表文件

创建 `channels.txt` 文件，每行一个频道名：

```bash
cat > channels.txt << 'EOF'
# 财经频道
FinancialEducation
Value-Investing

# 科技频道
TechChannel
AnotherChannel

# 可以使用各种格式
@SomeChannel
https://www.youtube.com/@OtherChannel
UCxxxxxxxxxxxxxxxxxxxxxx
EOF
```

或复制示例文件：
```bash
cp channels.example.txt channels.txt
# 然后编辑 channels.txt，添加你想要的频道
```

#### 步骤 2：运行脚本

```bash
bun run scripts/get-channel-id.ts --file channels.txt
```

或使用短选项：
```bash
bun run scripts/get-channel-id.ts -f channels.txt
```

使用自定义文件名：
```bash
bun run scripts/get-channel-id.ts --file my-channels.txt
```

## 支持的频道格式

脚本支持以下所有格式，会自动识别并处理：

| 格式 | 示例 | 说明 |
|------|------|------|
| 用户名 | `FinancialEducation` | 最简单的格式 |
| @ 用户名 | `@FinancialEducation` | 新版 YouTube URL 格式 |
| 完整 URL | `https://www.youtube.com/@FinancialEducation` | 直接从浏览器复制 |
| 频道 ID | `UCnMn36GT_H0X-w5_ckLtlgQ` | 已知频道 ID |
| /c/ URL | `https://www.youtube.com/c/FinancialEducation` | 旧版自定义 URL |
| /user/ URL | `https://www.youtube.com/user/FinancialEducation` | 旧版用户 URL |
| /channel/ URL | `https://www.youtube.com/channel/UCxxx...` | 标准频道 URL |

## 输出格式

脚本会输出：

### 1. 处理过程
显示每个频道的查找进度和结果

### 2. 详细信息
每个成功找到的频道会显示：
- 📺 频道名称
- 🆔 频道 ID
- 📝 频道描述
- 👥 订阅者数量
- 🎬 视频数量
- 👀 总观看次数

### 3. .env 配置（重点！）
**直接可复制的配置行**：
```
YOUTUBE_CHANNEL_IDS=UCxxx...,UCyyy...,UCzzz...
```

### 4. 对照表
显示频道名称和 ID 的对照，方便查看

## 实战示例

### 场景 1：快速添加 3 个频道

```bash
# 一次性获取 3 个频道的 ID
bun run scripts/get-channel-id.ts \
  "Financial Education" \
  "Value Investing" \
  "Graham Stephan"

# 输出的配置直接复制到 .env 文件
```

### 场景 2：管理大量频道（10+ 个）

```bash
# 1. 创建频道列表文件
cat > channels.txt << 'EOF'
# 财经投资类
FinancialEducation
Value-Investing
GrahamStephan
MeetKevin
AndreJikh

# 理财规划类
TheFinancialDiet
OurRichJourney
MinimalistMillionaire

# 股票分析类
StockMarketNews
InvestingSimplified
EOF

# 2. 批量获取
bun run scripts/get-channel-id.ts --file channels.txt

# 3. 复制输出的 YOUTUBE_CHANNEL_IDS 行到 .env
```

### 场景 3：验证现有频道 ID

```bash
# 检查你的 .env 中的频道 ID 是否有效
bun run scripts/get-channel-id.ts \
  UCnMn36GT_H0X-w5_ckLtlgQ \
  UC123abc456def789
```

### 场景 4：混合格式输入

```bash
# 支持混合不同格式
bun run scripts/get-channel-id.ts \
  FinancialEducation \
  @Value-Investing \
  "https://www.youtube.com/@GrahamStephan" \
  UCnMn36GT_H0X-w5_ckLtlgQ
```

## 文件格式说明

`channels.txt` 文件格式：

```
# 注释行（以 # 开头会被忽略）
ChannelName1
ChannelName2

# 空行也会被忽略

@ChannelName3
https://www.youtube.com/@ChannelName4
```

**特点**：
- ✅ 支持注释（`#` 开头）
- ✅ 自动忽略空行
- ✅ 每行一个频道
- ✅ 支持各种格式混用

## 常见问题

### Q1: 为什么有些频道找不到？

**可能原因**：
1. 频道名称拼写错误
2. 频道使用了不同的显示名称和用户名
3. 频道已被删除或设为私密

**解决方法**：
```bash
# 1. 访问频道页面
# 2. 从浏览器地址栏复制完整 URL
# 3. 使用完整 URL 查询

bun run scripts/get-channel-id.ts "https://www.youtube.com/@ActualChannelName"
```

### Q2: API 配额不够用怎么办？

脚本已经内置了延迟（每个查询间隔 500ms），避免触发限流。

如果还是超限：
```bash
# 分批处理
bun run scripts/get-channel-id.ts Channel1 Channel2 Channel3
# 等待几分钟
bun run scripts/get-channel-id.ts Channel4 Channel5 Channel6
```

### Q3: 如何更新 .env 文件？

**方法 1：手动复制**
```bash
# 1. 运行脚本
bun run scripts/get-channel-id.ts Channel1 Channel2

# 2. 复制输出的 YOUTUBE_CHANNEL_IDS=... 行

# 3. 在 .env 文件中找到 YOUTUBE_CHANNEL_IDS 行并替换
```

**方法 2：使用命令行（小心使用）**
```bash
# 获取频道 ID（保存输出）
CHANNEL_IDS=$(bun run scripts/get-channel-id.ts Channel1 Channel2 | grep "YOUTUBE_CHANNEL_IDS=" | cut -d'=' -f2)

# 更新 .env（先备份！）
cp .env .env.backup
sed -i '' "s/YOUTUBE_CHANNEL_IDS=.*/YOUTUBE_CHANNEL_IDS=$CHANNEL_IDS/" .env
```

### Q4: 脚本运行很慢？

这是正常的，因为：
1. 需要逐个查询 YouTube API
2. 每次查询间有 500ms 延迟（防止限流）
3. 需要获取频道详细信息

**预计时间**：
- 1 个频道：~1 秒
- 5 个频道：~3 秒
- 10 个频道：~6 秒

## 完整工作流程

```bash
# 步骤 1：准备频道列表
cat > my-channels.txt << 'EOF'
FinancialEducation
Value-Investing
GrahamStephan
EOF

# 步骤 2：批量获取频道 ID
bun run scripts/get-channel-id.ts --file my-channels.txt

# 步骤 3：复制输出中的 YOUTUBE_CHANNEL_IDS=... 行

# 步骤 4：编辑 .env 文件
code .env  # 或 nano .env

# 步骤 5：粘贴并保存

# 步骤 6：验证配置
grep YOUTUBE_CHANNEL_IDS .env

# 步骤 7：重启应用
bun run src/index.ts
```

## 高级用法

### 导出到 JSON

如果需要 JSON 格式：
```bash
# 修改脚本输出格式，或使用 jq 处理
# TODO: 可以扩展脚本支持 --format json
```

### 定期更新

创建更新脚本：
```bash
cat > update-channels.sh << 'EOF'
#!/bin/bash
echo "更新频道列表..."
bun run scripts/get-channel-id.ts --file channels.txt > channel-ids.txt
echo "完成！查看 channel-ids.txt"
EOF

chmod +x update-channels.sh
./update-channels.sh
```

---

**相关文档**：
- [故障排除指南](./TROUBLESHOOTING.md)
- [AI 模型配置](./AI_MODELS.md)
- [主文档](./README.md)

**更新时间**: 2024-10-16

