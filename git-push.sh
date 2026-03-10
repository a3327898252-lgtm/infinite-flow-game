#!/bin/bash

# 自动化 Git 推送脚本
# 此脚本会自动添加、提交并推送代码到 GitHub

# 配置
REPO_URL="https://github.com/a3327898252-lgtm/infinite-flow-game.git"
TOKEN="${GITHUB_TOKEN:-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}"
BRANCH="main"

# 进入项目目录
cd "$(dirname "$0")"

# 函数：生成提交信息
generate_commit_message() {
    local today=$(date +%Y-%m-%d)
    local weekday=$(date +%A | sed 's/Monday/周一/;s/Tuesday/周二/;s/Wednesday/周三/;s/Thursday/周四/;s/Friday/周五/;s/Saturday/周六/;s/Sunday/周日/')
    
    # 检查是否有新剧本
    if ls scenarios/scenario-*.json 1>/dev/null 2>&1; then
        local scenario_count=$(ls scenarios/scenario-*.json 2>/dev/null | wc -l)
        local latest_scenario=$(ls -t scenarios/scenario-*.json 2>/dev/null | head -1)
        
        if [ -n "$latest_scenario" ]; then
            local scenario_title=$(grep -o '"title"[[:space:]]*:[[:space:]]*"[^"]*"' "$latest_scenario" | cut -d'"' -f4)
            echo "feat: 添加新剧本「$scenario_title」($today $weekday)"
            return
        fi
    fi
    
    # 默认提交信息
    echo "chore: 更新游戏内容 ($today $weekday)"
}

# 函数：检查是否有变更
has_changes() {
    ! git diff --quiet && ! git diff --cached --quiet
}

# 函数：添加所有变更
add_changes() {
    git add .
}

# 函数：提交变更
commit_changes() {
    local message="$1"
    git commit -m "$message"
}

# 函数：推送到 GitHub
push_to_github() {
    # 使用 token 推送
    git push "https://${TOKEN}@github.com/a3327898252-lgtm/infinite-flow-game.git" "$BRANCH"
}

# 主流程
main() {
    echo "🔄 开始自动化推送流程..."
    echo ""
    
    # 检查是否有变更
    if ! has_changes; then
        echo "✅ 没有变更需要提交"
        return 0
    fi
    
    echo "📝 检测到变更，准备提交..."
    
    # 生成提交信息
    commit_message=$(generate_commit_message)
    echo "📋 提交信息: $commit_message"
    echo ""
    
    # 添加变更
    add_changes
    
    # 提交变更
    if ! commit_changes "$commit_message"; then
        echo "❌ 提交失败"
        return 1
    fi
    
    echo "✅ 提交成功"
    echo ""
    
    # 推送到 GitHub
    echo "📤 推送到 GitHub..."
    if ! push_to_github; then
        echo "❌ 推送失败"
        echo ""
        echo "可能的原因："
        echo "1. GitHub Token 权限不足"
        echo "2. 网络连接问题"
        echo "3. Token 已过期"
        echo ""
        echo "请检查并重新配置 GitHub Token"
        return 1
    fi
    
    echo "✅ 推送成功！"
    echo ""
    echo "🌐 游戏地址：https://a3327898252-lgtm.github.io/infinite-flow-game/"
    echo ""
    echo "📊 变更统计："
    git diff --stat HEAD~1
}

# 执行主流程
main "$@"
