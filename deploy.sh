#!/bin/bash

# 无限剧本杀 - GitHub 部署脚本
# 使用方法：./deploy.sh

echo "🚀 开始部署到 GitHub..."
echo ""

# 检查是否在正确的目录
if [ ! -f "index.html" ]; then
    echo "❌ 错误：请在 infinite-flow-game 目录下运行此脚本"
    exit 1
fi

# 显示当前状态
echo "📋 当前状态："
git status
echo ""

# 提示用户配置 GitHub Token
if ! git remote show origin &>/dev/null; then
    echo "❌ 远程仓库未配置"
    exit 1
fi

echo "🔍 检查 GitHub 认证..."
if git ls-remote origin &>/dev/null; then
    echo "✅ GitHub 认证成功"
else
    echo "❌ GitHub 认证失败"
    echo ""
    echo "请配置 GitHub 认证："
    echo ""
    echo "方式一：使用 GitHub Token"
    echo "1. 访问 https://github.com/settings/tokens"
    echo "2. 生成新的 Personal Access Token（需要 repo 权限）"
    echo "3. 运行："
    echo "   git remote set-url origin https://<TOKEN>@github.com/a3327898252-lgtm/infinite-flow-game.git"
    echo ""
    echo "方式二：使用 SSH（推荐）"
    echo "1. 生成 SSH key：ssh-keygen -t ed25519 -C \"your_email@example.com\""
    echo "2. 添加到 GitHub：https://github.com/settings/ssh/new"
    echo "3. 运行："
    echo "   git remote set-url origin git@github.com:a3327898252-lgtm/infinite-flow-game.git"
    echo ""
    exit 1
fi

echo ""
echo "📤 推送代码到 GitHub..."
git push -u origin main || git push -u origin master

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 代码推送成功！"
    echo ""
    echo "🌐 下一步："
    echo "1. 访问：https://github.com/a3327898252-lgtm/infinite-flow-game"
    echo "2. 进入 Settings → Pages"
    echo "3. Source 选择 'Deploy from a branch'"
    echo "4. Branch 选择 'main' 和 '/ (root)'"
    echo "5. 点击 Save"
    echo "6. 等待 1-2 分钟，访问："
    echo "   https://a3327898252-lgtm.github.io/infinite-flow-game/"
else
    echo ""
    echo "❌ 推送失败，请检查网络连接和 GitHub 认证"
    exit 1
fi
