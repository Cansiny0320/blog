---
slug: interview-experience
title: 暑期实习面经
author: Cansiny0320
author_title: 前端开发者
author_url: https://github.com/Cansiny0320
author_image_url: https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1618298366420-logo.jpg
tags: [面试]
---

<!--truncate-->

# 面试准备

## JS

### 说一下原型链和原型链的继承吧

**原型链**

当对象查找一个属性时，如果在自身没有查找到，就会查找自己的原型，如果原型也没找到，那么会继续找原型的原型，直到找到 `Object.prototype`，就是 `null`，查找才停止。这种通过原型链接的逐级向上的查找链被称为原型链

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1615529873512.png)

**原型继承**

一个对象可以使用另一个对象的属性和方法，这个就叫做继承。实现继承具体是通过将这个对象的原型设置为另一个对象，这样根据原型链的规则，如果查找一个对象属性在自身不存在的时候，就会查找它的原型对象，相当于一个对象可以使用另一个对象的属性和方法了。

```js
function Teacher(name) {
  People.call(this, name)
}
Teacher.prototype = Object.create(Person.prototype)
Teacher.prototype.constructor = Teacher // 修正 constructor 指向
```

### this

当一个函数独立调用的时候，在严格模式下 this 指向 undefined，在非严格模式下，指向 undefined 的时候，自动指向全局对象(浏览器中就是 window，nodejs 中是 global)

作为对象方法调用就指向对象

不作为对象调用则指向全局

```js
var a = 1
var obj = {
  a: 2,
  b: function () {
    return this.a
  },
}
var t = obj.b
console.log(t()) //1
```

相当于

```js
var a = 1
function fun() {
  //此函数存储在堆中
  return this.a
}
var obj = {
  a: 2,
  b: fun, //b指向fun函数
}
var t = fun //变量t指向fun函数
console.log(t()) //1
```

**new 干了什么事**

- 创建了一个临时对象
- 给临时对象绑定原型
- 这个新对象会绑定到函数调用的 this
- 如果函数没有返回其他对象，那么 new 表达式中的函数调用会自动返回这个新对象

**箭头函数的 this**

箭头函数会捕获其所在上下文的 this，作为自己的 this

### 实现一个深拷贝 基本类型和引用类型 循环引用

```js
function deepClone(target, map = new Map()) {
  if (target instanceof Object) {
    const cloneTarget = target instanceof Array ? [] : {}
    if (map.get(target)) {
      return map.get(target)
    }
    map.set(target, cloneTarget)
    for (const key in target) {
      cloneTarget[key] = deepClone(target[key], map)
    }
    return cloneTarget
  } else {
    return target
  }
}
```

用 map 解决循环引用， weakMap 性能更好，但怕面试官问 weakMap

### 说说 js 的数据类型有哪些

**基本类型**

- boolean
- number
- string
- null
- undefined
- symbol
- bigint

**引用类型**

Object Array Function

### 说说事件冒泡 事件捕获 事件委托/事件代理

**事件冒泡**

就像把一个石头扔进水里，泡泡会从水底冒出水面。

也就是说事件会从最内层的元素开始发生，一直向上传播到 document 对象。

**事件捕获**

事件捕获则和事件冒泡相反。事件是从最外层的元素开始发生，一直传播到最内层的元素。

**发生顺序**

首先发生的事件捕获，为截获事件提供机会。然后是实际的目标接受事件。最后一个阶段是时间冒泡阶段

**事件委托/事件代理**

比如给父元素绑定一个事件，利用**事件冒泡**机制，点击子元素后会冒泡到父元素，在利用 e.target 找到事件实际发生的元素。

**怎么阻止事件冒泡**

1. 给子元素加`event.stopPropagation( )` ，只阻止事件往上冒泡，不阻止事件本身
2. 在时间处理函数中返回`false` ，不仅阻止了事件往上冒泡，而且阻止了事件本身(默认事件)

**阻止默认事件**

1. event.preventDefault( )

2. return false

### 手写 Promise

```js
function Promise(fn) {
  this.cbs = []
  const resolve = value => {
    setTimeout(() => {
      this.value = value
      this.cbs.forEach(cb => cb(value))
    })
  }
  fn(resolve)
}
Promise.prototype.then = function (onResolved) {
  return new Promise(resolve => {
    this.cbs.push(() => {
      const res = onResolved(this.value)
      if (res instanceof Promise) {
        res.then(resolve)
      } else {
        resolve(res)
      }
    })
  })
}
```

### 说一下 event loop

因为 js 是单线程的，会从任务队列中不断读取事件执行，这个过程是循环不断的，称为 Event Loop。

我们可以将任务分为宏任务和微任务。

宏任务包括：`script(整体代码)`,`setTimeout`,`setInterval`,`requestAnimationFrame`,`I/O`,`setImmediate`

其中`setImmediate`只存在于 Node 中，`requestAnimationFrame`只存在于浏览器中。

微任务包括：`promise`,`Object.observe`,`MutationObserver`,`process.nextTick`

其中`process.nextTick`只存在于 Node 中，`MutationObserver`只存在于浏览器中。

