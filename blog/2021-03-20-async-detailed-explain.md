---
slug: async-detailed-explain
title: 前端异步发展过程
author: Cansiny0320
author_title: 前端开发者
author_url: https://github.com/Cansiny0320
author_image_url: https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1618298366420-logo.jpg
description: 前端异步发展过程
tags: [JavaScript]
---

## 💬 前言

> 异步编程的语法目标，就是怎样让它更像同步编程。——阮一峰《深入掌握 ECMAScript 6 异步编程》

<!--truncate-->

JavaScript 的异步编程发展经过了四个阶段：

1. 回调函数、发布订阅
2. Promise
3. co 自执行的 Generator 函数
4. async / await

## 🤗Promise

首先让我们来回忆一下 Promise 的使用

```js
new Promise(resolve => {
  setTimeout(() => {
    resolve(1)
  }, 500)
})
  .then(res => {
    console.log(res)
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(2)
      }, 500)
    })
  })
  .then(console.log)
```

### 😏 核心代码

```js
function Promise(fn) {
  this.cbs = []
  const resolve = value => {
    setTimeout(() => {
      this.data = value
      this.cbs.forEach(cb => cb(value))
    })
  }
  fn(resolve)
}
Promise.prototype.then = function (onResolved) {
  return new Promise(resolve => {
    this.cbs.push(() => {
      const res = onResolved(this.data)
      if (res instanceof Promise) {
        res.then(resolve)
      } else {
        resolve(res)
      }
    })
  })
}
```

**`then`实现**

```js
Promise.prototype.then = function (onResolved) {
  // 这里叫做 promise2
  return new Promise(resolve => {
    this.cbs.push(() => {
      const res = onResolved(this.data)
      if (res instanceof Promise) {
        // resolve 的权力被交给了 user promise
        res.then(resolve)
      } else {
        // 如果是普通值 就直接 resolve
        // 依次执行 cbs 里的函数 并且把值传递给 cbs
        resolve(res)
      }
    })
  })
}
```

结合实例来说

```js
const fn = resolve => {
  setTimeout(() => {
    resolve(1)
  }, 500)
}

const promise1 = new Promise(fn)

promise1.then(res => {
  console.log(res)
  // user promise
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(2)
    }, 500)
  })
})
```

注意这里的命名：

1. 我们把 `new Promise` 返回的实例叫做 `promise1`

2. 在 `Promise.prototype.then` 的实现中，我们构造了一个新的 promise 返回，叫它 `promise2`

3. 在用户调用 `then` 方法的时候，用户手动构造了一个 promise 并且返回，用来做异步的操作，叫它 `user promise`

那么在 `then` 的实现中，内部的 this 其实就指向 `promise1`
而 `promise2` 的传入的 `fn` 函数执行了一个 `this.cbs.push()`，其实是往 `**promise1**` 的 `cbs` 数组中 push 了一个函数，等待后续执行。

```js
Promise.prototype.then = function (onResolved) {
  // 这里叫做 promise2
  return new Promise(resolve => {
    // 这里的 this 其实是 promise1
    this.cbs.push(() => {})
  })
}
```

那么重点看这个 push 的函数，注意，这个函数在 `promise1` 被 `resolve` 了以后才会执行。

```js
// promise2
return new Promise(resolve => {
  this.cbs.push(() => {
    // onResolved 就对应 then 传入的函数
    const res = onResolved(this.data)
    // 例子中的情况 用户自己返回了一个 user promise
    if (res instanceof Promise) {
      // user promise 的情况
      // 用户会自己决定何时 resolve promise2
      // 只有 promise2 被 resolve 以后
      // then 下面的链式调用函数才会继续执行
      res.then(resolve)
    } else {
      resolve(res)
    }
  })
})
```

如果用户传入给 then 的 onResolved 方法返回的是个` user promise`，那么这个`user promise`里用户会自己去在合适的时机 `resolve promise2`，那么进而这里的 `res.then(resolve)` 中的 resolve 就会被执行：

```js
if (res instanceof Promise) {
  res.then(resolve)
}
```

结合下面这个例子来看：

```js
new Promise(resolve => {
  setTimeout(() => {
    // resolve1
    resolve(1)
  }, 500)
})
  // then1
  .then(res => {
    console.log(res)
    // user promise
    return new Promise(resolve => {
      setTimeout(() => {
        // resolve2
        resolve(2)
      }, 500)
    })
  })
  // then2
  .then(console.log)
```

