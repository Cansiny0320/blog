---
id: closure
title: 闭包

# hide_title: true

# hide_table_of_contents: false

# sidebar_label: Markdown :)

# custom_edit_url: https://github.com/facebook/docusaurus/edit/master/docs/api-doc-markdown.md

description: 闭包
keywords:
  - JavaScript
image: https://i.imgur.com/mErPwqL.png
---

## 什么是闭包？

> 红宝书 (p178) 上对于闭包的定义：闭包是指有权访问另外一个函数作用域中的变量的函数，

> MDN 对闭包的定义为：闭包是指那些能够访问自由变量的函数。
>
> （其中自由变量，指在函数中使用的，但既不是函数参数 arguments 也不是函数的局部变量的变量，其实就是另外一个函数作用域中的变量。）

## 闭包产生的原因

闭包产生的原因的主要因素就是**作用域链**，当访问一个变量时，解释器会首先在当前作用域查找标示符，如果没有找到，就去父作用域找，直到找到该变量的标示符或者不在父作用域中，这就是作用域链

每一个子函数都会拷贝上级的作用域，形成作用域链：

```js
var a = 1;
function f1() {
  var a = 2
  function f2() {
    var a = 3;
    console.log(a);//3
  }
}
```

在这段代码中，f1 的作用域指向有全局作用域 (window) 和它本身，而 f2 的作用域指向全局作用域 (window)、f1 和它本身。而且作用域是从最底层向上找，直到找到全局作用域 window 为止，如果全局还没有的话就会报错。就这么简单一件事情！

闭包产生的本质就是，**当前环境中存在指向父级作用域的引用**。还是举上面的例子：
```js
function f1() {
  var a = 2
  function f2() {
    console.log(a);//2
  }
  return f2;
}
var x = f1();
x();
```

这里 x 会拿到父级作用域中的变量，输出 2。因为在当前环境中，含有对 f2 的引用，f2 恰恰引用了 window、f1 和 f2 的作用域。因此 f2 可以访问到 f1 的作用域的变量。

那是不是只有返回函数才算是产生了闭包呢？、

回到闭包的本质，我们只需要让父级作用域的引用存在即可，因此我们还可以这么做：

```js
var f3;
function f1() {
  var a = 2
  f3 = function() {
    console.log(a);
  }
}
f1();
f3();
```

让 f1 执行，给 f3 赋值后，等于说现在`f3 拥有了 window、f1 和 f3 本身这几个作用域的访问权限`，还是自底向上查找，`最近是在 f1`中找到了 a, 因此输出 2。

在这里是外面的变量`f3 存在着父级作用域的引用`，因此产生了闭包，形式变了，本质没有改变。

## 闭包的表现形式

- 返回一个函数，如节流防抖函数，发布订阅函数
- 异步回调中

- IIFE（立即执行函数表达式）

## 闭包经典题

如何解决下面的循环输出问题？

```js
for(var i = 1; i <= 5; i ++){
  setTimeout(function timer(){
    console.log(i)
  }, 0)
}
```

为什么会全部输出 6？如何改进，让它输出 1，2，3，4，5？（方法越多越好）

因为 setTimeout 为宏任务，由于 JS 中单线程 eventLoop 机制，在主线程同步任务执行完后才去执行宏任务，因此循环结束后 setTimeout 中的回调才依次执行，但输出 i 的时候当前作用域没有，往上一级再找，发现了 i, 此时循环已经结束，i 变成了 6。因此会全部输出 6。

解决方法：

1、利用 IIFE（立即执行函数表达式）当每次 for 循环时，把此时的 i 变量传递到定时器中

```js
for(var i = 1;i <= 5;i++){
  (function(j){
    setTimeout(function timer(){
      console.log(j)
    }, 0)
  })(i)
}
```

2、给定时器传入第三个参数，作为 timer 函数的第一个函数参数

```js
for(var i=1;i<=5;i++){
  setTimeout(function timer(j){
    console.log(j)
  }, 0, i)
}
```

3、使用 ES6 中的 let

```js
for(let i = 1; i <= 5; i++){
  setTimeout(function timer(){
    console.log(i)
  },0)
}
```