浏览器中执行顺序

![](https://cansiny0320.now.sh/assets/images/6-096deace2be5fddb00490dac867da349.jpg)

分析一下下面的执行顺序

```js
async function async1() {
  console.log("async1 start")
  await async2()
  console.log("async1 end")
}
async function async2() {
  console.log("async2")
}
console.log("script start")
setTimeout(function () {
  console.log("setTimeout")
}, 0)
async1()
new Promise(function (resolve) {
  console.log("promise1")
  resolve()
}).then(function () {
  console.log("promise2")
})
console.log("script end")
//chrome v89.0.4389.90
//script start
//async1 start
//async2
//promise1
//script end
//async1 end
//promise2
//setTimeout
```

如果问 node 的 event loop 就说不太清楚 只是了解有六个阶段，每个阶段都有自己的事件队列。

### 线程和进程

进程是 cpu 资源分配的最小单位，线程是 cpu 调度的最小单位

### script 的 async 和 defer

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1616488580787.png)

在网络下载时都不会阻塞 HTML 解析，defer 按照加载顺序在 HTML 解析完成后执行脚本，而 async 在加载完成后就会执行，会阻塞 HTML 解析，同时由于脚本加载时间不确定，所以执行也是乱序的

- 如果依赖其他脚本和 DOM 结果，使用 defer
- 如果与 DOM 和其他脚本依赖不强时，使用 async

### 手写代码

```js
Array.prototype.iMap = function iMap(fn, context) {
  return this.reduce((acc, cur, index) => [...acc, fn.call(context, cur, index, this)], [])
}

Array.prototype.iReduce = function iReduce(fn, initial) {
  let result = initial || this[0]
  let start = initial ? 0 : 1
  for (let i = start; i < this.length; i++) {
    result = fn(result, this[i], i, this)
  }
  return result
}

Array.prototype.iFilter = function iFilter(fn, context) {
  return this.reduce(
    (acc, cur, index) => (fn.call(context, cur, index, this) ? [...acc, cur] : acc),
    [],
  )
}

Array.prototype.iFlat = function iFlat(depth = 1) {
  let arr = this
  while (depth && arr.some(Array.isArray)) {
    arr = [].concat(...arr)
    depth -= 1
  }
  return arr
}

Function.prototype.iCall = function iCall(context = window, ...args) {
  const tmpKey = Symbol("tmp")
  context[tmpKey] = this
  const result = context[tmpKey](...args)
  delete context[tmpKey]
  return result
}

Function.prototype.iBind = function iBind(context, ...args) {
  return (...rest) => this.apply(context, [...args, ...rest])
}

Object.iCreate = function iCreate(proto) {
  function Noop() {}
  Noop.prototype = proto
  Noop.prototype.constructor = Noop
  return new Noop()
}

function iNew(Constructor, ...args) {
  const instance = Object.create(Constructor.prototype) // 创建 + 绑定原型
  const result = Constructor.apply(instance, args)
  // 如果构造函数返回的结果是引用数据类型就返回该引用类型 不是引用类型就返回对象
  return result instanceof Object ? result : instance
}

function iInstanceof(left, right) {
  const proto = Object.getPrototypeOf(left)
  while (true) {
    if (proto === null) return false
    if (proto === right) return true
    proto = Object.getPrototypeOf(proto)
  }
}

function debounce(fn, delay) {
  let timer = null
  // 用箭头函数避免this指向问题
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(fn, delay, ...args)
  }
}

function throttle(fn, delay) {
  let canRun = true
  return (...args) => {
    if (!canRun) return
    canRun = false
    setTimeout(() => {
      fn(...args)
      canRun = true
    }, delay)
  }
}
```

### V8 垃圾回收

在 64 位系统下，V8 最多只能分配 1.4G，新生代 32MB；在 32 位系统中，最多只能分配 0.7G，新生代 16MB

基本类型用栈存储，引用类型用堆存储

- 栈中的内存：JavaScript 引擎会通过向下移动 ESP 来销毁该函数保存在栈中的执行上下文（当前执行上下文出栈时自动回收当前上下文所有基本类型的内存）

