# 自动化部署说明

## 🚀 自动推送流程

每次游戏更新后，OpenClaw 会自动执行以下步骤：

### 1. 生成提交信息

自动化脚本会根据更新的内容自动生成提交信息：

| 更新类型 | 提交信息格式 | 示例 |
|---------|------------|------|
| 添加新剧本 | `feat: 添加新剧本「剧本标题」(YYYY-MM-DD 星期)` | `feat: 添加新剧本「逃离死城」(2025-03-10 周一)` |
| 更新游戏 | `chore: 更新游戏内容 (YYYY-MM-DD 星期)` | `chore: 更新游戏内容 (2025-03-10 周一)` |
| 修复 bug | `fix: 修复问题描述 (YYYY-MM-DD 星期)` | `fix: 修复结局判定逻辑 (2025-03-10 周一)` |
| 优化功能 | `refactor: 优化描述 (YYYY-MM-DD 星期)` | `refactor: 优化游戏性能 (2025-03-10 周一)` |

### 2. 提交到 GitHub

使用自动化脚本执行：
```bash
cd /workspace/projects/infinite-flow-game
./git-push.sh
```

脚本会自动：
- 检测变更
- 生成合适的提交信息
- 添加所有变更
- 提交到本地仓库
- 推送到 GitHub

### 3. GitHub Pages 自动部署

推送成功后，GitHub Pages 会：
- 检测到新的提交
- 自动重新构建和部署
- 1-2 分钟后，新内容即可访问

## 📝 提交信息规范

### 必须包含的元素

1. **类型**：feat/chore/fix/refactor
2. **简短描述**：清晰说明更新内容
3. **日期**：YYYY-MM-DD 格式
4. **星期**：中文星期几

### 格式模板

```
<类型>: <描述> (<YYYY-MM-DD> <星期>)
```

### 类型说明

| 类型 | 使用场景 | 示例 |
|------|---------|------|
| feat | 新功能/新剧本 | 添加新剧本、新功能 |
| chore | 日常更新 | 更新内容、调整配置 |
| fix | 修复 bug | 修复崩溃、修复逻辑错误 |
| refactor | 优化重构 | 优化性能、重构代码 |

### 示例

✅ **好的提交信息：**
```
feat: 添加新剧本「破碎仙界」(2025-03-11 周二)
chore: 更新游戏引擎以支持新剧本 (2025-03-11 周二)
fix: 修复死亡概率计算错误 (2025-03-11 周二)
refactor: 优化游戏加载速度 (2025-03-11 周二)
```

❌ **不好的提交信息：**
```
update
add scenario
fix bug
test
```

## 🔧 手动推送（备用方案）

如果自动推送脚本失败，可以使用手动方式：

```bash
cd /workspace/projects/infinite-flow-game

# 1. 添加所有变更
git add .

# 2. 提交（必须使用规范格式）
git commit -m "feat: 添加新剧本「剧本标题」(2025-03-10 周一)"

# 3. 推送
git push "https://${GITHUB_TOKEN}@github.com/a3327898252-lgtm/infinite-flow-game.git" main
```

## ⚠️ 常见问题

### Q: 推送失败，提示 403 错误
A: 检查 GitHub Token 是否有效，是否有仓库写入权限

### Q: 提交信息不符合规范
A: 使用自动化脚本 `git-push.sh`，它会自动生成规范的提交信息

### Q: GitHub Pages 没有更新
A: 等待 2-3 分钟，GitHub Pages 需要时间构建

### Q: 如何查看提交历史
A: 访问 https://github.com/a3327898252-lgtm/infinite-flow-game/commits/main

## 📊 提交统计

查看最近的提交：
```bash
cd /workspace/projects/infinite-flow-game
git log --oneline -10
```

## 🔄 持续集成

每次推送后，GitHub Actions 会：
1. 检查代码格式
2. 验证 JSON 格式
3. 运行测试（如果有）
4. 部署到 GitHub Pages

## ✅ 检查清单

每次更新前，确保：
- [ ] 提交信息符合规范
- [ ] 所有文件已添加
- [ ] 本地测试通过
- [ ] Token 有效且有权限
- [ ] 网络连接正常

---

**记住：每次更新都要推送到 GitHub，并使用规范的提交信息！**
