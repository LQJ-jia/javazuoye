# 🚀 快速指南 - 笔记博客

## 项目已完成！

你的 VitePress 笔记博客已经全部配置完成。以下是快速指南：

## 📁 项目结构

```
note-blog/
├── docs/                          # 文档根目录
│   ├── index.md                  # 首页
│   ├── notes/                    # 笔记目录
│   │   ├── index.md             # 笔记首页
│   │   ├── quick-start.md        # 快速开始
│   │   └── example.md            # 示例笔记
│   └── .vitepress/               # VitePress 配置
│       ├── config.mjs            # 配置文件
│       └── theme/
│           ├── index.js          # 主题入口
│           └── style.css         # 蓝白配色样式
├── .github/
│   └── workflows/
│       └── deploy.yml            # GitHub Actions 自动部署
├── package.json                  # 项目配置
├── README.md                     # 项目说明
├── DEPLOY.md                     # 部署指南
└── .gitignore                    # Git 忽略文件

```

## 🛠️ 本地开发

### 1. 启动开发服务器

```bash
npm run docs:dev
```

浏览器会自动打开 http://localhost:5173，你就可以开始编写笔记了！

### 2. 添加新笔记

在 `docs/notes/` 目录创建新的 `.md` 文件：

```markdown
# 我的笔记标题

## 第一个小标题

这是笔记内容...
```

然后在 `docs/.vitepress/config.mjs` 中的 `sidebar` 添加链接：

```javascript
sidebar: {
  '/notes/': [
    {
      text: '笔记',
      items: [
        { text: '我的笔记', link: '/notes/my-note' }
      ]
    }
  ]
}
```

### 3. 本地预览

```bash
npm run docs:build
npm run docs:preview
```

## 🌐 部署到 GitHub Pages

### 第一步：初始化 Git 仓库

```bash
git init
git add .
git commit -m "初始提交"
```

### 第二步：创建 GitHub 仓库

1. 访问 https://github.com/new
2. 创建新仓库，名称为 `note-blog`
3. 复制仓库 URL

### 第三步：推送代码

```bash
git remote add origin https://github.com/你的用户名/note-blog.git
git branch -M main
git push -u origin main
```

### 第四步：启用 GitHub Pages

1. 进入仓库 → Settings → Pages
2. 选择 "GitHub Actions" 作为部署来源
3. 自动构建会开始运行

### 第五步：访问你的博客

构建完成后访问：
```
https://你的用户名.github.io/note-blog/
```

## 🎨 主题自定义

### 修改配色

编辑 `docs/.vitepress/theme/style.css`，修改 CSS 变量：

```css
:root {
  /* 主品牌色（蓝色） */
  --vp-c-brand: #2563eb;
  
  /* 背景色（白色） */
  --vp-c-bg: #ffffff;
  
  /* 文字色 */
  --vp-c-text-1: #1e293b;
}
```

### 修改导航和侧边栏

编辑 `docs/.vitepress/config.mjs` 中的 `themeConfig`：

```javascript
themeConfig: {
  nav: [
    { text: '首页', link: '/' },
    { text: '笔记', link: '/notes/' }
  ],
  sidebar: {
    '/notes/': [
      {
        text: '分类名称',
        items: [
          { text: '笔记标题', link: '/notes/file-name' }
        ]
      }
    ]
  }
}
```

## 💡 常用命令

| 命令 | 说明 |
|------|------|
| `npm run docs:dev` | 启动开发服务器 |
| `npm run docs:build` | 构建生产版本 |
| `npm run docs:preview` | 预览生产版本 |
| `git push` | 推送代码到 GitHub |

## 📝 Markdown 语法示例

### 标题
```markdown
# 一级标题
## 二级标题
### 三级标题
```

### 文本格式
```markdown
**粗体**
*斜体*
~~删除线~~
`代码`
```

### 代码块
```markdown
\`\`\`javascript
console.log('Hello World');
\`\`\`
```

### 列表
```markdown
- 项目 1
- 项目 2

1. 第一步
2. 第二步
```

### 表格
```markdown
| 列1 | 列2 |
|-----|-----|
| 内容 | 内容 |
```

### 链接和图片
```markdown
[链接文字](https://example.com)
![图片描述](image.url)
```

### 提示框
```markdown
::: tip
提示内容
:::

::: warning
警告内容
:::
```

## ❓ 常见问题

**Q: 部署后样式没有显示？**  
A: 检查 `config.mjs` 中的 `base` 是否与仓库名一致。

**Q: 如何使用自己的域名？**  
A: 创建 `CNAME` 文件，配置 DNS，详见 `DEPLOY.md`。

**Q: 如何修改博客标题？**  
A: 编辑 `config.mjs` 中的 `title` 字段。

**Q: 支持哪些 Markdown 语法？**  
A: VitePress 支持完整的 CommonMark 和 GFM 扩展。

## 🔗 相关资源

- [VitePress 官方文档](https://vitepress.dev)
- [Vue3 官方文档](https://vuejs.org)
- [Markdown 完整语法](https://markdown.com.cn)
- [GitHub Pages 文档](https://pages.github.com)
- [GitHub Actions 文档](https://docs.github.com/en/actions)

---

**现在就开始添加你的笔记吧！** 📚✨

有任何问题，参考 `DEPLOY.md` 中的详细部署指南。
