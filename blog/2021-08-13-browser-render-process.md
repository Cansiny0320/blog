---
slug: browser-render-process
title: 浏览器页面渲染的核心流程详解
author: Cansiny0320
author_title: 前端开发者
author_url: https://github.com/Cansiny0320
author_image_url: https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1618298366420-logo.jpg
tags: [浏览器]
---

## 前言

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1628844171354.png)

先上一张 chrome 浏览器渲染流程图，可以在 performance 面板查看

分为以下几个步骤：

1. parse HTML：解析 HTML 文本构建 DOM Tree
2. Recalc Styles：样式计算，生成 CSSOM Tree

3. Layout：计算可见元素几何信息(位置、尺寸)生成 Layout Tree，也就是我们常说的重排 reflow
4. update layer tree：创建层叠上下文和元素层级顺序，即建立 Layer Tree
5. paint：这一步记录需要调用绘制的方法 `draw calls`，在光栅化 `Rasterization` 时，`draw calls` 会被执行。
6. Composite Layers：某些特殊的渲染层会被认为是合成层（Compositing Layers），Composite 负责处理它们
7. 然后将这些信息交给`compositor thread` 处理，然后给 GPU 打印到屏幕

<!--truncate-->

## 构建 DOM 树

这部分取自三元大佬的文章[第 4 篇: 说一说从输入 URL 到页面呈现发生了什么？——解析算法篇](https://juejin.cn/post/6844904021308735502#heading-34)

由于浏览器无法直接理解 `HTML 字符串`，因此需要将这一系列的字节流转换为一种有意义并且方便操作的数据结构，这种数据结构就是`DOM Tree`。`DOM Tree`本质上是一个以`document`为根节点的多叉树。

`HTML 解析算法`分为两个阶段：

1. 标记化
2. 建树

对应的两个过程就是**词法分析**和**语法分析**

### 标记化算法

这个算法输入为`HTML文本`，输出为`HTML标记`，也称为**标记生成器**。其中运用**有限自动状态机**来完成。即在当当前状态下，接收一个或多个字符，就会更新到下一个状态。

```html
<html>
  <body>
    Hello world
  </body>
</html>
```

通过一个简单的例子来演示一下`标记化`的过程。

遇到`<`, 状态为**标记打开**

接收`[a-z]`的字符，会进入**标记名称状态**。

这个状态一直保持，直到遇到`>`，表示标记名称记录完成，这时候变为**数据状态**。

接下来遇到`body`标签做同样的处理。

这个时候`html`和`body`的标记都记录好了。

来到`<body>`中的`>`，进入**数据状态**后，接收后面的字符`hello world`

接着接收`</body>`中的`<`，回到**标记打开**状态，接收下一个`/`后，会创建一个`end tag`的 token

随后进入**标记名称状态**, 遇到`>`回到**数据状态**。

接着以同样的样式处理 `</body>`

### 建树算法

之前提到过，DOM 树是一个以`document`为根节点的多叉树。因此解析器首先会创建一个`document`对象。标记生成器会把每个标记的信息发送给**建树器**。**建树器**接收到相应的标记时，会**创建对应的 DOM 对象**。创建这个`DOM对象`后会做两件事情:

1. 将`DOM对象`加入 DOM 树中。
2. 将对应标记压入存放开放(与`闭合标签`意思对应)元素的栈中。

还是拿下面这个例子说:

```html
<html>
  <body>
    Hello world
  </body>
</html>
```

首先，状态为**初始化状态**。

接收到标记生成器传来的`html`标签，这时候状态变为**`before html`状态**。同时创建一个`HTMLHtmlElement`的 DOM 元素, 将其加到`document`根对象上，并进行压栈操作。

接着状态自动变为**`before head`**, 此时从标记生成器那边传来`body`，表示并没有`head`, 这时候**建树器**会自动创建一个`HTMLHeadElement`并将其加入到`DOM树`中。

现在进入到**`in head`**状态, 然后直接跳到**`after head`**。

现在**标记生成器**传来了`body`标记，创建 **`HTMLBodyElement`**, 插入到`DOM`树中，同时压入开放标记栈。

接着状态变为**`in body`**，然后来接收后面一系列的字符: **Hello world**。接收到第一个字符的时候，会创建一个 **`Text`** 节点并把字符插入其中，然后把**`Text`**节点插入到 DOM 树中`body`的下面。随着不断接收后面的字符，这些字符会附在**`Text`**节点上。

### 容错机制

讲到`HTML5`规范，就不得不说它强大的**宽容策略**, 容错能力非常强，虽然大家褒贬不一，不过我想作为一名资深的前端工程师，有必要知道`HTML Parser`在容错方面做了哪些事情。

接下来是 `WebKit` 中一些经典的容错示例，发现有其他的也欢迎来补充。

1. 使用`</br>`而不是`<br>`

```js
if (t->isCloseTag(brTag) && m_document->inCompatMode()) {
  reportError(MalformedBRError);
  t->beginTag = true;
}
```

全部换为`<br>`的形式。

2. 表格离散

```html
<table>
  <table>
    <tr><td>inner table</td></tr>
  </table>
  <tr><td>outer table</td></tr>
</table>
```

`WebKit`会自动转换为:

```html
<table>
  <tr><td>outer table</td></tr>
</table>
<table>
  <tr><td>inner table</td></tr>
</table>
```

3. 表单元素嵌套

这时候直接忽略里面的`form`。

## 构建 CSSOM 树

构建 CSSOM 树和构建 DOM 树的过程非常相似，当浏览器接收到一段 CSS，浏览器首先要做的是识别出 Token，然后构建节点并生成 CSSOM Tree

直接上一个例子

```css
body {
  font-size: 16px;
}
p {
  font-weight: bold;
}
span {
  color: red;
}
p span {
  display: none;
}
img {
  float: right;
}
```

最终会生成下面这样的树结构

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1628841046427.png)