- 堆中的内存：

  1. 分为新生代和老生代，新生代是临时分配的内存，存活时间短，老生代是常驻内存，存活的时间长

  2. 新生代分为 From 和 To 两个部分，新分配的对象会被放入 From 空间中。GC 时，算法会检查 From 空间中存活的对象并复制到 To 空间中，如果有失活的对象就会销毁。当复制完成后将 From 空间和 To 空间角色对调

     > Scavenge 算法将原本 From 空间中散落的内存复制到 To 空间后会变成整齐排列的，有利于后续内存的分配（内存碎片不利于大一点的对象的内存分配），但缺点在于只能使用新生代中一般内存空间，会进行复制，所以只存放生命周期短的对象，这样的对象一般很少

  3. 新生代在 Scavenge GC 复制到 To 空间时，如果新生代中的变量在经历过一次 Scavenge 回收，或 To（闲置）空间的内存占用超过 25%，会**晋升**为老生代；或对象占用内存过大超过 From 空间时，直接晋升为老生代

  4. 老生代由于空间较大（浪费一半空间，复制消耗大）不能使用 Scavenge 算法

  5. 老生代 GC 分为标记清除 Mark-sweep 和 Mark-compact，Mark-sweep 对能访问到的内存进行标记，之后清除所有没有标记的内存，Mark-compact 用来然后整理内存碎片（把存活的对象全部往一端靠拢，由于是移动对象，它的执行速度不可能很快，事实上也是整个过程中最耗时间的部分，所以 V8 主要使用 Mark-sweep，空间不足时才使用 Mark-compact）

  6. 由于标记需要遍历一遍，当占用空间较大时就很消耗性能，耗时很大，可能阻塞，于是改进为增量标记，将标记工作分为小块，在应用逻辑执行的空隙进行（类似于 React Fiber），之后还升级[并发标记](https://v8.dev/blog/concurrent-marking)，允许 GC 标记和 JS 逻辑同时运行

     ![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1616034701833.png)

## CSS

### 知道 BFC 是什么吗？BFC 有什么用？如何触发 BFC？

> BFC 即块级格式上下文,是页面盒模型布局中的一种 CSS 渲染模式，浮动元素和绝对定位元素,非块级盒子的块级容器及 overflow 值不为"visiable"的块级盒子。

触发方式 float,position 为 absolute 或 fixed,display 不为 block

**BFC 应用**

- 给父元素设置 BFC 可以防止浮动导致父元素高度塌陷(清除浮动)
- 两个块分别设置 BFC 可以避免外边距折叠

## 浏览器和计算机网络

### 从输入 URL 到页面呈现发生了什么？

![img](https://raw.githubusercontent.com/LuckyWinty/blog/master/images/broswer/url.png?imageslim)

1. DNS 域名解析

   DNS 是域名和 ip 的对应关系，浏览器提供了 DNS 数据缓存功能，如果一个域名已经解析过，那么会把解析的结果缓存下来，下次处理直接走缓存，不需要经过`DNS解析`。

2. 建立 TCP 连接

   Chrome 在同一个域名下要求同时最多只能有 6 个 TCP 连接，超过 6 个的话剩下的请求就得等待

   **TCP 是什么**

   TCP 是一种面向连接的、可靠的、基于字节流的传输层通信协议。

   **TCP 和 UDP 有什么区别**

   `UDP`：

   - 面向无连接：`UDP`发送数据不需要和`TCP`一样需要进行三次握手建立连接，只是数据的搬运工。
   - 不可靠性： 首先不可靠体现在无连接上，通信不需要建立连接，想发就发，这样的情况肯定不可靠。再就是`UDP`没有拥塞控制，会一直以恒定的速度发送数据，这样在网络不好的情况下可能会导致丢包，但是在某些实时性要求高的场景(比如电话会议)就需要`UDP`而不是`TCP`。

   `TCP`:

   - 面向连接：通信前需要进行三次握手建立连接
   - 可靠传输：精准记录数据是否到达，保证数据按顺序全部到达，当丢包时会重发
   - 提供拥塞控制：当网络出现拥塞的时候，TCP 能够减小向网络注入数据的速率和数量，缓解拥塞

   **三次握手**

   ![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1615795250574.png)

   > ACK：此标志表示应答域有效，就是说前面所说的 TCP 应答号将会包含在 TCP 数据包中；有两个取值：0 和 1，为 1 的时候表示应答域有效，反之为 0。TCP 协议规定，只有 ACK=1 时有效，也规定连接建立后所有发送的报文的 ACK 必须为 1。
   >
   > SYN(SYNchronization)：在连接建立时用来同步序号。当 SYN=1 而 ACK=0 时，表明这是一个连接请求报文。对方若同意建立连接，则应在响应报文中使 SYN=1 和 ACK=1. 因此, SYN 置 1 就表示这是一个连接请求或连接接受报文。
   >
   > FIN(finis）即完，终结的意思， 用来释放一个连接。当 FIN = 1 时，表明此报文段的发送方的数据已经发送完毕，并要求释放连接。

   第一次握手：客户端发送一个`SYN`报文，设置 `SYN = 1`，初始序号`seq = x` , 客户端变为`SYN-SENT`状态。

   第二次握手：服务端接收到`SYN报文`，返回`SYN = 1`和`seq=y`和`ACK(seq + 1)`，自己变成了`SYN-REVD`。

   第三次握手：客户端收到`SYN`报文之后，会发送`ACK(seq+1)`报文给服务端，客户端变成了`ESTABLISHED`状态；服务端收到`ACK`之后，也变成了`ESTABLISHED`状态。

   SYN 是需要消耗一个序列号，下次发送对应的 ACK 序列号要加 1。规则:

   > 凡是需要对端确认的，一定消耗 TCP 报文的序列号。

   `SYN `需要对端的确认， 而 `ACK` 并不需要，因此 `SYN `消耗一个序列号而 `ACK `不需要。

   **理解记忆**

   第一次握手：客户端发包，服务端收到了。

   这样服务端可以知道客户端的发送能力是正常的

   第二次握手：服务端发包，客户端收到了。

   这样客户端可以知道服务端的发送能力和接收能力是正常的。

   第三次握手：客户端发包，服务端收到了。

   这样服务端就可以知道客户端的接收能力是正常的。

   这样通过三次握手，确认了双方的发送与接收能力是否正常。

   3 次，是完成双方考察`发送`和`接收`能力的最少次数

   **为什么两次握手不行**

   无法确认客户端的接收能力

   因为第二次握手，服务端还不能确认客户端是否接收到了请求，此时如果客户端忽略服务端发来的确认，也不发送数据，则服务端一直等待客户端发送数据，浪费资源。

   **三次握手能携带数据吗**

   可以，但是只有第三次可以。之前两次容易受到攻击。

3. 发送 HTTP 请求，服务器处理请求，返回响应结果

   ![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1616838448580.png)

   TCP 连接建立后，浏览器就可以利用 HTTP／HTTPS 协议向服务器发送请求了。服务器接受到请求，就解析请求头，如果头部有缓存相关信息如 if-none-match 与 if-modified-since，则验证缓存是否有效，若有效则返回状态码为 304，若无效则重新返回资源，状态码为 200

   **响应完成之后怎么办？TCP 连接就断开了吗？**

   不一定。这时候要判断`Connection`字段, 如果请求头或响应头中包含**Connection: Keep-Alive**，表示建立了持久连接，这样`TCP`连接会一直保持，之后请求统一站点的资源会复用这个连接。

   否则断开`TCP`连接, 请求-响应流程结束。

4. 渲染页面

   1. 解析 HTML，生成 DOM 树，解析 CSS，生成 CSSOM 树
   2. 将 DOM 树和 CSSOM 树结合，生成渲染树(Render Tree)
   3. Layout(回流):根据生成的渲染树，进行回流(Layout)，得到节点的几何信息（位置，大小）
   4. Painting(重绘):根据渲染树以及回流得到的几何信息，得到节点的绝对像素
   5. Display:将像素发送给 GPU，展示在页面上。

   ![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1616509755394.png)

5. 关闭 TCP 连接

   ![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1615795375298.png)

   第一次挥手：客户端要关闭了。客户端发送一个`FIN`报文，客户端变为`FIN-WAIT-1`状态。(TCP 处于半关闭状态)

   第二次挥手：服务端收到`FIN`后发送`ACK`，变为`SCLOSE-WAIT`状态。客户端接收收到服务端的确认后进入`FIN-WAIT-2`状态。

   第三次挥手：服务端发送`FIN`，进入`LAST_ACK`状态、

   第四次挥手：客户端接收后，变为`TIME-WAIT`状态，发送`ACK`给服务端，然后需要等待`2MSL`,确认服务端收到`ACK`后，关闭连接，挥手结束

   **理解记忆**

   第一次挥手：客户端向服务端发起关闭请求

   第二次挥手：服务端收到关闭请求，向客户端确认收到

   第三次挥手：服务端也发送关闭请求

   第四次挥手：客户端收到关闭请求，向服务端确认收到

   **等待 2MSL(报文最大生存时间)的意义**

   - 保证客户端发送的最后一个 ACK 报文段能够到达服务端

   - 防止已失效的连接请求报文段出现在本连接中。

   如果不等待，客户端直接跑路，当服务端还有很多数据包要给客户端发，且还在路上的时候，若客户端的端口此时刚好被新的应用占用，那么就接收到了无用数据包，造成数据包混乱。所以，最保险的做法是等服务器发来的数据包都死翘翘再启动新的应用。

   - 1 个 MSL 确保四次挥手中主动关闭方最后的 ACK 报文最终能达到对端
   - 1 个 MSL 确保对端没有收到 ACK 重传的 FIN 报文可以到达

   **为什么要四次挥手**

   因为服务端在接收到`FIN`, 往往不会立即返回`FIN`, 必须等到服务端所有的报文都发送完毕了，才能发`FIN`。因此先发一个`ACK`表示已经收到客户端的`FIN`，延迟一段时间才发`FIN`。这就造成了四次挥手。

   如果只有三次，等于说服务端将`ACK`和`FIN`的发送合并为一次挥手（第二次和第三次），这个时候长时间的延迟可能会导致客户端误以为`FIN`没有到达客户端，从而让客户端不断的重发`FIN`。

### 谈谈 HTTPS

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1616052653052.png)

[一次安全可靠的通信——HTTPS 原理](https://developers.weixin.qq.com/community/develop/article/doc/000046a5fdc7802a15f7508b556413)

HTTPS 即 HTTP+SSL/TLS，HTTP 和 TCP 之间的一个安全层

**HTTPS 原理**

1. 加密

   1. 对称加密 ：加密解密用相同的密钥（缺点：可能被中间人拦截）

   2. 非对称加密：发送方用公钥加密，接收方拿私钥解密（性能差，中间人可以篡改公钥）

      **所以我们可以使用对称加密+非对称加密的方式，使用 RSA 算法将对称加密的密钥发过去，之后使用对称加密**

   3. 认证 ：CA 制作证书（发送方的公钥+CA 数字签名（CA 的私钥加密发送方的信息）），接收方用 CA 的公钥解密，可以验证是否有中间人欺骗，但是中间人还是可以胡乱篡改内容。

   4. 完整性：使用单向 Hash 算法得到 hash 并发送，另一方验证得到内容的 hash 跟收到的 hash 是否一致 验证完整性

   https：三次握手 => TLS 握手 => 加密通信并用 hash 验证完整性

   SSL/TLS 握手（传统 RSA）：

   1. 客户端发送请求到服务器，包括支持的协议版本、加密算法列表、压缩方法和随机数 random1
   2. 服务器确认加密通信协议版本是否一致，是则回应证书（非对称加密的公钥和 CA 数字签名）、随机数 random2 和选择的加密算法，否则关闭加密通信
   3. 浏览器通过已有的 CA 公钥解密 CA 数字签名验证证书是否失效，若失效则给提示决定是否继续连接，若没问题就产生一个随机数 pre-master 并用非对称加密的公钥加密，然后发送给服务器，同时 random1 + random2 + pre-master 生成 master-secret 对称加密的密钥用于后续数据传输
   4. 服务端通过非对称加密的私钥解密得到 pre-master，用 random1 + random2 + pre-master 生成 master-secret 得到对称加密的密钥，并响应握手

   **TLS / SSL 是在哪一层**

   TLS（Transport Layer Security）为安全传输层协议，在应用层和传输层之间，OSI 模型的会话层

### HTTP/2

- 头部压缩
- 多路复用
- 服务器推送

**头部压缩**

对请求头进行压缩，使用 HPACK 算法

在服务器和客户端之间建立哈希表，将用到的字段存放在这张表中，那么在传输的时候对于之前出现过的值，只需要把**索引**(比如 0，1，2，...)传给对方即可，对方拿到索引查表就行了。这种**传索引**的方式，可以说让请求头字段得到极大程度的精简和复用。

> **小贴士**
>
> HTTP/2 当中废除了起始行的概念，将起始行中的请求方法、URI、状态码转换成了头字段，不过这些字段都有一个":"前缀，用来和其它请求头区分开。

其次是对于整数和字符串进行**哈夫曼编码**，哈夫曼编码的原理就是先将所有出现的字符建立一张索引表，然后让出现次数多的字符对应的索引尽可能短，传输的时候也是传输这样的**索引序列**，可以达到非常高的压缩率。

**多路复用**

主要是解决 http1.1 中的性能问题，http1.0 中一个请求建立一个 TCP 连接，每次都要进行三次握手四次挥手，如果一个 TCP 连接对应多个 http 请求就需要开启 Connection: Keep-Alive，到了 http1.1 时默认开启 Keep-Alive，解决了多次连接的问题，但是依然有队头阻塞的问题，由于 http1.1 中需要数据有序，所以请求是串行的，必须等下上一个请求接受才能发起下一个请求

而 http2 中的数据会拆分成二进制数据帧，每个二进制帧的头部会标示自己属于哪个流，通过多个流传输到服务端，然后服务端将流中的帧重新组合成完整的数据，所以这些帧是可以交错传输，就可以同时传输多个数据流，**多路复用指的就是一个 TCP 连接有多条流**，这样就解决了队头阻塞的问题。

> 所谓的乱序，指的是不同 ID 的 Stream 是乱序的，但同一个 Stream ID 的帧一定是按顺序传输的。二进制帧到达后对方会将 Stream ID 相同的二进制帧组装成完整的**请求报文**和**响应报文**。

**服务器推送**

在 HTTP/2 当中，服务器已经不再是完全被动地接收请求，响应请求，它也能新建 stream 来给客户端发送消息，当 TCP 连接建立之后，比如浏览器请求一个 HTML 文件，服务器就可以在返回 HTML 的基础上，将 HTML 中引用到的其他资源文件一起返回给客户端，减少客户端的等待。

### OSI 七层模型和 TCP/IP 四层模型

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1615884034560.png)

- 第 7 层：应用层为操作系统或网络应用程序提供访问网络服务的接口。应用层协议的代表包括： HTTP，HTTPS，FTP，TELNET，SSH，SMTP，POP3 等。
- 第 6 层：表示层把数据转换为接受者能够兼容并且适合传输的内容，比如数据加密，压缩，格式转换等。
- 第 5 层：会话层负责数据传输中设置和维持网络设备之间的通信连接。管理主机之间的会话进程，还可以利用在数据中插入校验点来实现数据的同步。
- 第 4 层：传输层把传输表头加至数据形成数据包，完成端到端的数据传输。传输表头包含了协议等信息，比如: TCP，UDP 等。
- 第 3 层：网络层负责对子网间的数据包进行寻址和路由选择，还可以实现拥塞控制，网际互联等功能。网络层的协议包括：IP，IPX 等。
- 第 2 层：数据链路层在不可靠的物理介质上提供可靠的传输，主要为：物理地址寻址、数据封装成帧、流量控制、数据校验、重发等。
- 第 1 层：物理层在局域网上传送数据帧，负责电脑通信设备与网络媒体之间的互通，包括针脚，电压，线缆规范，集线器，网卡，主机适配等。

4 层：

- 链接层：负责在以太网、WiFi 这样的底层网络上发送原始数据包，使用 MAC 地址来标记网络上的设备
- 网络层：IP 协议就处在这一层，用 IP 地址取代 MAC 地址
- 传输层：这个层次协议的职责是保证数据在 IP 地址标记的两点之间“可靠”地传输 TCP、UDP
- 应用层：Telnet、SSH、FTP、SMTP、HTTP

### 跨域

1. 绕过浏览器的同源策略

   - 使用 Nginx 反向代理
   - Node 中间件代理

2. 告诉浏览器这个跨域允许

   - CORS

3. 使用没有跨域限制的方式

   - JSONP

   - postMessage

   - WebSocket

**CORS 具体流程**

> 简单请求：
>
> 1. 请求方法是以下三种方法之一：
>
> - HEAD
> - GET
> - POST
>
> 2. HTTP 的头信息不超出以下几种字段：
>
> - Accept
> - Accept-Language
> - Content-Language
> - Content-Type：只限于三个值 application/x-www-form-urlencoded、multipart/form-data、text/plain
>
> 其他都为非简单请求

**简单请求**

对于简单请求，浏览器会在请求头添加一个`Origin`字段，用来说明请求来自哪个`源`。在回应时对应地添加`Access-Control-Allow-Origin`字段，如果`Origin`不在这个字段的范围中，那么浏览器就会将响应拦截。

因此，`Access-Control-Allow-Origin`字段是服务器用来决定浏览器是否拦截这个响应，这是必需的字段。与此同时，其它一些可选的功能性的字段，用来描述如果不会拦截，这些字段将会发挥各自的作用。

**Access-Control-Allow-Credentials**。这个字段是一个布尔值，表示是否允许发送 Cookie，对于跨域请求，浏览器对这个字段默认值设为 false，而如果需要拿到浏览器的 Cookie，需要添加这个响应头并设为`true`, 并且在前端也需要设置`withCredentials`属性:

```js
let xhr = new XMLHttpRequest()
xhr.withCredentials = true
```

**Access-Control-Expose-Headers**。这个字段是给 XMLHttpRequest 对象赋能，让它不仅可以拿到基本的 6 个响应头字段（包括`Cache-Control`、`Content-Language`、`Content-Type`、`Expires`、`Last-Modified`和`Pragma`）, 还能拿到这个字段声明的**响应头字段**。比如这样设置:

```text
Access-Control-Expose-Headers: aaa
```

那么在前端可以通过 `XMLHttpRequest.getResponseHeader('aaa')` 拿到 `aaa` 这个字段的值。

**非简单请求**

- **预检请求**

  对于非简单请求会发一个 `OPTIONS` 预检请求，同时会加上`Origin`源地址和`Host`目标地址,同时也会加上两个关键的字段: Access-Control-Request-Method、Access-Control-Request-Headers

  - Access-Control-Request-Method, 列出 CORS 请求用到哪个 HTTP 方法
  - Access-Control-Request-Headers，指定 CORS 请求将要加上什么请求头

- **响应字段**

  预检请求的响应

  - Access-Control-Allow-Origin: 表示可以允许请求的源，可以填具体的源名，也可以填`*`表示允许任意源请求。
  - Access-Control-Allow-Methods: 表示允许的请求方法列表。
  - Access-Control-Allow-Credentials: 简单请求中已经介绍。
  - Access-Control-Allow-Headers: 表示允许发送的请求头字段
  - Access-Control-Max-Age: 预检请求的有效期，在此期间，不用发出另外一条预检请求。

在预检请求的响应返回后，如果请求不满足响应头的条件，则触发`XMLHttpRequest`的`onerror`方法，当然后面真正的**CORS 请求**也不会发出去了。

**CORS 请求的响应**。绕了这么一大转，到了真正的 CORS 请求就容易多了，现在它和**简单请求**的情况是一样的。浏览器自动加上`Origin`字段，服务端响应头返回**Access-Control-Allow-Origin**。可以参考以上简单请求部分的内容。

**JSONP**

`script`标签的`src`属性中的链接可以访问跨域的`js`脚本，利用这个特性，服务端不再返回`JSON`格式的数据，而是返回一段调用某个函数的`js`代码，在`src`中进行了调用，这样实现了跨域。

### 首屏和白屏

白屏时间：浏览器从响应用户输入网址地址，到浏览器开始显示内容的时间 = 地址栏输入网址后回车 - 浏览器出现第一个元素

首屏时间：浏览器从响应用户输入网络地址，到首屏内容渲染完成的时间 = 地址栏输入网址后回车 - 浏览器第一屏渲染完成

影响白屏时间的因素：网络，服务端性能，前端页面结构设计

影响首屏时间的因素：白屏时间，资源下载执行时间

可以使用 Performance API 获取性能信息，DevTools 中 Performance 面板也可以查看

### 谈谈重绘和回流

渲染流水线：

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1616469424345.png)

`回流`

**触发条件**

简单来说，就是当我们对 DOM 结构的修改引发 DOM 几何尺寸变化的时候，会发生`回流`的过程。

具体一点，有以下的操作会触发回流:

      1. 一个 DOM 元素的几何属性变化，常见的几何属性有`width`、`height`、`padding`、`margin`、`left`、`top`、`border` 等等, 这个很好理解。
      2. 使 DOM 节点发生`增减`或者`移动`。
      3. 读写 `offset`族、`scroll`族和`client`族属性的时候，浏览器为了获取这些值，需要进行回流操作。
      4. 调用 `window.getComputedStyle` 方法。

**回流过程**

依照上面的渲染流水线，触发回流的时候，如果 DOM 结构发生改变，则重新渲染 DOM 树，然后将后面的流程(包括主线程之外的任务)全部走一遍。

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1616469572200.png)

