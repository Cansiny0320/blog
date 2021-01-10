const path = require('path')

module.exports = {
  title: 'Cansiny的博客',
  tagline: '记录生活',
  titleDelimiter: '-',
  url: 'https://Cansiny0320.github.io/',
  baseUrl: '/',
  favicon: 'img/favicon.ico',
  organizationName: 'Cansiny0320', // Usually your GitHub org/user name.
  projectName: 'Cansiny0320.github.io', // Usually your repo name.
  stylesheets: ['https://fonts.font.im/css?family=Raleway:500,700'],
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
          ],
        },
        {
          label: '项目',
          position: 'right',
          to: 'docs/projects/projects-intro',
        },
        // {
        //   href: 'https://www.itnanls.cn',
        //   label: '后端学习',
        //   position: 'right',
        // },
        {
          href: 'https://github.com/Cansiny0320',
          label: 'GitHub',
          position: 'right',
        },
        // {
        //   href: "https://github.com/zxuqian/frontend-questions/issues",
        //   label: "提问",
        //   position: "right",
        // },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        // {
        //   title: "Docs",
        //   items: [
        //     {
        //       label: "Style Guide",
        //       to: "docs/doc1"
        //     },
        //     {
        //       label: "Second Doc",
        //       to: "docs/doc2"
        //     }
        //   ]
        // },
        // {
        //   title: "Community",
        //   items: [
        //     {
        //       label: "Stack Overflow",
        //       href: "https://stackoverflow.com/questions/tagged/docusaurus"
        //     },
        //     {
        //       label: "Discord",
        //       href: "https://discordapp.com/invite/docusaurus"
        //     }
        //   ]
        // },
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
            // {
            //   label: '网易云课堂',
            //   href:
            //     'https://study.163.com/course/courseMain.htm?courseId=1210022809&share=2&shareId=480000002172128',
            // },
            // {
            //   label: '腾讯课堂',
            //   href: 'https://ke.qq.com/course/2839093?tuin=3850fdc6',
            // },
          ],
        },
        {
          // title: '友情链接',
          // items: [
          //   // {
          //   //   label: 'yuqing521のblog',
          //   //   to: 'https://yuqing521.github.io/',
          //   // },
          // ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} cansiny0320 (王嘉欣) Built with Docusaurus.`,
    },
    prism: {
      darkTheme: require('prism-react-renderer/themes/vsDark'),
      defaultLanguage: 'javascript',
    },
    // googleAnalytics: {
    //   trackingID: 'UA-118572241-1',
    //   anonymizeIP: true, // Should IPs be anonymized?
    // },
    // gtag: {
    //   trackingID: 'G-6PSESJX0BM',
    //   // Optional fields.
    //   anonymizeIP: true, // Should IPs be anonymized?
    // },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl:
            'https://github.com/Cansiny0320/blog/tree/main',
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
  themes: ['@docusaurus/theme-live-codeblock'],
  // plugins: [
  //   path.resolve(__dirname, './src/plugin/plugin-baidu-analytics'),
  //   path.resolve(__dirname, './src/plugin/plugin-baidu-push'),
  //   // path.resolve(__dirname, "./src/plugin/plugin-google-adsense"),
  // ],
}
