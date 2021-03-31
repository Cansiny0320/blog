---
slug: browser-cache
title: 详解浏览器缓存
author: Cansiny0320
author_title: 前端开发者
author_url: https://github.com/Cansiny0320
author_image_url: https://gitee.com/cansiny0320/file-bed/blob/master/logo.jpgssig=EvXmyu%2FXsX
tags: [性能优化, 浏览器, 缓存]
---

缓存可以说是性能优化中简单高效的一种优化方式了。一个优秀的缓存策略可以缩短网页请求资源的距离，减少延迟，并且由于缓存文件可以重复利用，还可以减少带宽，降低网络负荷。

对于一个数据请求来说，可以分为发起网络请求、后端处理、浏览器响应三个步骤。浏览器缓存可以帮助我们在第一和第三步骤中优化性能。比如说直接使用缓存而不发起请求，或者发起了请求但后端存储的数据和前端一致，那么就没有必要再将数据回传回来，这样就减少了响应数据。

<!--truncate-->

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1615703736574.png)

## 缓存位置

缓存从缓存位置上来说分为四种，并且各自有优先级，当依次查找缓存且都没有命中的时候，才会去请求网络。

- Service Worker
- Memory Cache
- Disk Cache
- Push Cache

### Service Worker

Service Worker 是运行在浏览器背后的独立线程，一般可以用来实现缓存功能。使用 Service Worker 的话，传输协议必须为 HTTPS。因为 Service Worker 中涉及到请求拦截，所以必须使用 HTTPS 协议来保障安全。**Service Worker 的缓存与浏览器其他内建的缓存机制不同，它可以让我们自由控制缓存哪些文件、如何匹配缓存、如何读取缓存，并且缓存是持续性的**。

Service Worker 实现缓存功能一般分为三个步骤：首先需要先注册 Service Worker，然后监听到 install 事件以后就可以缓存需要的文件，那么在下次用户访问的时候就可以通过拦截请求的方式查询是否存在缓存，存在缓存的话就可以直接读取缓存文件，否则就去请求数据。

当 Service Worker 没有命中缓存的时候，我们需要去调用 fetch 函数获取数据。也就是说，如果我们没有在 Service Worker 命中缓存的话，会根据缓存查找优先级去查找数据。但是不管我们是从 Memory Cache 中还是从网络请求中获取的数据，浏览器都会显示我们是从 Service Worker 中获取的内容。

关于 Service Worker 还有许多内容，以后单独解析。