`重绘`

**触发条件**

​ 当 DOM 的修改导致了样式的变化，并且没有影响几何属性的时候，会导致`重绘`(`repaint`)。

**重绘过程**

跳过了`生成布局树`和`建图层树`的阶段，直接生成绘制列表，然后继续进行分块、生成位图等后面一系列操作。

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1616469581156.png)

可以看到，**重绘不一定导致回流，但回流一定发生了重绘**。

`合成`

还有一种情况，是直接合成。比如利用 CSS3 的`transform`、`opacity`、`filter`这些属性就可以实现合成的效果，也就是大家常说的**GPU 加速**。

**GPU 加速的原因**

在合成的情况下，会直接跳过布局和绘制流程，直接进入`非主线程`处理的部分，即直接交给`合成线程`处理。交给它处理有两大好处:

1. 能够充分发挥`GPU`的优势。合成线程生成位图的过程中会调用线程池，并在其中使用`GPU`进行加速生成，而 GPU 是擅长处理位图数据的。
2. 没有占用主线程的资源，即使主线程卡住了，效果依然能够流畅地展示。

**实践意义**

1. 避免频繁使用 style，而是采用修改`class`的方式

2. 使用`createDocumentFragment`进行批量的 DOM 操作

3. 对于 resize、scroll 等进行防抖/节流处理

