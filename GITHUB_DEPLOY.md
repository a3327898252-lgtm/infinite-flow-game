# GitHub 部署指南 - 快速上手

## 🎯 已配置好的信息

- **仓库地址**：https://github.com/a3327898252-lgtm/infinite-flow-game.git
- **远程仓库**：已配置
- **本地代码**：已提交到本地仓库

## 🚀 部署步骤（3分钟搞定）

### 方法一：使用 GitHub Token（推荐新手）

#### 1. 生成 GitHub Token
- 访问：https://github.com/settings/tokens
- 点击 "Generate new token (classic)"
- Token 名称：`infinite-flow-game`
- 选择权限：勾选 `repo`（所有权限）
- 点击 "Generate token"
- **复制 Token（只显示一次！）**

#### 2. 推送代码

**在 `/workspace/projects/infinite-flow-game/` 目录下执行：**

```bash
# 设置带 Token 的远程地址（替换 <YOUR_TOKEN> 为你的 Token）
git remote set-url origin https://<YOUR_TOKEN>@github.com/a3327898252-lgtm/infinite-flow-game.git

# 推送代码
git push -u origin main
```

**示例（假设 Token 是 ghp_xxx）：**
```bash
git remote set-url origin https://ghp_xxxxxxxxxxxxxxxxxxxx@github.com/a3327898252-lgtm/infinite-flow-game.git
git push -u origin main
```

#### 3. 启用 GitHub Pages
- 访问：https://github.com/a3327898252-lgtm/infinite-flow-game/settings/pages
- "Build and deployment" → "Source" → 选择 "Deploy from a branch"
- "Branch" → 选择 `main` 和 `/ (root)`
- 点击 "Save"

#### 4. 访问游戏
等待 1-2 分钟，访问：
```
https://a3327898252-lgtm.github.io/infinite-flow-game/
```

---

### 方法二：使用 SSH（推荐开发者）

#### 1. 生成 SSH Key

```bash
# 生成 SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# 复制公钥
cat ~/.ssh/id_ed25519.pub
```

#### 2. 添加到 GitHub
- 访问：https://github.com/settings/ssh/new
- 粘贴公钥内容
- 点击 "Add SSH key"

#### 3. 推送代码

```bash
# 更换为 SSH 地址
git remote set-url origin git@github.com:a3327898252-lgtm/infinite-flow-game.git

# 推送代码
git push -u origin main
```

---

### 方法三：使用部署脚本

```bash
cd /workspace/projects/infinite-flow-game
chmod +x deploy.sh
./deploy.sh
```

---

## 🔄 后续更新

**OpenClaw 会自动更新！**

每次生成新剧本后，OpenClaw 会：
```bash
cd /workspace/projects/infinite-flow-game
git add .
git commit -m "Add new scenario"
git push origin main
```

GitHub Pages 会自动重新部署，玩家访问时自动看到新内容！

---

## ❓ 常见问题

### Q: 提示 "Authentication failed"
A: 检查 Token 是否正确，或重新生成 Token

### Q: 提示 "Permission denied"
A: 确认你有仓库的写入权限

### Q: 推送后 GitHub Pages 显示 404
A: 等待 2-3 分钟，GitHub Pages 需要时间构建

### Q: 如何查看部署状态？
A: 访问仓库的 Actions 页面查看

---

## 🎉 完成！

部署成功后，游戏地址：
```
https://a3327898252-lgtm.github.io/infinite-flow-game/
```

**分享这个链接，任何人都可以玩游戏！**

---

## 📱 快速测试命令

如果你想快速测试，可以尝试：

```bash
cd /workspace/projects/infinite-flow-game

# 检查远程仓库配置
git remote -v

# 查看当前状态
git status

# 查看提交历史
git log --oneline
```

---

**需要帮助？告诉我你遇到了什么问题！** 🚀
