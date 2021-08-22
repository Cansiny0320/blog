---
slug: url2pageshow
title: 一文总结从输入 URL 到页面呈现发生了什么
author: Cansiny0320
author_title: 前端开发者
author_url: https://github.com/Cansiny0320
author_image_url: https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1618298366420-logo.jpg
image: https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1629018536264.png
description: 总结从输入 URL 到页面呈现发生了什么
keywords: [浏览器, 网络协议]
tags: [浏览器, 网络协议]
---

这个问题是一个老生常谈，但非常考验知识的广度和深度的问题，我在这总结一下笔记。

<!--truncate-->

## 解析 URL

首先浏览器会判断你输入的是一个合法的 URL 还是一个待搜索的关键词，如果含有非法字符，浏览器会对其进行转义

在你离开当前页面时，还会触发一次当前页面的`beforeunload`事件，可以让页面退出之前执行一些数据清理工作，或者，有表单没有提交的情况提示用户是否确认离开

然后浏览器会开启一个`网络线程`去发送请求，在发送请求之前，还要去检查`强缓存`，如果命中直接使用，否则进入下一步。关于浏览器缓存可以看我的另一篇文章：[详解浏览器缓存](https://juejin.cn/post/6945790074374225956)

## DNS 解析

由于我们输入的是域名，而数据包是通过`IP地址`传给对方的。因此我们需要得到域名对应的`IP地址`。这个过程需要依赖一个服务系统，这个系统将域名和 IP 一一映射，我们将这个系统就叫做**DNS**（域名系统）。得到具体 IP 的过程就是`DNS`解析。

先进行本地 DNS 服务器解析，**递归解析**:

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1629018536264.png)

在这里任何一步找到就会结束查找流程（整个过程客户端只发出一次查询请求）

如果本地解析不到，则根据本地 DNS 服务器设置的转发器进行查询，若未用转发模式，再去域名服务器解析，**迭代解析**：

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1629018708308.png)

结合起来的过程，可以用一个图表示：

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1629018792307.png)

## 建立 TCP 连接

### 三次握手

拿到 IP 地址之后，我们就可以建立 TCP 连接了，要进行`三次握手`：

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1615795250574.png)

> ACK：此标志表示应答域有效，就是说前面所说的 TCP 应答号将会包含在 TCP 数据包中；有两个取值：0 和 1，为 1 的时候表示应答域有效，反之为 0。TCP 协议规定，只有 ACK=1 时有效，也规定连接建立后所有发送的报文的 ACK 必须为 1。
>
> SYN(SYNchronization)：在连接建立时用来同步序号。当 SYN=1 而 ACK=0 时，表明这是一个连接请求报文。对方若同意建立连接，则应在响应报文中使 SYN=1 和 ACK=1. 因此, SYN 置 1 就表示这是一个连接请求或连接接受报文。
>
> FIN(finis）即完，终结的意思， 用来释放一个连接。当 FIN = 1 时，表明此报文段的发送方的数据已经发送完毕，并要求释放连接。

1. 第一次握手：客户端发送一个`SYN`报文，设置 `SYN = 1`，初始序号`seq = x` , 客户端变为`SYN_SEND`状态。
2. 第二次握手：服务端接收到到`SYN`报文后，返回自己的`SYN`和`ACK`报文，其中`SYN = 1`，`ACK = 1`还有序号`seq = y`和确认号`ack = x+1`，服务端变为`SYN_REVD`状态。
3. 第三次握手：客户端收到`SYN`报文后，会发送一个`ACK`报文，其中`ACK = 1`,确认号`ack = y+1`和序号`seq = x+1`，此时客户端处于 `ESTABLISHED` 状态。服务器收到 `ACK` 报文之后，也处于 `ESTABLISHED` 状态，此时，双方已建立起了连接。

当然，如果再深入地问，比如**为什么要三次握手，两次不行吗？第三次握手失败了怎么办？为什么要四次挥手**等等这一系列的问题，这里不详细展开，推荐阅读[面试官，不要再问我三次握手和四次挥手](https://zhuanlan.zhihu.com/p/86426969)

### TLS 握手

如果使用的是`HTTPS`协议，那么还有一个`TLS`握手过程

根据 TLS 版本和密钥交换法不同，握手过程也不一样，有三种方式

#### RSA 握手

早期的 TLS 密钥交换法都是使用`RSA`算法，它的握手流程是这样子的

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1629024025030-%E6%97%A0%E6%A0%87%E9%A2%98-2021-08-13-1624.png)

1. 浏览器将一个随机数`client_random` 、TLS 版本和支持的加密算法列表发送给服务器
2. 服务器确认加密协议版本是否相同，然后将`server_random`、证书（含 CA 数字签名和公钥）和选择的加密算法传给浏览器
3. 浏览器使用公钥解密 CA 数字签名验证证书，然后将采用公钥加密的`pre_random`传给服务器
4. 服务器再用私钥解密`pre_random`，这样双方都拿到了三个随机数，各自使用之前确定好的加密算法将三个随机数加密生成最终对称加密用的密钥，开始通信

#### TLS1.2 握手

在 TLS1.2 版本中用`ECDHE`算法，它的握手流程是这样子的

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1629026402337.png)