4. 添加 will-change: tranform ，让渲染引擎为其单独实现一个图层，当这些变换发生时，仅仅只是利用合成线程去处理这些变换，而不牵扯到主线程，大大提高渲染效率。当然这个变化不限于`tranform`, 任何可以实现合成效果的 CSS 属性都能用`will-change`来声明。这里有一个实际的例子，一行`will-change: tranform`拯救一个项目，[点击直达](https://juejin.im/post/5da52531518825094e373372)

   ### 常见的 HTTP 状态码以及作用

- **1xx**: 表示目前是协议处理的中间状态，还需要后续操作
- **2xx**: 表示成功状态
- **3xx**: 重定向状态，资源位置发生变动，需要重新请求
- **4xx**: 请求报文有误
- **5xx**: 服务器端发生错误

**101 Switching Protocols**。在`HTTP`升级为`WebSocket`的时候，如果服务器同意变更，就会发送状态码 101

**200 OK**是见得最多的成功状态码。通常在响应体中放有数据

**304 Not Modified**: 当协商缓存命中时会返回这个状态码

**404 Not Found**: 资源未找到，表示没在服务器上找到相应的资源

**500 Internal Server Error**: 仅仅告诉你服务器出错了，出了啥错咱也不知道

## 浏览器缓存

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1615703736574.png)

