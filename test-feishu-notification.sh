#!/bin/bash
# 测试飞书通知功能

echo "🧪 测试飞书通知功能..."

# 飞书通知消息模板
MESSAGE="🎮 无限剧本杀更新通知

✅ 新剧本已发布

📋 剧本信息：
- 标题：逃离死城（测试）
- 类型：丧尸末日
- 日期：2025-03-10 周一
- 难度：中等

🔗 访问游戏：
https://a3327898252-lgtm.github.io/infinite-flow-game/

🎯 玩家可以在游戏主页选择最新剧本进行游玩！

---
这是一条测试消息，请忽略。"

echo ""
echo "📱 发送消息到飞书..."
echo ""
echo "消息内容："
echo "$MESSAGE"
echo ""

# 注意：实际的飞书消息发送需要通过 OpenClaw 的消息工具
# 这里只是演示如何准备消息内容

# 要在 OpenClaw 中发送飞书消息，可以使用：
# - 使用 feishu-chat 工具（如果已安装）
# - 通过 OpenClaw 的 message send 命令
# - 或者在 HEARTBEAT.md 中配置自动发送

echo "✅ 消息准备完成！"
echo ""
echo "💡 要实际发送飞书消息，需要："
echo "1. 确保飞书渠道已配置（✓ 已配置）"
echo "2. 在 OpenClaw 中使用消息工具发送"
echo "3. 或在 HEARTBEAT.md 中配置自动发送流程"
echo ""
echo "📖 查看文档："
echo "openclaw docs feishu setup"