## 布局树构建、布局及绘制

现在，我们已经拥有了完整的 DOM 树和 CSSOM 树。接下来要做的就是通过浏览器的布局系统`确定元素的位置`，也就是要生成一棵`布局树`(Layout Tree)。

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1628841130951.png)

1. 布局树生成的大致工作如下:
   1. 遍历生成的 DOM 树节点，并把他们添加到`布局树中`。
   2. 计算布局树节点的坐标位置。

> 简单提一句，请注意 `visibility: hidden` 与 `display: none` 是不一样的。前者隐藏元素，但元素仍占据着布局空间（即将其渲染成一个空框），而后者 (`display: none`) 将元素从渲染树中完全移除，元素既不可见，也不是布局的组成部分。

有了`Layout Tree`之后我们是不是就可以遍历渲染树将每个`LayoutObject`的内容绘制到页面上了呢？

不，浏览器还有一个[层叠上下文](https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_Positioning/Understanding_z_index/The_stacking_context),就是决定元素间相互覆盖关系(比如 z-index)的东西。这使得文档流中位置靠前位置的元素有可能覆盖靠后的元素。上述 DFS 过程只能无脑让文档流靠后的元素覆盖前面元素。

因此，有了`PaintLayer`。

### 从 LayoutObjects 到 PaintLayers

一般来说，拥有相同的坐标空间的 `LayoutObjects`，属于同一个`PaintLayer`。`PaintLayer` 最初是用来实现`层叠上下文`，以此来保证页面元素以正确的顺序合成（`composite`），这样才能正确的展示元素的重叠以及半透明元素等等。因此满足形成层叠上下文条件的 `LayoutObject` 一定会为其创建新的渲染层，当然还有其他的一些特殊情况，为一些特殊的 `LayoutObjects` 创建一个新的渲染层，比如 `overflow != visible` 的元素。根据创建 `PaintLayer` 的原因不同，可以将其分为常见的 3 类：

- `NormalPaintLayer`
  - 根元素（HTML）
  - 有明确的定位属性（relative、fixed、sticky、absolute）
  - 透明的（opacity 小于 1）
  - 有 CSS 滤镜（fliter）
  - 有 CSS mask 属性
  - 有 CSS mix-blend-mode 属性（不为 normal）
  - 有 CSS transform 属性（不为 none）
  - backface-visibility 属性为 hidden
  - 有 CSS reflection 属性
  - 有 CSS column-count 属性（不为 auto）或者 有 CSS column-width 属性（不为 auto）
  - 当前有对于 opacity、transform、fliter、backdrop-filter 应用动画