1. 浏览器将一个随机数`client_random` 、TLS 版本和支持的加密算法列表发送给服务器
2. 服务器确认加密协议版本是否相同，然后将`server_random`、椭圆曲线参数`server_params`、证书（含 CA 数字签名和公钥）和选择的加密算法传给浏览器
3. 浏览器验证证书，发送椭圆曲线参数`client_params`给服务器
4. 浏览器通过`ECDHE`算法计算出`pre_random`（参数是`server_params`和`client_params`）
5. 服务器也通过`ECDHE`算法计算出`pre_random`
6. 这样双方都拿到了三个随机数，各自使用之前确定好的加密算法将三个随机数加密生成最终对称加密用的密钥，开始通信

#### TLS1.3 握手

在 TLS1.3 版本中废弃了 RSA 算法，因为 RSA 算法可能泄露私钥导致历史报文全部被破解，而 ECDHE 算法每次握手都会生成临时的密钥，所以就算私钥被破解，也只能破解一条报文，而不会对之前的历史信息产生影响，即具有`前向安全性`。

TLS1.3 版本中握手过程是这样子的

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1629029763237.png)

大体上和 TLS 1.2 的握手方式差不多，不过和 TLS 1.2 相比少了一个 RTT， 服务端不必等待对方验证证书之后才拿到`client_params`，而是直接在第一次握手的时候就能够拿到, 拿到之后立即生成`pre_random`，节省了之前不必要的等待时间。

这种 TLS 1.3 握手方式也被叫做**1-RTT 握手**。但其实这种`1-RTT`的握手方式还是有一些优化的空间的

**会话复用**

会话复用有两种方式: **Session ID**和**Session Ticket**。

先说说最早出现的**Seesion ID**，具体做法是客户端和服务器首次连接后各自保存会话的 ID，并存储会话密钥，当再次连接时，客户端发送`ID`过来，服务器查找这个 ID 是否存在，如果找到了就直接复用之前的会话状态，会话密钥不用重新生成，直接用原来的那份。

但这种方式也存在一个弊端，就是当客户端数量庞大的时候，对服务端的存储压力非常大。

因而出现了第二种方式——**Session Ticket**。它的思路就是: 服务端的压力大，那就把压力分摊给客户端呗。具体来说，双方连接成功后，服务器加密会话信息，用**Session Ticket**消息发给客户端，让客户端保存下来。下次重连的时候，就把这个 Ticket 进行解密，验证它过没过期，如果没过期那就直接恢复之前的会话状态。

这种方式虽然减小了服务端的存储压力，但与带来了安全问题，即每次用一个固定的密钥来解密 Ticket 数据，一旦黑客拿到这个密钥，之前所有的历史记录也被破解了。因此为了尽量避免这样的问题，密钥需要定期进行更换。

总的来说，这些会话复用的技术在保证`1-RTT`的同时，也节省了生成会话密钥这些算法所消耗的时间，是一笔可观的性能提升。

**PSK**

刚刚说的都是`1-RTT`情况下的优化，那能不能优化到`0-RTT`呢？

答案是可以的。做法其实也很简单，在发送**Session Ticket**的同时带上应用数据，不用等到服务端确认，这种方式被称为`Pre-Shared Key`，即 PSK。

