# 快速开始

欢迎来到笔记博客！本页面将帮助你快速了解如何使用这个博客。

## 什么是 VitePress？

VitePress 是一个由 Vite 驱动的静态网站生成器。它使用 Markdown 文本来创建内容，非常适合构建文档和博客。

## 项目特点

### 📝 基于 Markdown
使用 Markdown 编写笔记，简单易用。

### 🎨 蓝白配色
优雅的蓝白配色方案，舒适的阅读体验。

### ⚡ 极速性能
基于 Vite 构建，提供最快的开发和生产性能。

### 🌐 支持深色模式
自动适配系统深色模式。

### 📱 响应式设计
完美支持各种设备尺寸。

## 如何创建笔记

1. **创建 Markdown 文件**
   ```bash
   在 docs/notes/ 目录下创建 .md 文件
   ```

2. **编写内容**
   ```markdown
   # 笔记标题
   
   这是笔记内容...
   ```

3. **在配置中添加导航**
   编辑 `.vitepress/config.mjs` 中的 sidebar 配置。

## 项目结构

```
project/
├── docs/
│   ├── .vitepress/
│   │   ├── config.mjs          # 配置文件
│   │   └── theme/
│   │       ├── index.js        # 主题入口
│   │       └── style.css       # 自定义样式
│   ├── notes/                  # 笔记目录
│   ├── index.md               # 首页
│   └── ...
├── package.json
└── README.md
```

## 常用命令

```bash
# 启动开发服务器
npm run docs:dev

# 构建静态文件
npm run docs:build

# 预览生产版本
npm run docs:preview
```

## 下一步

- 查看 [示例笔记](./example.md)
- 自定义配置文件
- 部署到 GitHub Pages
