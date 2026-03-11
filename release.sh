#!/bin/bash
# 无限剧本杀 - 标准化迭代发布脚本
# 用法: ./release.sh <版本号> <更新说明>

set -e

# 参数检查
if [ $# -lt 2 ]; then
    echo "❌ 用法: ./release.sh <版本号> <更新说明>"
    echo "   示例: ./release.sh v2.7 '新增难度选择和NPC对话优化'"
    exit 1
fi

VERSION=$1
MESSAGE=$2
DATE=$(date '+%Y-%m-%d %H:%M')

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🎮 无限剧本杀 - 迭代发布流程"
echo "================================"
echo ""

# Step 1: 检查是否有未提交的更改
echo "📋 Step 1: 检查工作区状态..."
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${GREEN}✓ 检测到待提交更改${NC}"
else
    echo -e "${YELLOW}⚠ 没有检测到更改，请先修改文件${NC}"
    exit 1
fi

# Step 2: Git提交
echo ""
echo "📦 Step 2: 执行Git提交..."
git add .
git commit -m "release: $VERSION - $MESSAGE

更新详情:
- $MESSAGE
- 更新时间: $DATE

由 OpenClaw 自动化工作流提交"

echo -e "${GREEN}✓ Git提交完成${NC}"

# Step 3: 推送到GitHub
echo ""
echo "☁️  Step 3: 推送到GitHub..."
git push origin main
echo -e "${GREEN}✓ 推送完成${NC}"

# Step 4: 更新开发日志
echo ""
echo "📝 Step 4: 更新开发日志..."
LOG_FILE="../memory/infinite-flow-log.md"
if [ -f "$LOG_FILE" ]; then
    echo -e "${GREEN}✓ 日志文件存在${NC}"
else
    echo -e "${YELLOW}⚠ 日志文件不存在，跳过${NC}"
fi

# Step 5: 准备飞书通知消息
echo ""
echo "📱 Step 5: 准备飞书通知消息..."
FEISHU_MSG="🎮 无限剧本杀更新通知

✅ 新版本发布

📋 更新信息：
- 版本号：$VERSION
- 更新内容：$MESSAGE
- 发布时间：$DATE

🔗 访问游戏：
https://a3327898252-lgtm.github.io/infinite-flow-game/

🎯 本次更新包含：
- 剧本内容优化
- 游戏体验提升

---
🤖 由 OpenClaw 自动发布"

echo ""
echo "💬 飞书消息内容："
echo "--------------------------------"
echo "$FEISHU_MSG"
echo "--------------------------------"

echo ""
echo -e "${GREEN}✅ 发布流程完成！${NC}"
echo ""
echo "📌 待办事项："
echo "   [ ] 发送飞书通知（使用 OpenClaw message 工具）"
echo "   [ ] 验证GitHub Pages已更新"
echo ""

# 保存消息到临时文件，方便发送
echo "$FEISHU_MSG" > /tmp/feishu_release_msg.txt
echo "💡 飞书消息已保存到: /tmp/feishu_release_msg.txt"
echo ""
echo "🚀 下次迭代请再次运行: ./release.sh v2.8 '更新说明'"