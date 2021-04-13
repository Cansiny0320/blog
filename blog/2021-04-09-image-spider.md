---
slug: image-spider
title: 记一次从网页爬取图片并下载到本地的过程和遇到的问题
author: Cansiny0320
author_title: 前端开发者
author_url: https://github.com/Cansiny0320
author_image_url: https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1618298366420-logo.jpg
tags: [JavaScript]
---

## 前言

博主编程启蒙在高中，当时听说 python 写爬虫很厉害，于是学了一段时间的 python，但当时对于编程语言中的各种概念一无所知，所以学习起来十分困难，最终只能照着网上的教程抄抄简单的爬虫（特别是对于使用了异步加载的网页一筹莫展），最近在浏览某个网站时发现该网站的图片专栏的页面结构十分统一，由于懒得一个一个帖子点开看，决定写一个爬虫爬到本地。

<!--truncate-->

## 爬虫

因为之前了解过使用 JS 写爬虫，于是很快就选择了`puppeteer`这个库来写爬虫。`puppeteer`是一个`无头浏览器`，可以不打开浏览器模拟浏览器的各种操作。

`puppeteer`的 API 基本都是异步的，所以我们需要一个 async 函数包裹，首先来介绍一下`puppeteer`主要的 API：

- `puppeteer.launch()` 返回一个 browser 实例
- `browser.newPage()` 返回一个新页面 当然我推荐使用`(await browser.pages())[0]` 这样就直接使用当前页面，不用新建页面了
- `page.goto(url)` 页面跳转
- `page.evaluate(fn)` 相当于在这个页面的控制台执行函数，所以不可访问外部的变量，外部也不可以访问里面的变量，最后会返回一个 promise 包裹 return 的结果

写爬虫的工具选择好后，接下来我们来分析一下页面，该网页的图片使用了懒加载，当图片到视窗的时候，src 才会被设置为真实的 url。

所以我们需要模拟滑动到底部的操作

```js
await page.evaluate(async () => {
  await new Promise((resolve, reject) => {
    let totalHeight = 0
    let distance = 100
    const timer = setInterval(() => {
      var scrollHeight = document.body.scrollHeight
      window.scrollBy(0, distance)
      totalHeight += distance
      if (totalHeight >= scrollHeight) {
        clearInterval(timer)
        resolve()
      }
    }, 50)
  })
  return [...document.querySelectorAll("selector")].map(item => item.src)
})
```

在图片全部加载后，再去获取图片 src

爬取完成之后我们再把数据保存起来

```js
async function mkdir(path, result) {
  fs.mkdir(path, { recursive: true }, err => {
    if (err) console.log(err)
    fs.writeFileSync(
      `./data/${typeName}${START_PAGE}-${END_PAGE}.json`,
      JSON.stringify(result),
      err => {
        if (err) console.log(err)
      },
    )
  })
}
```

这样我们的小爬虫就写好啦 😄

但当我测试的时候发现了一些问题 😥

由于网站在国外，国内访问时可能超时，`puppeteer`页面跳转默认超时时间 3000ms,所以我们需要自己设置 `page.setDefaultNavigationTimeout(0)`，设为 0 则超时时间无限制。

在爬取图片时，有很多的请求是我们不关心的，我们能不能过滤掉这些请求呢？当然可以。`puppeteer`很贴心的给了我们设置请求过滤器的 API

```js
const blockedResourceTypes = [
  "media",
  "font",
  "texttrack",
  "object",
  "beacon",
  "csp_report",
  "image", // 因为我们只是爬取图片地址，不需要加载出来
]
page.setRequestInterception(true)
page.on("request", async req => {
  // 根据请求类型过滤
  const resourceType = req.resourceType()
  if (blockedResourceTypes.includes(resourceType)) {
    req.abort()
  } else {
    req.continue()
  }
})
```

没有提示，不知道爬虫执行到哪了，加个进度显示吧

```js
exports.formatProgress = function (current, total, title = "当前进度", barLength = 40) {
  let percent = ((current / total) * 100).toFixed(2)
  let done = Math.floor((current / total) * barLength)
  let left = barLength - done
  let str = `${title}：[${"".padStart(done, "#")}${"".padStart(
    left,
    "-",
  )}]   ${percent}% ${current}/${total}`
  return str
}
```

是不是很人性化呀

## 下载图片

爬取到数据之后，就得把图片下载下来了，不然爬它干嘛是吧

怎么下载呢？打开百度，哦不，打开 Google，

很快就查到一个方法，使用`request`库来请求，`fs.createWriteStream`来写入

```js
request
  .get({
    url,
  })
  .on("error", function (err) {
    console.log(`request err: ${err} at ${url}`)
  })
  .pipe(
    fs
      .createWriteStream(`${dest}/${folder}/${name}`)
      .on("error", err => {
        console.log(`createWriteStream error: ${err} at ${url}`)
      })
      .on("close", err => {
        if (err) console.log(`createWriteStream close error: ${err} at ${url}`)
      }),
  )
```

看起来很美好，但我们真正使用的时候，还是会发现有很多问题

首先同步下载大量的图片速度太慢了，还有可能遇到`too many files`的报错，网上也提供了一些解决方法，我最终使用`bagpipe`来解决问题

```js
const Bagpipe = require("bagpipe")
const bagpipe = new Bagpipe(10)
bagpipe.push(downloadImage, url, dest, item.title, reason => {
  if (reason) console.log(reason)
})
```

有些图片地址在国内无法正常访问怎么办？挂上代理

```js
request.get({
  url,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36",
  },
  proxy: "http://0.0.0.0:1082/", // 需要你自己本地有代理工具
})
```

异步调用之后，`fs.createWriteStream` 无法正确创建文件报错，先用`fs.writeFile`创建一个空的文件

```js
fs.writeFile(`${dest}/${folder}/${name}`, "", err => {
  fs.createWriteStream()
})
```

创建的目录有非法字符创建失败，可以先用正则过滤一遍

```js
const illegalCharacterReg = /\/|\\|:|\*|\?|"|<|>|\|/g
fs.mkdir(`${dest}/${item.title.replace(illegalCharacterReg, "")}`, { recursive: true }, err => {...})
```

虽然下载的时候还会遇到一些问题`socket hang up`，`Client network socket disconnected before secure TLS connection was established`，但博主的能力暂时无法解决，网上也没有找到十分有效的方法，就先写到这里吧。
