import { defineConfig } from 'vitepress'

export default defineConfig({
  title: '笔记博客',
  description: '基于 VitePress 的个人笔记博客',
  lang: 'zh-CN',

  // GitHub Pages 部署配置
  base: '/javazuoye/',

  // 忽略死链接检查
  ignoreDeadLinks: true,

  themeConfig: {
    logo: '📝',

    nav: [
      { text: '首页', link: '/' },
      { text: '笔记', link: '/notes/' },
      { text: 'GitHub', link: 'https://github.com' }
    ],

    sidebar: {
      '/notes/': []
    },

    footer: {
      message: '',
      copyright: 'Copyright © 2026 个人笔记博客'
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com' }
    ]
  }
})
