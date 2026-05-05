# VitePress 笔记博客部署说明

## 本地开发

### 1. 安装依赖
\`\`\`bash
npm install
\`\`\`

### 2. 启动开发服务器
\`\`\`bash
npm run docs:dev
\`\`\`

打开浏览器访问 http://localhost:5173

### 3. 构建生产版本
\`\`\`bash
npm run docs:build
\`\`\`

## GitHub Pages 部署步骤

### 第一步：创建 GitHub 仓库

1. 在 GitHub 上创建新仓库，名称可以是 \`note-blog\`
2. 记住你的用户名和仓库名

### 第二步：修改配置文件

编辑 \`docs/.vitepress/config.mjs\`，找到 \`base\` 配置项：

\`\`\`javascript
// 改为你的仓库名
base: '/note-blog/',
\`\`\`

### 第三步：初始化 Git 仓库并推送

\`\`\`bash
# 初始化 git 仓库
git init

# 添加所有文件
git add .

# 提交代码
git commit -m "初始提交"

# 添加远程仓库（替换 your-username 和 your-repo-name）
git remote add origin https://github.com/your-username/your-repo-name.git

# 推送到 GitHub
git branch -M main
git push -u origin main
\`\`\`

### 第四步：启用 GitHub Pages

1. 进入仓库设置（Settings）
2. 在左侧菜单找到 "Pages"
3. 在 "Build and deployment" 部分
4. 选择 "GitHub Actions" 作为部署来源
5. GitHub Actions 会自动构建并部署

### 第五步：访问你的博客

部署完成后，访问：
\`\`\`
https://your-username.github.io/note-blog/
\`\`\`

## 更新笔记

每次推送代码到 main 分支，GitHub Actions 会自动构建和部署新版本。

## 自定义域名（可选）

如果你有自己的域名：

1. 在仓库根目录创建 \`CNAME\` 文件
2. 添加你的域名：
   \`\`\`
   yourdomain.com
   \`\`\`
3. 在你的 DNS 提供商设置 CNAME 记录
4. 在 GitHub Pages 设置中配置自定义域名

## 常见问题

### Q: 部署后 CSS 样式没有加载？
A: 检查 \`config.mjs\` 中的 \`base\` 配置是否正确。

### Q: GitHub Actions 构建失败？
A: 查看 GitHub Actions 的日志，通常是因为 Node 版本问题或依赖安装失败。

### Q: 如何修改博客标题和描述？
A: 编辑 \`docs/.vitepress/config.mjs\` 中的 \`title\` 和 \`description\` 字段。

## 相关资源

- [VitePress 官方文档](https://vitepress.dev)
- [GitHub Pages 官方文档](https://pages.github.com)
- [Git 教程](https://git-scm.com/book/zh/v2)
