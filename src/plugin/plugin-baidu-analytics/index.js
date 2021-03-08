module.exports = function (context, options) {
  return {
    name: 'docusaurus-baidu-analytics-plugin',
    injectHtmlTags() {
      return {
        headTags: [
          {
            tagName: 'script',
            innerHTML: `
            var _hmt = _hmt || [];
            (function() {
              var hm = document.createElement("script");
              hm.src = "https://hm.baidu.com/hm.js?7dda2565ba246ecd62878c13153e2941";
              hm.defer = true;
              var s = document.getElementsByTagName("script")[0]; 
              s.parentNode.insertBefore(hm, s);
            })();
          `,
          },
          {
            tagName: 'meta',
            attributes: {
              name: 'baidu-site-verification',
              content: 'IXU12YQUjF',
            },
          },
        ],
      }
    },
  }
}