**缓存位置**

按优先级排序

1. Service Worker：运行在浏览器背后的独立线程，是对请求的一种拦截，也因此必须是 HTTPS，首先需要注册 SW，install 事件后可以对资源进行缓存，之后 fetch 事件可以判断是否命中缓存，没有命中就可以调用 fetch 获取，可编程的控制缓存哪些文件、如何匹配缓存、如何读取缓存
2. Memory Cache：内存中的缓存，容量小访问快时效短
3. Disk Cache：磁盘中的缓存，强缓存和协商缓存就放到 Disk Cache 和 Memory Cache
4. Push Cache：HTTP/2 的，只在会话中存在,一旦会话结束就被释放。[HTTP/2 push is tougher than I thought](https://jakearchibald.com/2017/h2-push-tougher-than-i-thought/)

**强缓存**

强缓存可以通过设置两种 HTTP header 实现：`Expires` 和 `Cache-Control`。

1. Expires(HTTP/1.0)

   缓存过期时间，用来指定资源到期的时间，是服务器端的具体时间点。服务器返回响应时，在 Response Headers 中将过期时间（时间戳）写入 expires 字段。但依赖本地时间，修改了本地时间后，可能会造成缓存失效。

2. Cache-Control(HTTP/1.1)

   Cache-Control 可以在请求头或者响应头中设置，并且可以组合使用多种指令：

   - public：客户端和代理服务器都可缓存
   - private：只有客户端可以缓存
   - no-store：不进行任何形式的缓存
   - no-cache：跳过当前的强缓存，发送 HTTP 请求，即直接进入`协商缓存阶段`
   - must-revalidate：如果缓存不过期就可以继续使用，但过期了就必须去服务器验证（no-store > no-cache > must-revalidate）
   - max-age：max-age=xxx，xxx 秒后失效
   - s-maxage：max-age 用于普通缓存，而 s-maxage 用于代理缓存。s-maxage 的优先级高于 max-age
   - max-stale
   - min-fresh

   **协商缓存**

   协商缓存可以通过设置两种 HTTP Header 实现：`Last-Modified` 和 `ETag`

   1. Last-Modified 和 If-Modified-Since：浏览器第一次访问资源时，response header 携带 Last-Modified（资源在服务器上的最后修改时间，最小单位 s），浏览器接收后缓存，下一次请求这个资源时 request header 携带 If-Modified-Since，如果修改时间没有变化，就使用缓存，返回 304，否则返回新资源和 200

      **Last-Modified 存在一些弊端**

      - 如果本地打开缓存文件，即使没有对文件进行修改，但还是会造成 Last-Modified 被修改，服务端不能命中缓存导致发送相同的资源
      - 因为 Last-Modified 只能以秒计时，如果在不可感知的时间内修改完成文件，那么服务端会认为资源还是命中了，不会返回正确的资源

   2. ETag 和 If-None-Match：response header 中携带 Etag（根据文件内容生成的唯一标识），下一次请求时会在 request header 中的 If-None-Match 携带，服务器根据比较 Etag 判断是否修改（是 200 否 304）

   缓存优先级：**cache-control > expires > etag > last-modified**

### 说一说缓存的机制

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1616838707843.png)