- `OverflowClipPaintLayer`

  - overflow 不为 visible

- `NoPaintLayer`
  - 不需要 paint 的 PaintLayer，比如一个没有视觉属性（背景、颜色、阴影等）的空 div。

满足以上条件的 `LayoutObject `会拥有独立的渲染层，而其他的 `LayoutObject` 则和其第一个拥有渲染层的父元素共用一个。

### 从 PaintLayers 到 GraphicsLayers

某些特殊的渲染层会被认为是合成层（Compositing Layers），合成层拥有单独的 GraphicsLayer，而其他不是合成层的渲染层，则和其第一个拥有 GraphicsLayer 父层公用一个。

每个 GraphicsLayer 都有一个 GraphicsContext，GraphicsContext 会负责输出该层的位图，位图是存储在共享内存中，作为纹理上传到 GPU 中，最后由 GPU 将多个位图进行合成，然后 draw 到屏幕上，此时，我们的页面也就展现到了屏幕上。

渲染层提升为合成层的原因有一下几种：

注：渲染层提升为合成层有一个先决条件，该渲染层必须是 SelfPaintingLayer（基本可认为是上文介绍的 NormalPaintLayer）。以下所讨论的渲染层提升为合成层的情况都是在该渲染层为 SelfPaintingLayer 前提下的。

> - **3D 或透视变换**(perspective、transform) CSS 属性
> - 使用加速视频解码的 元素
> - 拥有 3D (WebGL) 上下文或加速的 2D 上下文的 元素
> - 混合插件(如 Flash)
> - **对 opacity、transform、fliter、backdropfilter 应用了 animation 或者 transition（需要是 active 的 animation 或者 transition，当 animation 或者 transition 效果未开始或结束后，提升合成层也会失效）**
> - **will-change 设置为 opacity、transform、top、left、bottom、right（其中 top、left 等需要设置明确的定位属性，如 relative 等）**
> - 拥有加速 CSS 过滤器的元素
> - 元素有一个 z-index 较低且包含一个复合层的兄弟元素(换句话说就是该元素在复合层上面渲染)
> - ….. 所有情况的详细列表参见淘宝 fed 文章:[无线性能优化：Composite](https://fed.taobao.org/blog/2016/04/26/performance-composite/)

**3D transform、will-change 设置为 opacity、transform 等 以及 包含 opacity、transform 的 CSS 过渡和动画 这 3 个经常遇到的提升合成层的情况请重点记住。**

另外除了上述直接导致 PaintLayers 提升为 GraphicsLayer，还有下面这种因为 B 被提升，导致 A 也被**隐式提升**的情况，详见此文: [GPU Animation: Doing It Right](https%3A%2F%2Fwww.smashingmagazine.com%2F2016%2F12%2Fgpu-animation-doing-it-right%2F)

每个合成层 GraphicsLayer 都拥有一个 GraphicsContext，GraphicsContext 会为该 Layer 开辟一段位图，也就意味着每个 GraphicsLayer 都拥有一个位图。GraphicsLayer 负责将自己的 PaintLayer 及其子代所包含的 LayoutObject 绘制到位图里。然后将位图作为纹理交给 GPU。所以现在 GPU 收到了 HTML 元素的 GraphicsLayer 的纹理，也可能还收到某些因为有 3d transform 之类属性而提升为 GraphicsLayer 的元素的纹理。

现在 GPU 需要对多层纹理进行合成(composite)，同时 GPU 在纹理合成时对于每一层纹理都可以指定不同的合成参数，从而实现对纹理进行 transform、mask、opacity 等等操作之后再合成，而且 GPU 对于这个过程是底层硬件加速的，性能很好。最终，纹理合成为一幅内容最终 draw 到屏幕上。

所以在元素存在 transform、opacity 等属性的 css animation 或者 css transition 时，动画处理会很高效，这些属性在动画中不需要重绘，只需要重新合成即可。

随便说一下：如何查看页面中的合成层？

我们可以使用 Chrome DevTools 工具来查看页面中合成层的情况

一种方式是在 `Rendering` 面板中勾选 `Layer borders` 选项，页面中的合成层就会被加上黄色边框

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1628854865914.png)

