# 批量获取频道 ID - 快速指南 🚀

## 问题解决：为什么只输出 10 个频道？

如果你遇到批量处理时只输出部分频道的问题，可能是以下原因：

### 1. **API 配额限制** ⚠️
YouTube Data API v3 有配额限制，免费账户每天只有 10,000 配额单位。

**每个操作的配额消耗**：
- `channels.list`: 1 单位
- `search.list`: 100 单位

处理一个频道大约消耗 **100-200 配额单位**。

**解决方案**：
```bash
# 1. 增加请求延迟（降低速率）
BATCH_DELAY=2000 bun run scripts/get-channel-id.ts --file channels.txt

# 2. 分批处理（每批 5-10 个）
bun run scripts/get-channel-id.ts Channel1 Channel2 Channel3 Channel4 Channel5
# 等待一段时间
bun run scripts/get-channel-id.ts Channel6 Channel7 Channel8 Channel9 Channel10

# 3. 第二天继续处理剩余的
```

### 2. **速率限制** 🚦
即使有配额，API 也可能因为请求过快而限流。

**解决方案**：
```bash
# 设置更长的延迟（默认 1000ms，可以增加到 2000-3000ms）
BATCH_DELAY=3000 bun run scripts/get-channel-id.ts --file channels.txt
```

### 3. **某些频道查询失败** ❌
个别频道可能因为名称错误、已删除等原因查询失败。

**现在脚本已优化**：
- ✅ 即使某个频道失败，也会继续处理其他频道
- ✅ 显示详细的错误信息
- ✅ 统计成功/失败数量
- ✅ 列出所有失败的频道及原因

---

## 快速使用

### 基础用法

```bash
# 单个频道
bun run scripts/get-channel-id.ts FinancialEducation

# 多个频道（2-5 个推荐）
bun run scripts/get-channel-id.ts FinancialEducation Value-Investing GrahamStephan

# 从文件读取
bun run scripts/get-channel-id.ts --file channels.txt
```

### 高级用法

```bash
# 设置延迟时间（毫秒）
BATCH_DELAY=2000 bun run scripts/get-channel-id.ts --file channels.txt

# 使用不同的文件
bun run scripts/get-channel-id.ts --file my-channels.txt

# 混合格式
bun run scripts/get-channel-id.ts \
  FinancialEducation \
  @Value-Investing \
  "https://www.youtube.com/@GrahamStephan" \
  UCnMn36GT_H0X-w5_ckLtlgQ
```

---

## 处理大量频道（20+ 个）

### 推荐方案：分批处理

#### 步骤 1：创建频道列表文件

```bash
# 创建 channels.txt，包含所有 20 个频道
cat > channels.txt << 'EOF'
FinancialEducation
Value-Investing
GrahamStephan
MeetKevin
AndreJikh
TheFinancialDiet
OurRichJourney
MinimalistMillionaire
StockMarketNews
InvestingSimplified
RealEstateInvesting
PassiveIncome
DividendData
ValueInvestor
WarrenBuffett
CharlieMunger
PeterLynch
BenjaminGraham
PhilTown
MonishPabrai
EOF
```

#### 步骤 2：分批处理

**方法 1：手动分批**

```bash
# 第 1 批（前 10 个）
head -10 channels.txt > batch1.txt
BATCH_DELAY=2000 bun run scripts/get-channel-id.ts --file batch1.txt > batch1_result.txt

# 等待 5-10 分钟

# 第 2 批（后 10 个）
tail -10 channels.txt > batch2.txt
BATCH_DELAY=2000 bun run scripts/get-channel-id.ts --file batch2.txt > batch2_result.txt

# 合并结果
cat batch1_result.txt batch2_result.txt
```

**方法 2：自动分批脚本**

```bash
# 创建批处理脚本
cat > process-all-channels.sh << 'EOF'
#!/bin/bash

CHANNELS_FILE="channels.txt"
BATCH_SIZE=5
DELAY_BETWEEN_BATCHES=300  # 5 分钟

# 读取所有频道
mapfile -t channels < <(grep -v '^#' "$CHANNELS_FILE" | grep -v '^$')

total=${#channels[@]}
echo "总共 $total 个频道，每批处理 $BATCH_SIZE 个"

for ((i=0; i<total; i+=BATCH_SIZE)); do
  batch_num=$((i/BATCH_SIZE + 1))
  batch_channels=("${channels[@]:i:BATCH_SIZE}")
  
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "处理第 $batch_num 批 (${#batch_channels[@]} 个频道)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  BATCH_DELAY=2000 bun run scripts/get-channel-id.ts "${batch_channels[@]}"
  
  if ((i + BATCH_SIZE < total)); then
    echo ""
    echo "等待 $DELAY_BETWEEN_BATCHES 秒后处理下一批..."
    sleep $DELAY_BETWEEN_BATCHES
  fi
done

echo ""
echo "✅ 所有批次处理完成！"
EOF

chmod +x process-all-channels.sh
./process-all-channels.sh
```