1. 首先通过 `Cache-Control` 或者`Expires`验证强缓存是否可用

   - 如果强缓存可用，返回 200，直接使用强缓存，并且不会发送请求到服务器
   - 否则进入协商缓存阶段

2. 进入协商缓存，即发送 HTTP 请求，服务器通过请求头中的`If-Modified-Since`或者`If-None-Match`这些条件请求字段检查资源是否更新

- 若资源更新，返回资源和 200 状态码
- 否则，返回 304，告诉浏览器直接从缓存获取资源

### 说说强缓存的 from disk 和 from memory 的区别

memory cache 也就是内存中的缓存，特点 **读取速度快**、**时效性**

disk cache 也就是存储在硬盘中的缓存，**读取速度较慢**，但容量大，**存储时效性长**。

### 如果什么缓存策略都没设置，那么浏览器会怎么处理？

对于这种情况，浏览器会采用一个启发式的算法，通常会取响应头中的 Date 减去 Last-Modified 值的 10% 作为缓存时间。

## web 安全

### XSS 攻击

恶意代码未经过滤，与网站正常的代码混在一起；浏览器无法分辨哪些脚本是可信的，导致恶意脚本被执行。

- 反射型：构造出特殊的 URL（比如 `?type=<script>alert('bad')</script>`），访问后服务端返回 type 的内容到页面上执行
- DOM 型：前端 `JavaScript` 代码不够严谨，把不可信的内容插入到了页面。在使用 `.innerHTML`、`.outerHTML`、`.appendChild`、`document.write()`等 API 时要特别小心，不要把不可信的数据作为 HTML 插到页面上，尽量使用 `.innerText`、`.textContent`、`.setAttribute()` 等。
- 存储型：恶意脚本永久存储在目标服务器上。

