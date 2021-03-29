const path = require('path')
const math = require('remark-math')
const katex = require('rehype-katex')

module.exports = {
  title: 'Cansiny的博客',
  tagline: '记录生活',
  titleDelimiter: '-',
  url: 'https://cansiny0320.now.sh/',
  baseUrl: '/',
  favicon: 'img/favicon.ico',
  organizationName: 'Cansiny0320', // Usually your GitHub org/user name.
  projectName: 'blog', // Usually your repo name.
  stylesheets: [
    {
      href: 'https://fonts.font.im/css?family=Raleway:500,700&display=swap',
      type: 'text/css',
      rel: 'stylesheet',
    },
    {
      href: 'https://cansiny.oss-cn-shanghai.aliyuncs.com/assets/katex.min.css',
      type: 'text/css',
      integrity: 'sha384-AfEj0r4/OFrOo5t7NnNe46zW/tFgW6x/bCJG8FqQCEo3+Aro6EYUG4+cU+KJWu/X',
      crossorigin: 'anonymous',
    },
  ],
  themeConfig: {
    navbar: {
      title: 'CANSINY',
      logo: {
        alt: 'CANSINY',
        src: 'img/logo.jpg',
        srcDark: 'img/logo.jpg',
      },
      items: [
        {
          to: '/',
          label: '博客',
          position: 'right',
          items: [
            {
              label: '前端',
              to: 'tags/前端',
            },
            {
              label: '生活',
              to: 'tags/生活',
            },
          ],
        },
        {
          label: '笔记',
          position: 'right',
          items: [
            {
              label: 'JS',
              to: 'docs/notes/js/01-prototype/prototype',
            },
            {
              label: '每日一题',
              to: 'docs/notes/everyday-one-question/01-JavaScript/everyday-one-question-js',
            },
            {
              label: 'leetcode',
              to: 'docs/notes/leetcode/01-hot100/hot100',
            },
          ],
        },
        {
          label: '项目',
          position: 'right',
          to: 'docs/projects/projects-intro',
        },
        {
          href: 'https://github.com/Cansiny0320',
          label: 'GitHub',
          position: 'right',
        },
        {
          href: 'https://cansiny0320.now.sh/rss.xml',
          label: 'RSS',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Social',
          items: [
            {
              label: '博客',
              to: '/',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/Cansiny0320',
            },
            {
              label: 'Bilibili 哔哩哔哩',
              href: 'https://space.bilibili.com/4377132',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} cansiny0320 (王嘉欣) Built with Docusaurus.`,
    },
    prism: {
      theme: require('prism-react-renderer/themes/github'),
      darkTheme: require('prism-react-renderer/themes/oceanicNext'),
      defaultLanguage: 'javascript',
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/Cansiny0320/blog/tree/main',
          remarkPlugins: [math],
          rehypePlugins: [katex],
          showLastUpdateTime: true,
        },
        blog: {
          path: './blog',
          routeBasePath: '/',
          blogSidebarTitle: '近期文章',
          feedOptions: {
            type: 'all',
            title: 'Cansiny0320',
            copyright: `Copyright © ${new Date().getFullYear()} Cansiny0320 (王嘉欣) Built with Docusaurus.`,
          },
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
        sitemap: {
          cacheTime: 600 * 1000, // 600 sec - cache purge period
          changefreq: 'daily',
          priority: 0.5,
        },
      },
    ],
  ],
  // themes: ['@docusaurus/theme-live-codeblock'],
  plugins: [path.resolve(__dirname, './src/plugin/plugin-baidu-analytics')],
}