第二种是直接打开 `Layers` 面板查看，还会显示合成原因

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1628854984997.png)

### 绘制

接下来渲染引擎会将图层的绘制拆分成一个个绘制指令，比如先画背景、再描绘边框......然后将这些指令按顺序组合成一个待绘制列表，相当于给后面的绘制操作做了一波计划。

还是在 `Layers` 面板，我们能看到详细的绘制列表

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1628855664192.png)

### 生成图块和生成位图

现在开始绘制操作，实际上在渲染进程中绘制操作是由专门的线程来完成的，这个线程叫**合成线程**。

绘制列表准备好了之后，渲染进程的主线程会给`合成线程`发送`commit`消息，把绘制列表提交给合成线程。接下来就是合成线程一展宏图的时候啦。

首先，考虑到视口就这么大，当页面非常大的时候，要滑很长时间才能滑到底，如果要一口气全部绘制出来是相当浪费性能的。因此，合成线程要做的第一件事情就是将图层**分块**。这些块的大小一般不会特别大，通常是 256 _ 256 或者 512 _ 512 这个规格。这样可以大大加速页面的首屏展示。

因为后面图块数据要进入 GPU 内存，考虑到浏览器内存上传到 GPU 内存的操作比较慢，即使是绘制一部分图块，也可能会耗费大量时间。针对这个问题，Chrome 采用了一个策略: 在首次合成图块时只采用一个**低分辨率**的图片，这样首屏展示的时候只是展示出低分辨率的图片，这个时候继续进行合成操作，当正常的图块内容绘制完毕后，会将当前低分辨率的图块内容替换。这也是 Chrome 底层优化首屏加载速度的一个手段。

顺便提醒一点，渲染进程中专门维护了一个**栅格化线程池**，专门负责把**图块**转换为**位图数据**。

然后合成线程会选择视口附近的**图块**，把它交给**栅格化线程池**生成位图。

生成位图的过程实际上都会使用 GPU 进行加速，生成的位图最后发送给`合成线程`。

### 显示器显示内容

栅格化操作完成后，**合成线程**会生成一个绘制命令，即"DrawQuad"，并发送给浏览器进程。

浏览器进程中的`viz组件`接收到这个命令，根据这个命令，把页面内容绘制到内存，也就是生成了页面，然后把这部分内存发送给显卡。为什么发给显卡呢？我想有必要先聊一聊显示器显示图像的原理。

无论是 PC 显示器还是手机屏幕，都有一个固定的刷新频率，一般是 60 HZ，即 60 帧，也就是一秒更新 60 张图片，一张图片停留的时间约为 16.7 ms。而每次更新的图片都来自显卡的**前缓冲区**。而显卡接收到浏览器进程传来的页面后，会合成相应的图像，并将图像保存到**后缓冲区**，然后系统自动将`前缓冲区`和`后缓冲区`对换位置，如此循环更新。

看到这里你也就是明白，当某个动画大量占用内存的时候，浏览器生成图像的时候会变慢，图像传送给显卡就会不及时，而显示器还是以不变的频率刷新，因此会出现卡顿，也就是明显的掉帧现象。

## 回流&重绘&合成

回流和重绘是老生常谈的东西了，大家也应该非常熟悉了，但在这里可以结合浏览器渲染机制顺带讲一下

https://csstriggers.com/

### 回流

首先介绍`回流`。`回流`也叫`重排`。

#### 触发条件

简单来说，就是当我们对 DOM 结构的修改引发 DOM 几何尺寸变化的时候，那么**浏览器会将当前的 Layout 标记为 dirty**，这会使得浏览器在**下一帧**执行上述所有步骤。

具体一点，有以下的操作会触发回流:

1. 一个 DOM 元素的几何属性变化，常见的几何属性有`width`、`height`、`padding`、`margin`、`left`、`top`、`border` 等等, 这个很好理解。
2. 使 DOM 节点发生`增减`或者`移动`。
3. 读写 `offset`族、`scroll`族和`client`族属性的时候，浏览器为了获取这些值，需要进行回流操作。
4. 调用 `window.getComputedStyle` 方法。

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1628856465689.png)