[借助 Service Worker 和 cacheStorage 缓存及离线开发](https://www.zhangxinxu.com/wordpress/2017/07/service-worker-cachestorage-offline-develop/)

[浏览器缓存、CacheStorage、Web Worker 与 Service Worker](https://github.com/youngwind/blog/issues/113)

### Memory Cache 和 Disk Cache

Memory Cache 指的是内存缓存，从效率上讲它是最快的。但是从存活时间来讲又是最短的，**一旦我们关闭 Tab 页面，内存中的缓存也就被释放了**。

Disk Cache 就是存储在磁盘中的缓存，从存取效率上讲是比内存缓存慢的，但是他的优势在于存储容量和存储时长。

好，现在问题来了，既然两者各有优劣，那浏览器如何决定将资源放进内存还是硬盘呢？主要策略如下：

- 比较大的 JS、CSS 文件会直接被丢进磁盘，反之丢进内存
- 内存使用率比较高的时候，文件优先进入磁盘

一些具体的表现可以看知乎上的这个回答

[浏览器是根据什么决定「from disk cache」与「from memory cache」？](https://www.zhihu.com/question/64201378)

[memoryCache 和 diskCache 流程详解](https://blog.csdn.net/m632587166/article/details/50732205)

### Push Cache

push cache 是`HTTP/2`的内容，它是浏览器缓存的最后一道防线，**它只在会话（Session）中存在，一旦会话结束就被释放，并且缓存时间也很短暂**，在 Chrome 浏览器中只有 5 分钟左右，同时它也并非严格执行 HTTP 头中的缓存指令。

[HTTP/2 push is tougher than I thought](https://jakearchibald.com/2017/h2-push-tougher-than-i-thought/)

## 缓存策略

浏览器缓存策略分为两种：`强缓存`和`协商缓存`，并且缓存策略都是通过设置 `HTTP Header` 来实现的。

### 强缓存

浏览器首先使用的是强缓存

使用强缓存的时候不会发送`HTTP`请求，直接从缓存中读取资源，返回状态码为 200，size 显示为 from disk cache 或 from memory cache。

强缓存可以通过设置两种 HTTP Header 实现：`Expires` 和 `Cache-Control`

#### Expires(HTTP/1.0)

`Expires`即过期时间，存在于服务端返回的响应头中，告诉浏览器在这个过期时间之前可以直接从缓存里面获取数据，无需再次请求。比如下面这样:

```http
Expires: Wed, 22 Nov 2019 08:41:00 GMT
```

表示资源在`2019年11月22号8点41分`过期，过期了就得向服务端发请求。

这个方式看上去没什么问题，合情合理，但其实潜藏了一个坑，那就是**服务器的时间和浏览器的时间可能并不一致**，那服务器返回的这个过期时间可能就是不准确的。因此这种方式很快在后来的 HTTP1.1 版本中被抛弃了。

#### Cache-Control(HTTP/1.1)

在 HTTP/1.1 中，`Cache-Control`是最重要的规则，主要用于控制网页缓存。

Cache-Control 可以在请求头或者响应头中设置，并且可以组合使用多种指令：

```http
cache-control: public, max-age=31536000
```

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1617108619459-Cache-Control.png)

强缓存的机制可以用下面这张图来概括

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1617110633504.png)

### 协商缓存

强缓存失效之后，就进入了协商缓存阶段

浏览器在请求头中携带缓存标识，服务器根据缓存标识决定是否使用缓存，协商缓存生效则返回 304 和 Not Modified，失效则返回 200 和请求结果

协商缓存可以可以通过设置两种 HTTP Header 实现：`Last-Modified` 和 `ETag`

### Last-Modified 和 If-Modified-Since

浏览器第一次访问资源时，response header 携带 Last-Modified（资源在服务器上的最后修改时间，最小单位 s），浏览器接收后缓存，下一次请求这个资源时 request header 携带 `If-Modified-Since`，如果修改时间没有变化，就使用缓存，返回 304，否则返回新资源和 200

```http
Last-Modified: Tue, 30 Mar 2021 03:30:52 GMT
```

**Last-Modified 存在一些弊端**

- 如果本地打开缓存文件，即使没有对文件进行修改，但还是会造成 Last-Modified 被修改，服务端不能命中缓存导致发送相同的资源
- 因为 Last-Modified 只能以秒计时，如果在不可感知的时间内修改完成文件，那么服务端会认为资源还是命中了，不会返回正确的资源

### ETag 和 If-None-Match

Etag 是服务器响应请求时，返回当前资源文件的一个唯一标识(由服务器生成)，只要资源有变化，Etag 就会重新生成。浏览器在下一次加载资源向服务器发送请求时，会将上一次返回的 Etag 值放到 request header 里的`If-None-Match`里，服务器只需要比较客户端传来的 If-None-Match 跟自己服务器上该资源的 ETag 是否一致，就能很好地判断资源相对客户端而言是否被修改过了。

如果服务器发现 ETag 匹配不上，那么会返回 200 和新的资源（当然也包括了新的 ETag）发给客户端；

如果 ETag 是一致的，则直接返回 304 知会客户端直接使用本地缓存即可。

## 缓存机制

强制缓存优先于协商缓存进行，若强制缓存(Expires 和 Cache-Control)生效则直接使用缓存，若不生效则进行协商缓存(Last-Modified / If-Modified-Since 和 Etag / If-None-Match)，协商缓存由服务器决定是否使用缓存，若协商缓存失效，那么代表该请求的缓存失效，返回 200，重新返回资源和缓存标识，再存入浏览器缓存中；生效则返回 304，继续使用缓存。具体流程图如下：

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1617154053085.png)

看到这里，不知道你是否存在这样一个疑问:**如果什么缓存策略都没设置，那么浏览器会怎么处理？**

对于这种情况，浏览器会采用一个启发式的算法，通常会取响应头中的 Date 减去 Last-Modified 值的 10% 作为缓存时间。

## 实际场景应用缓存策略

### 不使用缓存资源

#### 1. meta 缓存头设置为禁止缓存

在 html 的 head 标签中加入下面内容，就可以禁止浏览器读取缓存

```html
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
<meta http-equiv="Pragma" content="no-cache" />
<meta http-equiv="Expires" content="0" />
```

`Cache-Control`作用于`HTTP1.1` `Pragma`作用于`HTTP1.0` `Expires`作用于`proxies`

但这样浏览器在资源没修改的时候也不能加载缓存，十分影响体验

#### 2. js、css 加上版本号

当请求 js、css 的时候，给他们最后加上版本号，浏览器发现版本高了，就自然而然不会读取低版本的缓存了 版本号并不需要改变文件名，只需要在调用 js、css 的时候在最末尾加上`?v=1.0`即可，比如

```text
custom.css?v=1.0
main.js?v=2.0
```

当然版本号也可以自动添加随机数，不过这样就违背了版本号的初衷了，这样同样浏览器在资源没修改的时候也不能加载缓存，影响体验 随机版本号的添加方法，使用一个随机函数即可，当然，这样就只能通过 js 中写 js 的调用语句，比如

```js
document.write(" <script src='test.js?v= " + Math.random() + " '></s " + ' cript> ')
```

或者是

```js
var js = document.createElement(' script ')
js.src = ' test.js' + '?v=' + Math.random()
document.body.appendChild(js)
```

#### 3. 添加 MD5

MD5 相当于一个文件的身份证号，每个文件的 MD5 都不一样，同一个文件只要经过修改，MD5 也不一样，所以我们可以通过 MD5 判断资源是否经过修改。当然这不可能让我们自己一个一个判断添加，肯定是服务器的事，我们这里不多说

### 频繁变动的资源

> _Cache-Control: no-cache_

对于频繁变动的资源，首先需要使用`Cache-Control: no-cache` 使浏览器每次都请求服务器，然后配合 ETag 或者 Last-Modified 来验证资源是否有效。这样的做法虽然不能节省请求数量，但是能显著减少响应数据大小。

### 不常变化的资源

> _Cache-Control: max-age=31536000_

通常在处理这类资源时，给它们的 Cache-Control 配置一个很大的 `max-age=31536000` (一年)，这样浏览器之后请求相同的 URL 会命中强制缓存。而为了解决更新的问题，就需要在文件名(或者路径)中添加 hash， 版本号等动态字符，之后更改动态字符，从而达到更改引用 URL 的目的，让之前的强制缓存失效 (其实并未立即失效，只是不再使用了而已)。
在线提供的类库 (如 `jquery-3.3.1.min.js`, `lodash.min.js` 等) 均采用这个模式。

## 用户行为对浏览器缓存的影响

所谓用户行为对浏览器缓存的影响，指的就是用户在浏览器如何操作时，会触发怎样的缓存策略。主要有 3 种：

- 打开网页，地址栏输入地址： 查找 disk cache 中是否有匹配。如有则使用；如没有则发送网络请求。
- 普通刷新 (F5)：因为 TAB 并没有关闭，因此 memory cache 是可用的，会被优先使用(如果匹配的话)。其次才是 disk cache。
- 强制刷新 (Ctrl + F5)：浏览器不使用缓存，因此发送的请求头部均带有 `Cache-control: no-cache`(为了兼容，还带了 `Pragma: no-cache`),服务器直接返回 200 和最新内容。

## ref

[浏览器缓存机制](https://zhuanlan.zhihu.com/p/54314093)

[谈谈前端缓存](http://47.98.159.95/my_blog/blogs/perform/001.html)

[如何解决静态资源的缓存问题](https://zhuanlan.zhihu.com/p/83091549)