防范：encodeURIComponent 转义 URL 链接、非 URL 将 `"`、 `'`、 `< `、`> `进行转义成 html 字符、添加 CSP meta 标签或 Response header 控制页面能加载哪些资源、限制内容长度、Cookie 加 HttpOnly

> ```http
> Content-Security-Policy: default-src 'self'
> ```
>
> ```html
> <meta http-equiv="Content-Security-Policy" content="form-action 'self';" />
> ```

### CSRF

在用户登录 A 网站后诱导其进入 B 网站，B 网站发送 A 网站的请求，会带上 Cookie，B 网站冒充用户完成了攻击

防范：验证 Referer，但 Referer 是浏览器提供，可能被修改、验证 Origin、token、SameSite Cookie

## 性能优化

[React 16 加载性能优化指南](https://mp.weixin.qq.com/s/XSvhOF_N0VbuOKStwi0IYw)

## vue

## 其他

### CDN

尽可能的在各个地方分布机房缓存数据

可以将静态资源尽量使用 CDN 加载，CDN 域名要与主站不同，否则每次请求都会带上主站的 Cookie，平白消耗流量

### MVC、MVP、MVVM 模式

[MVC、MVP、MVVM 模式的概念与区别](https://www.jianshu.com/p/ff6de219f988)

## 自我介绍

我叫 XXX， XX 人，现在在 xx 大学读大二，专业是计算机科学与技术，成绩在年级前 20%。在大一接触到前端，加入一个叫红岩网校的学校组织进行学习，然后大二跟着做了几个小项目。比较擅长 JS 基础，了解浏览器和 HTTP 协议。这次面试不管能不能通过都希望有所收获，谢谢。
