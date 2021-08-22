---
slug: node-start
title: node.js 入门
author: Cansiny0320
author_title: 前端开发者
author_url: https://github.com/Cansiny0320
author_image_url: https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1618298366420-logo.jpg
image: https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1622560197064.png
description: node.js 入门教程
keywords: [node.js, 教程, 入门]
tags: [JavaScript]
---

关于 node 入门的一篇课件

<!--truncate-->

## 前言

**Node.js 是什么？**

Node.js 是一个基于 Chrome V8 引擎的 JavaScript 运行时环境，就是你的 JavaScript 代码可以在 Node.js 里面跑。

**为什么需要 Node.js？**

- 性能好、部署容易，能够轻松处理高并发问题。

- 它让我们可以用 js 写后端程序，顶层路由设计等。

- Node.js 是前端工程化的重要支柱之一。（目前前端开发环境离不开 nodejs，是我们使用很多工具和提高开发效率的基础）

  ![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1622560197064.png)

**Node.js 特性**

1. **单线程 非阻塞 I/O 事件驱动**

   java/php/.net 服务器语言中，为每个客户端创建一个新的线程，要让 Web 应用程序支持更多的用户，就需要增加服务器的数量，这样硬件成本就变高了。

   nodejs 只使用一个线程，用户连接就触发一个内部事件，通过非阻塞 I/O、事件驱动机制，让程序宏观上是并行的。

   减少了内存开销，省去了操作系统创建/销毁线程的时间开销。![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1622560367012.png)

   当 Node.js 执行 I/O 操作时（例如从网络读取、访问数据库或文件系统），Node.js 会在响应返回时恢复操作，而不是阻塞线程并浪费 CPU 循环等待。

   这使 Node.js 可以在一台服务器上处理数千个并发连接，而无需引入管理线程并发的负担（这可能是重大 bug 的来源）。

   最后不管是新用户的请求还是老用户的 I/O 完成，都将以事件的方式加入事件循环，等待调度（注意不是排队，会优先执行老用户的回调函数）。

   ![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1622560596167.png)

2. **大量的库**

> npm 的简单结构有助于 Node.js 生态系统的激增，现在 npm 仓库托管了超过 1,000,000 个可以自由使用的开源库包。

基本满足了我们的所有需求

**Node.js 能做什么**

说 Node.js 能做什么,不如说说我用 Node.js 做了什么吧。

