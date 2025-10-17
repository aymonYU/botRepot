#!/bin/bash

echo "🎬 YouTube Bot Report - 项目初始化"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 检查 Bun 是否已安装
if ! command -v bun &> /dev/null; then
    echo "❌ Bun 未安装"
    echo "请先安装 Bun: curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

echo "✅ Bun 已安装: $(bun --version)"

# 安装依赖
echo ""
echo "📦 正在安装依赖..."
bun install

# 创建必要的目录
echo ""
echo "📁 创建必要的目录..."
mkdir -p data reports

# 检查 .env 文件
if [ ! -f .env ]; then
    echo ""
    echo "⚠️  未找到 .env 文件"
    echo "正在从 .env.example 创建..."
    cp .env.example .env
    echo "✅ .env 文件已创建"
    echo ""
    echo "⚠️  请编辑 .env 文件，填入你的 API 密钥和配置："
    echo "   - OPENAI_API_KEY (Gemini API 密钥)"
    echo "   - YOUTUBE_API_KEY (YouTube API 密钥)"
    echo "   - YOUTUBE_CHANNEL_IDS (要监控的频道 ID)"
else
    echo "✅ .env 文件已存在"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 初始化完成！"
echo ""
echo "下一步："
echo "1. 编辑 .env 文件，配置你的 API 密钥"
echo "2. 运行 'bun run dev' 启动开发服务器"
echo "3. 或运行 'bun run check' 进行一次手动检查"
echo ""
echo "更多信息请查看 README.md"