这种方式虽然方便，但也带来了安全问题。中间人截获`PSK`的数据，不断向服务器重复发，类似于 TCP 第一次握手携带数据，增加了服务器被攻击的风险。

## 发送 HTTP 请求

现在`TCP连接`建立完毕，浏览器可以和服务器开始通信，即开始发送 HTTP 请求。浏览器发 HTTP 请求要携带三样东西:**请求行**、**请求头**和**请求体**。

同时也要带上**请求头**，比如**Cache-Control**、**If-Modified-Since**、**If-None-Match**都有可能被放入请求头中作为缓存的标识信息。当然了还有一些其他的属性，列举如下:

关于缓存建议阅读我的另一篇文章：[详解浏览器缓存](https://juejin.cn/post/6945790074374225956)

```http
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3
Accept-Encoding: gzip, deflate, br
Accept-Language: zh-CN,zh;q=0.9
Cache-Control: no-cache
Connection: keep-alive
Cookie: /* 省略cookie信息 */
Host: www.baidu.com
Pragma: no-cache
Upgrade-Insecure-Requests: 1
User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1
```

### 网络响应

HTTP 请求到达服务器，服务器进行对应的处理。最后要把数据传给浏览器，也就是返回网络响应。

跟请求部分类似，网络响应具有三个部分:**响应行**、**响应头**和**响应体**。

响应行类似下面这样:

```http
HTTP/1.1 200 OK
```

由`HTTP协议版本`、`状态码`和`状态描述`组成。

响应头包含了服务器及其返回数据的一些信息, 服务器生成数据的时间、返回的数据类型以及对即将写入的 Cookie 信息。

举例如下:

```http
Cache-Control: no-cache
Connection: keep-alive
Content-Encoding: gzip
Content-Type: text/html;charset=utf-8
Date: Wed, 04 Dec 2019 12:29:13 GMT
Server: apache
Set-Cookie: rsv_i=f9a0SIItKqzv7kqgAAgphbGyRts3RwTg%2FLyU3Y5Eh5LwyfOOrAsvdezbay0QqkDqFZ0DfQXby4wXKT8Au8O7ZT9UuMsBq2k; path=/; domain=.baidu.com
```

响应完成之后怎么办？TCP 连接就断开了吗？

不一定。这时候要判断`Connection`字段, 如果请求头或响应头中包含**Connection: Keep-Alive**，表示建立了持久连接，这样`TCP`连接会一直保持，之后请求统一站点的资源会复用这个连接。

否则断开`TCP`连接, 请求-响应流程结束。

## 断开 TCP 连接

断开 TCP 连接需要经历`四次挥手`过程：

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1615795375298.png)

第一次挥手：客户端要关闭了。客户端发送一个`FIN`报文，报文中指定一个序号`seq = p`，客户端变为`FIN-WAIT-1`状态。

第二次挥手：服务端收到`FIN`后发送`ACK`报文，确认号`ack = p+1`，服务端变为`SCLOSE-WAIT`状态。客户端接收收到服务端的确认后进入`FIN-WAIT-2`状态。

第三次挥手：服务端发送`FIN`报文和`ACK`报文，指定序列号`seq = q`和确认号`ack = p+1`，服务端进入`LAST_ACK`状态。

第四次挥手：客户端接收后，发送`ACK`报文，指定确认号`ack = q+1`给服务端，变为`TIME-WAIT`状态，然后需要等待`2MSL`,确认服务端收到`ACK`后，进入`CLOSED`状态，服务端收到`ACK`之后也变为`CLOSED`状态,至此，连接断开。

## 浏览器渲染

这部分的内容过多，建议直接查看我的另一篇文章：[浏览器页面渲染的核心流程详解](https://cansiny0320.vercel.app/browser-render-process)

## 参考文章

[(1.6w 字)浏览器灵魂之问，请问你能接得住几个？](https://juejin.cn/post/6844904021308735502)

[TLS 详解握手流程](https://juejin.cn/post/6895624327896432654)

[016 TLS 1.3 做了哪些改进？](http://47.98.159.95/my_blog/blogs/net/http/016.htm)

[https://juejin.cn/post/6844904054074654728](https://juejin.cn/post/6844904054074654728)

[(建议精读)输入 URL 到页面显示的前端体系知识](https://juejin.cn/post/6994066112203718686)
