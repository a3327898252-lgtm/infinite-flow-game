# 远程访问部署指南

## 🚀 快速部署到 GitHub Pages

### 方式一：通过 GitHub Web 界面（最简单）

1. **在 GitHub 上创建新仓库**
   - 访问：https://github.com/new
   - 仓库名称：`infinite-flow-game`（或你喜欢的名字）
   - 选择 Public（公开）
   - **不要**勾选 "Add a README file"
   - 点击 "Create repository"

2. **上传代码**
   - 在新创建的仓库页面，点击 "uploading an existing file"
   - 将 `/workspace/projects/infinite-flow-game/` 目录下的所有文件上传
   - 等待上传完成
   - 点击 "Commit changes"

3. **启用 GitHub Pages**
   - 进入仓库的 "Settings"（设置）
   - 左侧菜单找到 "Pages"
   - 在 "Build and deployment" 下，找到 "Source"
   - 选择 "Deploy from a branch"
   - Branch 选择 `main`（或 `master`）和 `/ (root)`
   - 点击 "Save"
   - 等待 1-2 分钟，页面顶部会出现访问链接

4. **访问游戏**
   - 链接格式：`https://yourusername.github.io/infinite-flow-game/`
   - 例如：`https://john-doe.github.io/infinite-flow-game/`

---

### 方式二：使用 Git 命令（推荐开发者）

#### 1. 创建 GitHub 仓库
   - 访问：https://github.com/new
   - 创建一个新仓库（如 `infinite-flow-game`）

#### 2. 添加远程仓库并推送

```bash
cd /workspace/projects/infinite-flow-game

# 添加远程仓库（替换为你的仓库地址）
git remote add origin https://github.com/你的用户名/infinite-flow-game.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

#### 3. 启用 GitHub Pages
   - 进入仓库 Settings → Pages
   - Source 选择 "Deploy from a branch"
   - Branch 选择 `main` 和 `/ (root)`
   - 点击 Save

#### 4. 访问游戏
   - 链接：`https://你的用户名.github.io/infinite-flow-game/`

---

## 🌐 访问游戏

部署成功后，你可以通过以下方式访问：

### 电脑浏览器
- 直接访问 GitHub Pages URL
- 例如：`https://yourusername.github.io/infinite-flow-game/`

### 手机浏览器
- 同样访问 GitHub Pages URL
- 游戏支持响应式设计，手机也能玩

### 分享给朋友
- 直接分享 GitHub Pages URL
- 任何人都可以访问（公开仓库）

---

## 🔄 自动更新

**OpenClaw 会自动更新游戏！**

配置完成后，OpenClaw 每天会：
1. 生成新剧本
2. 添加到游戏
3. 自动提交到 GitHub
4. GitHub Pages 自动重新部署
5. **玩家访问时自动看到新内容！**

无需任何手动操作！

---

## ⚙️ 自定义域名（可选）

如果你想使用自己的域名：

1. 在你的域名 DNS 设置中添加：
   - CNAME: `your-username.github.io`
   - 或 A 记录指向 GitHub Pages IP

2. 在 GitHub 仓库 Settings → Pages
   - 添加自定义域名
   - 启用 Enforce HTTPS

---

## 📱 二维码访问

部署成功后，你可以：
1. 生成 GitHub Pages URL 的二维码
2. 扫码直接在手机上玩
3. 分享二维码给朋友

---

## 🎉 完成！

现在你的游戏已经可以通过公网访问了！

**访问链接格式：**
```
https://你的用户名.github.io/infinite-flow-game/
```

---

## ❓ 常见问题

### Q: 部署后访问显示 404？
A: 等待 2-3 分钟，GitHub Pages 需要时间构建

### Q: 如何更新游戏？
A: OpenClaw 会自动更新，无需手动操作！

### Q: 游戏能多人同时玩吗？
A: 可以！任何人都可以访问，各自独立游戏

### Q: 如何查看部署状态？
A: 访问仓库 → Actions → 查看部署日志

---

**需要帮助？请告诉我你的 GitHub 用户名，我可以提供更具体的指导！**
