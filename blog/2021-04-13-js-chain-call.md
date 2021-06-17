---
slug: js-chain-call
title: JS链式调用和流程控制
author: Cansiny0320
author_title: 前端开发者
author_url: https://github.com/Cansiny0320
author_image_url: https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1618298366420-logo.jpg
tags: [JavaScript]
---

博主在某工作室担任前端导师(知识搬运工)的时候，遇到了其他导师出了一道 JS 题目，要求实现以下输出

<!--truncate-->

```js
Student("fxy")
// =>输出：
// Hi! This is fxy!

Student("fxy").sleep(3).study("javascript")
// =>输出：
// Hi! This is fxy!
//等待3秒
// Wake up after 3
// Study javascript~

Student("fxy").study("javascript").study("Vue")
// =>输出：
// Hi! This is fxy!
// Study javascript~
// Study Vue~

Student("fxy").sleepFirst(5).study("Ajax")
// =>输出
// //等待5s
// Wake up after 5
// Hi! This is fxy!
// Study Ajax
```

本篇文章不叙述实现过程，主要分析一下执行过程和原理，实现如下：

参考:[关于 js 的 链式调用和流程控制 （sleep）](https://blog.csdn.net/qq_37653449/article/details/83933724)

```js
function Student(name) {
  Student.cbs = []
  Student.cbs.push(() => {
    console.log(`Hi! This is ${name}!`)
    Student.next()
  })
  setTimeout(() => {
    Student.next()
  }, 0)
  return Student
}

Student.next = function () {
  const cb = Student.cbs.shift()
  cb && cb()
}

Student.sleep = function (time) {
  Student.cbs.push(() => {
    setTimeout(() => {
      console.log(`Wake up after ${time}`)
      Student.next()
    }, time * 1000)
  })
  return Student
}

Student.sleepFirst = function (time) {
  Student.cbs.unshift(() => {
    setTimeout(() => {
      console.log(`Wake up after ${time}`)
      Student.next()
    }, time * 1000)
  })
  return Student
}

Student.study = function (thing) {
  Student.cbs.push(() => {
    console.log(`Study ${thing}`)
    Student.next()
  })
  return Student
}

// Student("fxy")
// Student("fxy").sleep(3).study("javascript")
// Student("fxy").study("javascript").study("Vue")
// Student("fxy").sleepFirst(5).study("Ajax")
```

## 原理分析

首先初始化的时候定义了一个数组`Student.cbs = []`，保存函数队列，我们之后只需要操作这个数组就行。

`next()`方法控制函数出队列并执行，由`Student()`中的

```js
setTimeout(() => {
  Student.next()
}, 0)
```

启动函数执行

我们来根据实例讲讲执行流程，

第一个很简单，

```js
Student("fxy")
```

讲函数 push 进队列后，经过 setTimeout 调用 next()方法执行函数，打印信息

第二个

```js
Student("fxy").sleep(3).study("javascript")
// Hi! This is fxy!
// 等待3秒
// Wake up after 3
// Study javascript~
```

首先提醒一点，以上链式调用等同于

```js
Student("fxy")
Student.sleep(3)
Student.study("javascript")
```

三个同步任务执行，所以在 cbs 里应该有`[Student,sleep,study]`（用函数名代替输出）

`Student`首先出队执行调用执行`next()`，`sleep`函数出队执行，3s 后进入宏任务队列输出，继续调用`next()`函数，让`study`函数出队执行，也会调用一次`next()`函数，但此时队列已空。

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1618300395026.png)

第三个经过上面的解释很简单了，我们直接来看第四个

```js
Student("fxy").sleepFirst(5).study("Ajax")
// 等待5s
// Wake up after 5
// Hi! This is fxy!
// Study Ajax
```

`sleepFirst()`很神奇的在`Student()`之前先输出了，我们来看看`sleepFirst()`函数里面究竟干了什么。

```js
Student.sleepFirst = function (time) {
  Student.cbs.unshift(() => {
    setTimeout(() => {
      console.log(`Wake up after ${time}`)
      Student.next()
    }, time * 1000)
  })
  return Student
}
```

`sleepFirst()`函数将一个函数用`unshift`方法放入队列顶部，实现了`sleepFirst()`的首先输出

上面的问题就这样轻松解决了

## 意外的输出

一个学员看了我上面的实现之后，执行了下面这段输出

```js
Student("fxy")
Student("fxy").sleep(3).study("javascript")
```

输出结果也很让人迷惑

```js
// Hi! This is fxy!
// Study javascript
// Wake up after 3
```

小朋友，你是否有很多小问号？

为什么`Student`怎么只输出了一次？`study`的输出怎么跑到了`sleep`后面？

不急，我们一个一个问题来看

首先时为什么`Student`怎么只输出了一次？

很简单，因为我们的`cbs`是定义在`Student()`函数里面的，两次调用`Student()`函数，相当于初始化了两次`cbs`,所以有一个`Student`里的输出被漏掉了。如果我们将`cbs`定义在`Student()`函数外面就会输出两次。

```js
// Hi! This is fxy!
// Hi! This is fxy!
// Study javascript
// Wake up after 3
```

那为什么`study`的输出怎么跑到了`sleep`后面？

这个问题就得说到事件循环了，当一个宏任务执行完后，会检查微任务队列中有没有待执行的函数，显然我们这里没有微任务，那么就会执行下一个宏任务。

而我们`Student`触发用的的实际上是第一个`Student`中的`next()`，第二个`Student`中的`next()`还在宏任务队列中等待执行。第一个`Student`调用`next()`让`sleep()`出队执行，但是有 3s 的延时才会进入宏任务队列，第二个`Student`也调用`next()`让`study()`出队执行，没有延时直接进入宏任务队列执行，之后`sleep()`才进入宏任务队列执行，所以`study`的输出跑到了`sleep`后面

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1618306441269.png)