- 爬虫 爬图片 [爬小说](https://github.com/Cansiny0320/book-spider)...
- 自动化脚本,优化重复性劳作
- [在线聊天室](https://github.com/Cansiny0320/lan-chat-room)
- [QQ 机器人](https://github.com/Cansiny0320/qq-group-bot)
- ...

当然 Node.js 还能做

- 后端
- 深度学习
- ...

## Node.js 基础

首先先检查一下自己的 node 装好了没有

```bash
$ node -v
$ npm -v
```

### `CommonJS` 规范（模块化）

**引入模块**

```js
const fs = require('fs')
```

**导出模块**

两种方式

```js
module.exports.add = (x, y) => x + y
module.exports = (x, y) => x + y
```

第一种导出方式相当于在`module.exports`上加了一个`add`属性，而第二种则是将整个模块变赋值为一个函数

第一种导出的使用方式

```
const add = require("./add")

console.log(add.add(1, 2)) // 3
```

而第二种

```js
const add = require('./add')

console.log(add(1, 2)) // 3
```

应该很好理解吧

同时我们又有了一个问题，如果我的文件模块和核心模块(node 提供的模块)同名，node 会使用哪一个？

我们来测试一下

```js
// fs.js
module.exports = () => console.log('fs')
```

```js
const fs = require('fs')

console.log(fs)
/**
  {
  appendFile: [Function: appendFile],
  appendFileSync: [Function: appendFileSync],
  ...
 }
 */
```

使用了核心模块

```js
const fs = require('./fs')

console.log(fs) // [Function (anonymous)]
```

使用了我们自己的文件模块

**那么 node 寻找模块的机制到底是怎样的呢？**

在 node 中引入模块，需要经历如下 3 个步骤

1. 路径分析
2. 文件定位
3. 编译执行

核心模块部分在 node 源代码的编译过程中，编译成了二进制执行文件。在 node 进程启动的时候，部分核心模块就直接被加载进了内存中，所以这部分核心模块引入时，文件定位和编译执行这两个步骤直接被省略，并且在路径分析中优先判断，所以加载速度是最快的。

文件模块则是在运行时**动态加载**，需要完整走完 3 个步骤，加载较慢。

详情请看 [深入浅出 Node.js](https://www.ituring.com.cn/book/1290)

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1622563958665.png)

### 基本模块

node 内置了一些基本的模块供我们使用，默认使用`CommonJS`规范

#### `fs`

`fs模块`就是文件系统模块，负责读写文件。`nodeJs`内置的`fs模块`提供了异步和同步的方法

同步方法就是在异步 API 后面加一个 `Sync` 后缀

```js
// 异步读文件
fs.readFile('./data.json', (error, data) => {
  if (error) {
    console.log(error)
  } else {
    console.log(data.toString())
  }
})

const data = [
  {
    name: 'wjx',
    age: '20',
  },
  {
    name: 'wjx',
    age: '20',
  },
]

// 异步写文件
fs.writeFile('./data2.json', JSON.stringify(data), error => {
  if (error) console.log(error)
})

//同步读文件
file = fs.readFileSync(filePath)

//同步写入文件
fs.writeFileSync(filename, data)
```

其他的一些方法

- `fs.stat(path[,options],callback)`

返回一个文件或目录的信息

```js
fs.stat('./index.js', (err, stats) => {
  console.log(stats)
})
```

`stats`包含的参数很多，介绍几个常用的

```typescript
export interface StatsBase<T> {
  isFile(): boolean // 判断是否是一个文件
  isDirectory(): boolean // 判断是否一个目录

  size: T // 大小（字节数）
  atime: Date // 访问时间
  mtime: Date // 上次文件内容修改时间
  ctime: Date // 上次文件状态改变时间
  birthtime: Date // 创建时间
}
```

一般我们会使用 `fs.stat` 来取文件的大小，做一些判断逻辑，比如发布的时候可以检测文件大小是否符合规范。

- `fs.readdir(path[, options], callback)`

`fs.readdir(path)` 获取 `path` 目录下的文件和目录，返回值为一个包含 `file` 和 `directory` 的数组。

假设当前目录为：

```
.
├── a
│   ├── a.js
│   └── b
│       └── b.js
├── index.js
└── package.json
```

执行以下代码：

```js
const fs = require('fs')

fs.readdir(process.cwd(), function (error, files) {
  if (!error) {
    console.log(files)
  }
})
```

返回值为：

```json
["a", "index.js", "package.json"]
```

可以看到这里只返回了根目录下的文件和目录，并没有去深度遍历。所以如果需要获取所有文件名，就需要自己实现递归。

```js
//删除文件
fs.unlink(path , callback)
//截断文件
fs.truncate(path , len ,  callback) 返回true和flase
//创建目录
 fs.mkdir(path , [mode] , callback)
//删除目录
fs.rmkdir(path , callback)
...
```

#### `path`

- `path.join(...paths)`

用于连接路径。该方法的主要用途在于，会正确使用当前系统的路径分隔符，Unix 系统是"`/`"，Windows 系统是" `\`"。

```js
console.log(path.join('/path', '/user')) //\path\user
```

- `path.resolve(...paths)`

用于构建绝对路径，保证无论在什么目录下执行 node 程序都可以正确找到文件地址

```js
const path = require('path')

console.log(path.resolve(__dirname, './data.json')) // D:\frontend\demo\class\node\data.json
```

#### `http`

- `http.createServer([requestListener])`

创建 HTTP 服务器

- `server.listen()`

监听端口

```js
const http = require('http')

//创建http服务器
const server = http.createServer((req, res) => {
  res.end('hello world')
})

//监听8000端口,等待连接
server.listen(8000, () => {
  console.log('server is running at http://localhost:8000')
})
```

**简易文件服务器**

```JS
const http = require("http")
const fs = require("fs")
const path = require("path")

const fileShow = pathname => {
  //查看输入路由对应的是文件还是路由
  return new Promise(resolve => {
    fs.stat(pathname, (err, stats) => {
      if (err || !stats.isFile()) {
        resolve(false)
      }
      fs.readFile(pathname, "utf-8", (err, data) => {
        if (err) resolve(false)
        resolve(data)
      })
    })
  })
}

const server = http.createServer((req, res) => {
  const { url, method } = req
  if (method === "GET") {
    fileShow(path.resolve(__dirname, "." + url)).then(data => {
      if (!data) {
        res.writeHead(404)
        res.end("404 not found")
      } else {
        res.writeHead(200, {
          "Content-Type": "text/plain; charset=utf-8",
        })
        res.end(data)
      }
    })
  }
})
server.listen(8000, () => {
  console.log("server is running at http://localhost:8000")
})
```

**简易后端**

服务端

```js
const http = require('http')
const querystring = require('querystring')

const server = http.createServer((req, res) => {
  const { url, method } = req
  console.log(method, url)
  const path = url.split('?')[0]
  const query = querystring.parse(url.split('?')[1])

  const responseData = {
    url,
    method,
    path,
    query,
  }

  res.writeHead(200, {
    'Content-Type': 'application/json',
  })

  if (method === 'GET') {
    res.end(JSON.stringify(responseData))
  }
  if (method === 'POST') {
    let postData = ''
    req
      .on('data', chunk => {
        postData += chunk
      })
      .on('end', () => {
        responseData.postData = postData
        res.end(postData)
      })
  }
})

//监听8000端口,等待连接
server.listen(8000, () => {
  console.log('server is running at http://localhost:8000')
})
```

客户端

```js
const http = require('http')
http.get('http://localhost:8000/data', res => {
  let data = ''
  res.setEncoding('utf-8')
  res.on('data', chunk => {
    data += chunk
  })
  res.on('end', () => {
    res.statusCode = 200
    console.log(JSON.parse(data))
  })
})

const data = JSON.stringify([
  {
    name: 'wjx',
    age: '20',
  },
  {
    name: 'wjx',
    age: '20',
  },
  {
    name: 'wjx',
    age: '20',
  },
  {
    name: 'wjx',
    age: '20',
  },
  {
    name: 'wjx',
    age: '20',
  },
])

const options = {
  hostname: 'localhost',
  port: 8000,
  path: '/data',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
  },
}
const req = http.request(options, res => {
  res.on('data', d => {
    process.stdout.write(d)
  })
})

req.on('error', error => {
  console.error(error)
})

req.write(data)
req.end()
```

## NPM

> _npm_ 是 JavaScript 世界的包管理工具，并且是 Node.js 平台的默认包管理工具

简单来说，npm 上面有很多的开源库可供我们使用,我们也可以将自己的库发布到 npm 供他人使用

### cnpm

npm 默认的源的下载速度对于我们来说可能不太友好，可以使用`cnpm`或者更换 npm 的源为淘宝源来提升下载速度

[淘宝 NPM 镜像](http://npm.taobao.org/)

### package.json

在安装依赖之后，会自动生成一个`package.json`文件，它是用于定义包的属性，模块的描述文件

我们也可以用下面的命令来初始化一个`package.json`

```bash
$ npm init -y
```

下面用一个例子介绍一下`package.json`一些字段的含义

```json
{
  "name": "book-spider",
  "version": "1.0.0",
  "main": "index.js",
  "license": "MIT",
  "scripts": {
    "spider": "npx ts-node src/index.ts",
    "test": "npx ts-node src/test.ts"
  },
  "devDependencies": {
    "@types/node": "^15.3.1",
    "@types/optimist": "^0.0.29",
    "@types/signale": "^1.4.1",
    "ts-node": "^9.1.1",
    "typescript": "^4.2.4"
  },
  "dependencies": {
    "@types/axios": "^0.14.0",
    "@types/cheerio": "^0.22.28",
    "axios": "^0.21.1",
    "cheerio": "^1.0.0-rc.9",
    "optimist": "^0.6.1",
    "signale": "^1.4.0"
  }
}
```

- version 版本号 `^`表示固定版本号
- devDependencies 项目开发所需要的依赖 如一些打包工具、类型定义文件等
- dependencies 项目运行所需要的依赖
- scripts npm 脚本 `npm run + [script]` 执行

> `package-lock.json` 只是为了确保依赖包的正常使用，比如锁定依赖树，包的版本等等

### npm install

`npm install/i <pkg>`安装 node 包/模块

```bash
npm i # 安装所有依赖
npm i --save / -S <pkg> # 安装依赖到 dependencies，和默认情况一致
npm i --save-dev / -D <pkg> # 安装依赖到 devDependencies
npm i -g <pkg> #安装依赖到全局
```

install 命令总是安装模块的最新版本（指正式发布的最新版本），如果要安装模块的指定版本，可以在模块名后面加上@和版本号。

### node_modules

`node_modules`文件夹下面就是我们安装的依赖，提交到 git 的时候请用`.gitignore`文件忽略

## refs

[「万字整理 」这里有一份 Node.js 入门指南和实践,请注意查收 ❤️](https://juejin.cn/post/6844904029219192839)

[Node.js 中文网](http://nodejs.cn/)