需要注意的是，浏览器是在下一帧、下一次渲染的时候才重排。并不是 JS 执行完这一行改变样式的语句之后立即重排，浏览器会批处理回流，所以你可以在 JS 语句里写 100 行改 CSS 的语句，但是只会在下一帧的时候重排一次。

如果你在当前 Layout 被标记为 dirty 的情况下，访问了 offsetTop、scrollHeight 等属性，那么，浏览器会立即重新 Layout，计算出此时元素正确的位置信息，以保证你在 JS 里获取到的 offsetTop、scrollHeight 等是正确的。

```js
//Layout未dirty 访问domA.offsetWidth不会Force Layout
domA.style.width = domA.offsetWidth + 1 + 'px'
//Layout已经dirty， Force Layout
domB.style.width = domB.offsetWidth + 1 + 'px'
//Layout已经dirty， Force Layout
domC.style.width = domC.offsetWidth + 1 + 'px'
```

另外，**每次重排或者强制重排后，当前 Layout 就不再 dirty**。所以你再访问 offsetWidth 之类的属性，并不会再触发重排。

```js
// Layout未dirty 访问多少次都不会触发重排 （当然不能超过分批处理间隔时间）
console.log(domA.offsetWidth)
console.log(domB.offsetWidth)

//Layout未dirty 访问domA.offsetWidth不会Force Layout
domA.style.width = domA.offsetWidth + 1 + 'px'
//Layout已经dirty， Force Layout
console.log(domC.offsetWidth)

//Layout不再dirty，不会触发重排
console.log(domA.offsetWidth)
//Layout不再dirty，不会触发重排
console.log(domB.offsetWidth)
```

### 重绘

#### 触发条件

当 DOM 的修改导致了样式的变化，并且没有影响几何属性的时候，会导致`重绘`(`repaint`)。

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1628856495070.png)

重绘过程跳过了`生成布局树`和`建图层树`的阶段，直接生成绘制列表，然后继续进行分块、生成位图等后面一系列操作。

可以看到，**重绘不一定导致回流，但回流一定发生了重绘**。

### 合成

还有一种情况，是直接合成。比如利用 CSS3 的`transform`、`opacity`、`filter`这些属性就可以实现合成的效果，也就是大家常说的**GPU 加速**。

提升为合成层简单说来有以下几点好处：

- 合成层的位图，会交由 GPU 合成，比 CPU 处理要快

- 当需要 repaint 时，只需要 repaint 本身，不会影响到其他的层

- 对于 transform 和 opacity 效果，不会触发 layout 和 paint

我们可以利用合成层来优化页面性能

#### 提升动画效果的元素

合成层的好处是不会影响到其他元素的绘制，因此，为了减少动画元素对其他元素的影响，从而减少 paint，我们需要把动画效果中的元素提升为合成层。

提升合成层的最好方式是使用 CSS 的 will-change 属性。从上一节合成层产生原因中，可以知道 will-change 设置为 opacity、transform、top、left、bottom、right 可以将元素提升为合成层。

```css
#target {
  will-change: transform;
}
```

兼容性如下：

### ![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1628857017832.png)

对于那些目前还不支持 will-change 属性的浏览器，目前常用的是使用一个 3D transform 属性来强制提升为合成层：

```css
#target {
  transform: translateZ(0);
}
```

#### 使用 transform 或者 opacity 来实现动画效果

这个大家都知道，只是需要注意：元素提升为合成层后，transform 和 opacity 才不会触发 paint，如果不是合成层，则其依然会触发 paint。

## 参考文章

[(1.6w 字)浏览器灵魂之问，请问你能接得住几个？](https://juejin.cn/post/6844904021308735502)

[渲染页面：浏览器的工作原理](https://developer.mozilla.org/zh-CN/docs/Web/Performance/How_browsers_work)

[构建对象模型](https://developers.google.com/web/fundamentals/performance/critical-rendering-path/constructing-the-object-model?hl=zh-cn)

[浏览器渲染详细过程：重绘、重排和 composite 只是冰山一角](https://juejin.cn/post/6844903476506394638)

[无线性能优化：Composite](https://fed.taobao.org/blog/2016/04/26/performance-composite/)
