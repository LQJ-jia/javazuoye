import { defineConfig } from 'vitepress'

export default defineConfig({
  title: '笔记博客',
  description: '基于 VitePress 的个人笔记博客',
  lang: 'zh-CN',
  
  // GitHub Pages 部署配置
  base: '/note-blog/',
  
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
      '/notes/': [
        {
          text: '笔记',
          items: [
            { text: '快速开始', link: '/notes/quick-start' },
            { text: '示例笔记', link: '/notes/example' }
          ]
        }
      ]
    },

    footer: {
      message: '使用 VitePress + Vue3 构建',
      copyright: 'Copyright © 2024 个人笔记博客'
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com' }
    ]
  }
})
