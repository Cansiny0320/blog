const path = require("path")
const math = require("remark-math")
const katex = require("rehype-katex")

module.exports = {
  title: "Cansiny的博客",
  tagline: "记录生活",
  titleDelimiter: "-",
  url: "https://cansiny0320.now.sh/",
  baseUrl: "/",
  favicon: "img/favicon.ico",
  organizationName: "Cansiny0320", // Usually your GitHub org/user name.
  projectName: "blog", // Usually your repo name.
  stylesheets: [
    {
      rel: "preconnect",
      href: "https://hmcdn.baidu.com",
      type: "text/css",
    },
    {
      href: "https://cansiny.oss-cn-shanghai.aliyuncs.com/assets/fonts.css",
      type: "text/css",
      rel: "stylesheet",
    },
    {
      href: "./static/katex/katex.min.css",
      type: "text/css",
      integrity:
        "sha384-Um5gpz1odJg5Z4HAmzPtgZKdTBHZdw8S29IecapCSB31ligYPhHQZMIlWLYQGVoc",
      crossorigin: "anonymous",
    },
    // {
    //   href: "react-zmage/ssr/style.css",
    // },
  ],
  themeConfig: {
    hideableSidebar: true,
    navbar: {
      title: "CANSINY",
      logo: {
        alt: "CANSINY",
        src: "img/logo.jpg",
        srcDark: "img/logo.jpg",
      },
      items: [
        {
          to: "/",
          label: "博客",
          position: "right",
          items: [
            {
              label: "JavaScript",
              to: "tags/java-script",
            },
            {
              label: "性能优化",
              to: "tags/性能优化",
            },
            {
              label: "浏览器",
              to: "tags/浏览器",
            },
            {
              label: "生活",
              to: "tags/生活",
            },
          ],
        },
        {
          label: "笔记",
          position: "right",
          items: [
            {
              label: "JS",
              to: "docs/notes/js/prototype",
            },
            // {
            //   label: '每日一题',
            //   to: 'docs/notes/everyday-one-question/01-JavaScript/everyday-one-question-js',
            // },
            {
              label: "leetcode",
              to: "docs/notes/leetcode/hot100",
            },
          ],
        },
        {
          label: "阅读",
          position: "right",
          items: [
            {
              label: "你不知道的JS",
              to: "docs/books/You-Dont-Know-JS/what-is-scope",
            },
            {
              label: "babel 插件通关秘籍",
              to: "docs/books/learn-babel-plugin/babel-start",
            },
          ],
        },
        {
          href: "https://github.com/Cansiny0320",
          label: "GitHub",
          position: "right",
        },
        {
          href: "https://cansiny0320.now.sh/rss.xml",
          label: "RSS",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        // {
        //   title: 'Social',
        //   items: [
        //     {
        //       label: '博客',
        //       to: '/',
        //     },
        //     {
        //       label: 'GitHub',
        //       href: 'https://github.com/Cansiny0320',
        //     },
        //     {
        //       label: 'Bilibili 哔哩哔哩',
        //       href: 'https://space.bilibili.com/4377132',
        //     },
        //   ],
        // },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} cansiny0320 (王嘉欣) Built with Docusaurus.`,
    },
    prism: {
      theme: require("prism-react-renderer/themes/github"),
      darkTheme: require("prism-react-renderer/themes/oceanicNext"),
      defaultLanguage: "javascript",
      additionalLanguages: ["java"],
    },
  },
  presets: [
    [
      "@docusaurus/preset-classic",
      {
        docs: {
          sidebarPath: require.resolve("./sidebars.js"),
          editUrl: "https://github.com/Cansiny0320/blog/tree/main",
          remarkPlugins: [math],
          rehypePlugins: [katex],
          showLastUpdateTime: true,
        },
        blog: {
          path: "./blog",
          routeBasePath: "/",
          blogSidebarTitle: "近期文章",
          feedOptions: {
            type: "all",
            title: "Cansiny0320",
            copyright: `Copyright © ${new Date().getFullYear()} Cansiny0320 (王嘉欣) Built with Docusaurus.`,
          },
        },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
        sitemap: {
          changefreq: "daily",
          priority: 0.5,
        },
      },
    ],
  ],
  // themes: ['@docusaurus/theme-live-codeblock'],
  plugins: [path.resolve(__dirname, "./src/plugin/plugin-baidu-analytics")],
}
