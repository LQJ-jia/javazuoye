# 笔记博客

这是一个使用 VitePress + Vue3 + Markdown 构建的个人笔记博客。

## 功能特性

- 📝 **Markdown 支持** - 使用 Markdown 编写笔记
- 🎨 **蓝白配色** - 优雅的设计风格
- ⚡ **快速构建** - 基于 Vite，提供最佳性能
- 🌐 **深色模式** - 自动适配系统主题
- 📱 **响应式设计** - 完美支持各类设备
- 🚀 **GitHub Pages** - 一键部署

## 快速开始

### 安装依赖

\`\`\`bash
npm install
\`\`\`

### 启动开发服务器

\`\`\`bash
npm run docs:dev
\`\`\`

浏览器会自动打开 http://localhost:5173

### 构建静态文件

\`\`\`bash
npm run docs:build
\`\`\`

输出文件在 \`dist\` 目录中。

### 部署到 GitHub Pages

1. 在 GitHub 上创建一个仓库（例如：\`note-blog\`）

2. 修改 \`docs/.vitepress/config.mjs\` 中的 \`base\` 配置：
   \`\`\`javascript
   base: '/note-blog/',
   \`\`\`

3. 创建并配置 GitHub Actions（见下方）

4. 推送代码到 GitHub

## GitHub Actions 部署

在项目根目录创建 \`.github/workflows/deploy.yml\`：

\`\`\`yaml
name: Deploy

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run docs:build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: \${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
\`\`\`

## 项目结构

\`\`\`
project/
├── docs/
│   ├── .vitepress/
│   │   ├── config.mjs
│   │   └── theme/
│   │       ├── index.js
│   │       └── style.css
│   ├── notes/
│   ├── index.md
│   └── ...
├── .github/
│   └── workflows/
│       └── deploy.yml
├── package.json
└── README.md
\`\`\`

## 自定义配置

在 \`docs/.vitepress/config.mjs\` 中进行配置：

\`\`\`javascript
export default defineConfig({
  title: '笔记博客',
  description: '个人笔记',
  lang: 'zh-CN',
  base: '/note-blog/',
  themeConfig: {
    nav: [...],
    sidebar: {...},
    footer: {...}
  }
})
\`\`\`

## 主题定制

编辑 \`docs/.vitepress/theme/style.css\` 来自定义样式。

蓝白主题使用的主要颜色：
- 品牌色: \`#2563eb\`（蓝色）
- 背景色: \`#ffffff\`（白色）
- 文字色: \`#1e293b\`（深灰）

## 常见问题

### Q: 如何添加新笔记？
A: 在 \`docs/notes/\` 目录创建 \`.md\` 文件，然后在 \`config.mjs\` 的 sidebar 中添加链接。

### Q: 如何修改颜色？
A: 编辑 \`docs/.vitepress/theme/style.css\` 中的 CSS 变量。

### Q: 如何部署到自己的域名？
A: 在 \`config.mjs\` 中修改 \`base\` 配置，按照 GitHub Pages 文档配置 CNAME。

## 相关链接

- [VitePress 官网](https://vitepress.dev)
- [Vue3 官网](https://vuejs.org)
- [GitHub Pages 官方文档](https://pages.github.com)
- [Markdown 语法](https://commonmark.org/help/)

---

**开始创建你的笔记博客吧！** 🚀