`then1`这一整块其实返回的是 `promise2`，那么 `then2` 其实本质上是 `promise2.then(console.log)`，
也就是说 `then2`注册的回调函数，其实进入了`promise2`的 `cbs` 回调数组里，又因为我们刚刚知道，resolve2 调用了之后，`user promise` 会被 resolve，进而触发 `promise2` 被 resolve，进而 `promise2` 里的 `cbs` 数组被依次触发。
这样就实现了用户自己写的 `resolve2` 执行完毕后，`then2` 里的逻辑才会继续执行，也就是**异步链式调用**

### 😲 完整实现

上面介绍了一下 Promise 的核心部分，下面我们根据 [Promises/A+ 规范](https://promisesaplus.com/) 实现一个较为完整的 Promise

Promise 有三种状态`pending`、`resolved`、`rejected`，在一个 Promise 中状态只能改变一次。

首先我们的 Promise 需要传入一个`executor`函数，它的两个参数可以让我们 resolve 一个 value 或者 reject 一个 reason

```js
const PENDING = 'pending'
const RESOLVED = 'resolved'
const REJECTED = 'rejected'

class Promise {
  constructor(executor) {
    this.status = PENDING
    this.value = null
    this.reason = null

    function resolve(value) {
      if (this.status === PENDING) {
        this.value = value
        this.status = RESOLVED
      }
    }

    function reject(reason) {
      if (this.status === PENDING) {
        this.reason = reason
        this.status = REJECTED
      }
    }
    try {
      executor(resolve, reject)
    } catch (e) {
      reject(e)
    }
  }

  then(onFulfilled, onRejected) {
    if (this.status === RESOLVED) {
      onFulfilled(this.value)
    }
    if (this.status === REJECTED) {
      onRejected(this.reason)
    }
  }
}
```

上面这个 Promise 明显还有许多问题：

- 如果我们的`executor`里有异步操作，那么调用`then`方法的时候，`status`可能还是`pending`状态。我们可以用两个数组分别存放回调函数`onFulfilledCallbacks`和`onRejectedCallbacks`，在执行`resolve`和`reject`函数的时候，再遍历数组中的函数执行。

- `promise`状态只能修改一次，所以如果状态不为`pending`进入了`resolve`或者`reject`函数时，应该直接 return 掉

改造如下

```js
const PENDING = 'pending'
const RESOLVED = 'resolved'
const REJECTED = 'rejected'

class Promise {
  constructor(executor) {
    this.status = PENDING
    this.value = null
    this.reason = null
    this.onFulfilledCallbacks = []
    this.onRejectedCallbacks = []
    function resolve(value) {
      if (this.status !== PENDING) return
      setTimeout(() => {
        this.status = FULFILLED
        this.value = value
        this.onFulfilledCallbacks.forEach(cb => cb(this.value))
      })
    }

    function reject(reason) {
      if (this.status !== PENDING) return
      setTimeout(() => {
        this.status = REJECTED
        this.reason = reason
        this.onRejectedCallbacks.forEach(cb => cb(this.reason))
      })
    }
    try {
      executor(resolve, reject)
    } catch (e) {
      reject(e)
    }
  }

  then(onFulfilled, onRejected) {
    onFulfilled =
      typeof onFulfilled === 'function' ? onFulfilled : value => value
    onRejected =
      typeof onRejected === 'function'
        ? onRejected
        : reason => {
            throw reason
          }
    if (this.status === RESOLVED) {
      setTimeout(() => {
        try {
          onFulfilled(this.value)
        } catch (e) {
          reject(e)
        }
      })
    }
    if (this.status === REJECTED) {
      setTimeout(() => {
        try {
          onRejected(this.reason)
        } catch (e) {
          reject(e)
        }
      })
    }
    if (this.status === PENDING) {
      this.onFulfilledCallbacks.push(() => {
        try {
          onFulfilled(this.value)
        } catch (e) {
          reject(e)
        }
      })
      this.onRejectedCallbacks.push(() => {
        try {
          onRejected(this.reason)
        } catch (e) {
          reject(e)
        }
      })
    }
  }
}
```

现在我们的 Promise 还不能链式调用了，所以我们继续对我们的 Promise 进行改造

首先我们思考一下，如果能够链式调用的话，我们的`then`方法肯定需要返回一个`promise`，我们命名为`bridgePromise`

并且我们需要考虑一下`onFulfilled`和`onRejected`的返回值也是一个``promise`的情况

我们抽离一个`resolvePromise`方法来进行判断

- `onFulfilled`和`onRejected`的返回值不能和`bridgePromise`相同
- 对于`result`也是一个`promise`或者是一个`thenable`的`function`或者`object`的情况，我们使用递归的方法来解决。
- 否则直接`resolve`

```js
function resolvePromise(bridgePromise, result, resolve, reject) {
  if (bridgePromise === result) {
    // 循环
    return reject(
      new TypeError('Chaining cycle detected for promise #<Promise>')
    )
  }
  if (isPromise(result)) {
    if (result.status === PENDING) {
      result.then(
        y => resolvePromise(bridgePromise, y, resolve, reject),
        reject
      )
    } else {
      result.then(resolve, reject)
    }
  } else if (isThenable(result)) {
    result.then(y => resolvePromise(bridgePromise, y, resolve, reject), reject)
  } else {
    resolve(result)
  }
}
```

这样我们的`Promise`实现得就差不多啦

```js
const PENDING = 'pending'
const RESOLVED = 'resolved'
const REJECTED = 'rejected'

class Promise {
  constructor(executor) {
    this.status = PENDING
    this.value = null
    this.reason = null
    this.onFulfilledCallbacks = []
    this.onRejectedCallbacks = []
    function resolve(value) {
      if (this.status !== PENDING) return
      setTimeout(() => {
        this.status = FULFILLED
        this.value = value
        this.onFulfilledCallbacks.forEach(cb => cb(this.value))
      })
    }

    function reject(reason) {
      if (this.status !== PENDING) return
      setTimeout(() => {
        this.status = REJECTED
        this.reason = reason
        this.onRejectedCallbacks.forEach(cb => cb(this.reason))
      })
    }
    try {
      executor(resolve, reject)
    } catch (e) {
      reject(e)
    }
  }

  then(onFulfilled, onRejected) {
    onFulfilled =
      typeof onFulfilled === 'function' ? onFulfilled : value => value
    onRejected =
      typeof onRejected === 'function'
        ? onRejected
        : reason => {
            throw reason
          }
    return (bridgePromise = new Promise((resolve, reject) => {
      if (this.status === RESOLVED) {
        setTimeout(() => {
          try {
            let result = onFulfilled(this.value)
            resolvePromise(bridgePromise, result, resolve, reject)
          } catch (e) {
            reject(e)
          }
        })
      }
      if (this.status === REJECTED) {
        setTimeout(() => {
          try {
            let result = onRejected(this.reason)
            resolvePromise(bridgePromise, result, resolve, reject)
          } catch (e) {
            reject(e)
          }
        })
      }
      if (this.status === PENDING) {
        this.onFulfilledCallbacks.push(() => {
          try {
            let result = onFulfilled(this.value)
            resolvePromise(bridgePromise, result, resolve, reject)
          } catch (e) {
            reject(e)
          }
        })
        this.onRejectedCallbacks.push(() => {
          try {
            let result = onRejected(this.reason)
            resolvePromise(bridgePromise, result, resolve, reject)
          } catch (e) {
            reject(e)
          }
        })
      }
    }))
  }
}
```

然后再补充一些`Promise`的其他方法

```js
const PENDING = 'pending'
const RESOLVED = 'resolved'
const REJECTED = 'rejected'

class Promise {
  constructor(executor) {
    this.status = PENDING
    this.value = null
    this.reason = null
    this.onFulfilledCallbacks = []
    this.onRejectedCallbacks = []
    function resolve(value) {
      if (this.status !== PENDING) return
      setTimeout(() => {
        this.status = FULFILLED
        this.value = value
        this.onFulfilledCallbacks.forEach(cb => cb(this.value))
      })
    }

    function reject(reason) {
      if (this.status !== PENDING) return
      setTimeout(() => {
        this.status = REJECTED
        this.reason = reason
        this.onRejectedCallbacks.forEach(cb => cb(this.reason))
      })
    }
    try {
      executor(resolve, reject)
    } catch (e) {
      reject(e)
    }
  }

  then(onFulfilled, onRejected) {
    onFulfilled =
      typeof onFulfilled === 'function' ? onFulfilled : value => value
    onRejected =
      typeof onRejected === 'function'
        ? onRejected
        : reason => {
            throw reason
          }
    return (bridgePromise = new Promise((resolve, reject) => {
      if (this.status === RESOLVED) {
        setTimeout(() => {
          try {
            let result = onFulfilled(this.value)
            resolvePromise(bridgePromise, result, resolve, reject)
          } catch (e) {
            reject(e)
          }
        })
      }
      if (this.status === REJECTED) {
        setTimeout(() => {
          try {
            let result = onRejected(this.reason)
            resolvePromise(bridgePromise, result, resolve, reject)
          } catch (e) {
            reject(e)
          }
        })
      }
      if (this.status === PENDING) {
        this.onFulfilledCallbacks.push(() => {
          try {
            let result = onFulfilled(this.value)
            resolvePromise(bridgePromise, result, resolve, reject)
          } catch (e) {
            reject(e)
          }
        })
        this.onRejectedCallbacks.push(() => {
          try {
            let result = onRejected(this.reason)
            resolvePromise(bridgePromise, result, resolve, reject)
          } catch (e) {
            reject(e)
          }
        })
      }
    }))
  }
  catch(onRejected) {
    return this.then(null, onRejected)
  }

  static resolve(p) {
    if (isPromise(p)) return p // Promise.resolve(p) 与 new Promise(resolve => resolve(p)) 的区别
    return new Promise((resolve, reject) => {
      if (isThenable(p)) p.then(resolve, reject)
      else resolve(p)
    })
  }

  static reject(p) {
    return new Promise((_, reject) => reject(p))
  }

  static all(promises) {
    return new Promise((resolve, reject) => {
      let values = []
      let count = 0
      function handle(value, index) {
        values[index] = value
        if (++count === promises.length) resolve(values)
      }
      // p 可能不是 Promise，所以用 Promise.resolve 包一下
      promises.forEach((p, i) =>
        Promise.resolve(p).then(value => handle(value, i), reject)
      )
    })
  }

  static race(promises) {
    return new Promise((resolve, reject) => {
      promises.forEach(p => Promise.resolve(p).then(resolve, reject))
    })
  }

  static allSettled(promises) {
    return new Promise(resolve => {
      let results = []
      let count = 0
      function handle(result, index) {
        results[index] = result
        if (++count === promises.length) resolve(results)
      }
      promises.forEach((p, i) =>
        Promise.resolve(p).then(
          value => handle({ status: 'resolved', value }, i),
          reason => handle({ status: 'rejected', reason }, i)
        )
      )
    })
  }
}
```

## 📝 Generator

`Generator`可以用来处理异步事件，解决回调地狱的问题，比如：

```js
const request = require('request')

request('https://www.baidu.com', function (error, response) {
  if (!error && response.statusCode == 200) {
    console.log('get times 1')

    request('https://www.baidu.com', function (error, response) {
      if (!error && response.statusCode == 200) {
        console.log('get times 2')

        request('https://www.baidu.com', function (error, response) {
          if (!error && response.statusCode == 200) {
            console.log('get times 3')
          }
        })
      }
    })
  }
})
```

使用`Generator`

```js
const request = require('request')

function* requestGen() {
  function sendRequest(url) {
    request(url, function (error, response) {
      if (!error && response.statusCode == 200) {
        // console.log(response.body)

        // 注意这里，引用了外部的迭代器 itor
        itor.next(response.body)
      }
    })
  }

  const url = 'https://www.baidu.com'

  // 使用 yield 发起三个请求，每个请求成功后再继续调 next
  const r1 = yield sendRequest(url)
  console.log('r1', r1)
  const r2 = yield sendRequest(url)
  console.log('r2', r2)
  const r3 = yield sendRequest(url)
  console.log('r3', r3)
}

const itor = requestGen()

// 手动调第一个 next
itor.next()
```

这个例子中我们在生成器里面写了一个请求方法，这个方法会去发起网络请求，每次网络请求成功后又继续调用`next`执行后面的`yield`，最后是在外层手动调一个`next`触发这个流程。这样写可以解决回调地狱，但是在`requestGen`里面引用了外面的迭代器`itor`，耦合很高，而且不好复用。

### 🏀thunk 函数

为了解决前面说的耦合高，不好复用的问题，就有了 thunk 函数。thunk 函数理解起来有点绕，我先把代码写出来，然后再一步一步来分析它的执行顺序：

```js
function Thunk(fn) {
  return function (...args) {
    return function (callback) {
      return fn.call(this, ...args, callback)
    }
  }
}

function run(fn) {
  let gen = fn()

  function next(err, data) {
    let result = gen.next(data)

    if (result.done) return

    result.value(next)
  }

  next()
}

// 使用 thunk 方法
const request = require('request')
const requestThunk = Thunk(request)

function* requestGen() {
  const url = 'https://www.baidu.com'

  let r1 = yield requestThunk(url)
  console.log(r1.body)

  let r2 = yield requestThunk(url)
  console.log(r2.body)

  let r3 = yield requestThunk(url)
  console.log(r3.body)
}

// 启动运行
run(requestGen)
```

这段代码里面的 Thunk 函数返回了好几层函数，我们从他的使用入手一层一层剥开看：

1. `requestThunk`是 Thunk 运行的返回值，也就是第一层返回值，参数是`request`，也就是：

   ```js
   function(...args) {
     return function(callback) {
       return request.call(this, ...args, callback);   // 注意这里调用的是 request
     }
   }
   ```

2. `run`函数的参数是生成器，我们看看他到底干了啥：

   1. run 里面先调用生成器，拿到迭代器`gen`，然后自定义了一个`next`方法，并调用这个`next`方法，为了便于区分，我这里称这个自定义的`next`为局部`next`

   2. 局部`next`会调用生成器的`next`，生成器的`next`其实就是`yield requestThunk(url)`，参数是我们传进去的`url`，这就调到我们前面的那个方法，这个`yield`返回的`value`其实是：

      ```js
      function(callback) {
        return request.call(this, url, callback);
      }
      ```

   3. 检测迭代器是否已经迭代完毕，如果没有，就继续调用第二步的这个函数，这个函数其实才真正的去`request`，这时候传进去的参数是局部`next`，局部`next`也作为了`request`的回调函数。

   4. 这个回调函数在执行时又会调`gen.next`，这样生成器就可以继续往下执行了，同时`gen.next`的参数是回调函数的`data`，这样，生成器里面的`r1`其实就拿到了请求的返回值。

Thunk 函数就是这样一种可以自动执行 Generator 的函数，因为 Thunk 函数的包装，我们在 Generator 里面可以像同步代码那样直接拿到`yield`异步代码的返回值。

## 🔧co

`co `接收一个 `generator `函数，返回一个 `promise`，`generator `函数中 `yieldable `对象有：

- `promises`
- `thunks `(functions)
- `array `(parallel execution)
- `objects `(parallel execution)
- `generators `(delegation)
- `generator functions` (delegation)

`co`会将以上各种对象转为`promise`，所以直接看对于 `yield `一个 `promise `的 `generator `怎么自动执行

```js
const fetch = require('node-fetch')
const co = require('co')
co(function* () {
  // 直接用 fetch，简单多了，fetch 返回的就是 Promise
  const r1 = yield fetch('https://www.baidu.com')
  const r2 = yield fetch('https://www.baidu.com')
  const r3 = yield fetch('https://www.baidu.com')

  return {
    r1,
    r2,
    r3,
  }
}).then(res => {
  // 这里同样可以拿到{r1, r2, r3}
  console.log(res)
})
```

### 🤨 源码分析

`co`的源码并不多，总共两百多行，一半都是在进行 yield 后面的参数检测和处理，检测他是不是 Promise，如果不是就转换为 Promise，所以即使你 yield 后面传的 thunk，他还是会转换成 Promise 处理。转换 Promise 的代码相对比较独立和简单，我这里不详细展开了，这里主要还是讲一讲核心方法`co(gen)`。下面是我复制的去掉了注释的简化代码：

```js
function co(gen) {
  var ctx = this
  var args = slice.call(arguments, 1)

  return new Promise(function (resolve, reject) {
    if (typeof gen === 'function') gen = gen.apply(ctx, args)
    if (!gen || typeof gen.next !== 'function') return resolve(gen)

    onFulfilled()

    function onFulfilled(res) {
      var ret
      try {
        ret = gen.next(res)
      } catch (e) {
        return reject(e)
      }
      next(ret)
      return null
    }

    function onRejected(err) {
      var ret
      try {
        ret = gen.throw(err)
      } catch (e) {
        return reject(e)
      }
      next(ret)
    }

    function next(ret) {
      if (ret.done) return resolve(ret.value)
      var value = toPromise.call(ctx, ret.value)
      if (value && isPromise(value)) return value.then(onFulfilled, onRejected)
      return onRejected(
        new TypeError(
          'You may only yield a function, promise, generator, array, or object, ' +
            'but the following object was passed: "' +
            String(ret.value) +
            '"'
        )
      )
    }
  })
}
```

1. Promise 里面先把 Generator 拿出来执行，得到一个迭代器`gen`
2. 手动调用一次`onFulfilled`，开启迭代。第一次调用`onFulfilled`并没有传递参数，这个参数主要是用来接收后面的 then 返回的结果。然后调用`gen.next`，注意这个的返回值 ret 的形式是{value, done}，然后将这个 ret 传给局部的 next
3. 然后执行局部 next，他接收的参数是 yield 返回值{value, done}
   1. 这里先检测迭代是否完成，如果完成了，就直接将整个 promise resolve
   2. 这里的 value 是 yield 后面表达式的值，可能是 thunk，也可能是 promise
   3. 将 value 转换成 promise
   4. 将转换后的 promise 拿出来执行，成功的回调是前面的`onFulfilled`
4. 我们再来看下`onFulfilled`，这是第二次执行`onFulfilled`了。这次执行的时候传入的参数 res 是上次异步 promise 的执行结果，对应我们的 fetch 就是拿回来的数据，这个数据传给第二个`gen.next`，效果就是我们代码里面的赋值给了第一个`yield`前面的变量`r1`。然后继续局部 next，这个 next 其实就是执行第二个异步 Promise 了。这个 promise 的成功回调又继续调用`gen.next`，这样就不断的执行下去，直到`done`变成`true`为止。
5. 最后看一眼`onRejected`方法，这个方法其实作为了异步 promise 的错误分支，这个函数里面直接调用了`gen.throw`，这样我们在 Generator 里面可以直接用`try...catch...`拿到错误。需要注意的是`gen.throw`后面还继续调用了`next(ret)`，这是因为在 Generator 的`catch`分支里面还可能继续有`yield`，比如错误上报的网络请求，这时候的迭代器并不一定结束了。

### ⚙️ 原理

co 的原理其实是通过 generator.next() 得到 generatorResult，由于 yield 出是一个 promise，通过 generatorResult.value.then 再把 promise 的结果通过 generator.next 的参数传给 yield 的左边，让 generator 自动执行，通过 generatorResult.done 判断是否执行结束

## 🍬 async / await

`async/await`其实是 Generator 和自动执行器的语法糖，写法和实现原理都类似 co 模块的 promise 模式。

`await` 帮我们做到了在同步阻塞代码的同时还能够监听 Promise 对象的决议，一旦 `promise` 决议，原本暂停执行的 async 函数就会恢复执行。这个时候如果决议是 `resolve` ，那么返回的结果就是 `resolve` 出来的值。如果决议是 `reject` ，我们就必须用 `try..catch` 来捕获这个错误，因为它相当于执行了 `it.throw(err)` 。

下面直接给出一种主流的 async / await 语法版本的实现代码：

```js
const runner = function (gen) {
  return new Promise((resolve, reject) => {
    var it = gen()
    const step = function (execute) {
      try {
        var next = execute()
      } catch (err) {
        reject(err)
      }

      if (next.done) return resolve(next.value)

      Promise.resolve(next.value)
        .then(val => step(() => it.next(val)))
        .catch(err => step(() => it.throw(err)))
    }
    step(() => it.next())
  })
}

async function fn() {
  // ...
}

// 等同于

function fn() {
  const gen = function* () {
    // ...
  }
  runner(gen)
}
```

从上面的代码我们可以看出 async 函数执行后返回的是一个 Promise 对象，然后使用递归的方法去自动执行生成器函数的暂停与启动。通过判断是否 done 进行 new Promise 的 resolve，如果没有完成就继续通过 next 进行传递，用 Promise.resolve 处理 result.value，当这个 promise 决议时就可以重新启动执行生成器函数或者抛出一个错误被 try..catch 所捕获并最终在 async 函数返回的 Promise 对象的错误处理函数中处理。


## 🙏refs

[最简实现 Promise，支持异步链式调用（20 行）](https://juejin.cn/post/6844904094079926286)

[手写一个 Promise/A+，完美通过官方 872 个测试用例](https://juejin.cn/post/6844904116913700877)

[从 Generator 入手读懂 co 模块源码](https://juejin.cn/post/6844904133577670664)