#### 步骤 3：收集结果

所有批次完成后，手动收集每批的 `YOUTUBE_CHANNEL_IDS=...` 输出，合并到 `.env` 文件。

---

## 优化建议

### 1. 配额优化

```bash
# 如果配额紧张，使用更长的延迟
BATCH_DELAY=3000 bun run scripts/get-channel-id.ts --file channels.txt

# 每次只处理 3-5 个频道
bun run scripts/get-channel-id.ts Channel1 Channel2 Channel3
```

### 2. 使用频道 ID 而不是搜索

如果某些频道很难通过名称找到，直接使用频道 ID：

```bash
# 从浏览器手动获取频道 ID
# 1. 访问频道页面
# 2. 右键 -> 查看源代码
# 3. 搜索 "channelId" 或 "externalId"
# 4. 复制频道 ID（UCxxx...）

# 直接验证频道 ID
bun run scripts/get-channel-id.ts UCnMn36GT_H0X-w5_ckLtlgQ
```

### 3. 监控配额使用

访问 [Google Cloud Console](https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas) 查看配额使用情况。

---

## 常见问题

### Q1: 为什么有的频道找不到？

**原因**：
- 频道名称拼写错误
- 频道使用了不同的显示名称
- 频道已删除或私密

**解决**：
```bash
# 使用完整 URL
bun run scripts/get-channel-id.ts "https://www.youtube.com/@ActualChannelName"

# 或手动获取频道 ID
```

### Q2: 出现 "quota exceeded" 错误怎么办？

**解决方案**：
1. 等待到第二天（配额每天重置）
2. 升级到付费账户
3. 创建多个 API Key 轮换使用
4. 减少每次处理的数量

### Q3: 如何验证 .env 配置？

```bash
# 读取 .env 中的频道 ID
grep YOUTUBE_CHANNEL_IDS .env

# 分割并验证每个 ID
# 假设你的 .env 中是：YOUTUBE_CHANNEL_IDS=UC123,UC456,UC789
IFS=',' read -ra IDS <<< "UC123,UC456,UC789"
for id in "${IDS[@]}"; do
  echo "验证: $id"
  bun run scripts/get-channel-id.ts "$id"
done
```

---

## 输出格式

脚本现在会显示：

```
🚀 开始处理 20 个频道...
⏱️  每个请求间隔: 2000ms
📊 预计耗时: ~40秒

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[1/20] 🔍 查找频道: FinancialEducation
  ✅ 找到: Financial Education
  🆔 ID: UCnMn36GT_H0X-w5_ckLtlgQ

[2/20] 🔍 查找频道: InvalidChannel
  ❌ 未找到

...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 处理完成: 总共 20 个频道
   ✅ 成功: 18 个
   ❌ 失败: 2 个
   ⚠️  错误: 0 个

✅ 成功获取的频道:

[显示详细信息...]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 复制以下内容到 .env 文件中:

YOUTUBE_CHANNEL_IDS=UC123...,UC456...,UC789...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ 未找到或失败的频道:

  - InvalidChannel1 (未找到)
  - InvalidChannel2
    错误: Quota exceeded

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ 批量处理完成！成功率: 90%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 最佳实践

### 处理 20 个频道的完整流程

```bash
# 1. 创建频道列表
cat > channels.txt << 'EOF'
# 第一批频道
FinancialEducation
Value-Investing
GrahamStephan
MeetKevin
AndreJikh
# ... 共 20 个
EOF

# 2. 先处理前 10 个（测试）
head -10 channels.txt | while read channel; do
  echo "$channel"
done | xargs bun run scripts/get-channel-id.ts

# 3. 等待 5 分钟

# 4. 处理后 10 个
tail -10 channels.txt | while read channel; do
  echo "$channel"  
done | xargs bun run scripts/get-channel-id.ts

# 5. 手动合并两次的 YOUTUBE_CHANNEL_IDS 输出

# 6. 更新 .env 文件
```

---

**更新日期**: 2024-10-16
**相关文档**: [BATCH_CHANNEL_ID.md](../BATCH_CHANNEL_ID.md)

