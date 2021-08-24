---
slug: redux-analysis
title: Redux 原理分析
author: Cansiny0320
author_title: 前端开发者
author_url: https://github.com/Cansiny0320
author_image_url: https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1618298366420-logo.jpg
image: https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1629355306002.png
description: Redux 原理分析
tags: [JavaScript, SourceCode]
---

## Redux 的核心思想

Redux 是 JavaScript 状态容器，能提供可预测化的状态管理。

<!--truncate-->

它认为：

- Web 应用是一个状态机，视图与状态是一一对应的。
- 所有的状态，保存在一个对象里面。

我们先来看看 “状态容器”、“视图与状态一一对应” 以及 “一个对象” 这三个概念的具体体现。

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1629290427369.png)

如上图，Store 是 Redux 中的状态容器，它里面存储着所有的状态数据，每个状态都跟一个视图一一对应。

Redux 也规定，一个 State 对应一个 View。只要 State 相同，View 就相同，知道了 State，就知道 View 是什么样，反之亦然。

比如，当前页面分三种状态：loading（加载中）、success（加载成功）或者 error（加载失败），那么这三个就分别唯一对应着一种视图。

现在我们对 “状态容器” 以及 “视图与状态一一对应” 有所了解了，那么 Redux 是怎么实现可预测化的呢？我们再来看下 Redux 的工作流程。

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1629355306002.png)

首先，我们看下几个核心概念：

- Store：保存数据的地方，你可以把它看成一个容器，整个应用只能有一个 Store。
- State：Store 对象包含所有数据，如果想得到某个时点的数据，就要对 Store 生成快照，这种时点的数据集合，就叫做 State。
- Action：State 的变化，会导致 View 的变化。但是，用户接触不到 State，只能接触到 View。所以，State 的变化必须是 View 导致的。Action 就是 View 发出的通知，表示 State 应该要发生变化了。
- Action Creator：View 要发送多少种消息，就会有多少种 Action。如果都手写，会很麻烦，所以我们定义一个函数来生成 Action，这个函数就叫 Action Creator。
- Reducer：Store 收到 Action 以后，必须给出一个新的 State，这样 View 才会发生变化。这种 State 的计算过程就叫做 Reducer。Reducer 是一个函数，它接受 Action 和当前 State 作为参数，返回一个新的 State。
- dispatch：是 View 发出 Action 的唯一方法。
- subscribe：订阅数据变化。一旦 state 发生改变，执行回调。

然后我们过下整个工作流程：

1. 首先，用户（通过 View）发出 Action，发出方式就用到了 dispatch 方法。
2. 然后，Store 自动调用 Reducer，并且传入两个参数：当前 State 和收到的 Action，Reducer 会返回新的 State
3. State 一旦有变化，Store 就会调用监听函数，来更新 View。

到这儿为止，一次用户交互流程结束。可以看到，在整个流程中数据都是单向流动的，这种方式保证了流程的清晰。

## 源码分析

源码分析使用简化版代码，点击查看[完整代码](https://github.com/Cansiny0320/mini-redux)

### createStore

createStore 是 redux 的主流程

```js
export default function createStore(reducer, preloadedState, enhancer) {
  // 中间件
  if (enhancer) {
    return enhancer(createStore)(reducer, preloadedState)
  }
  let currentReducer = reducer
  let state = preloadedState
  let listeners = []

  function getState() {
    return state
  }

  function subscribe(listener) {
    let isSubscribed = true
    listeners.push(listener)
    return function unsubscribe() {
      if (!isSubscribed) return
      isSubscribed = false
      listeners.splice(index, 1)
    }
  }

  function dispatch(action) {
    state = currentReducer(state, action)
    listeners.forEach(listener => listener())
    return action
  }

  function replaceReducer(nextReducer) {
    currentReducer = nextReducer
    dispatch({ type: Symbol('REPLACE') })
    return store
  }
  // 在没有传 preloadedState 的时候，初始化 state
  dispatch({ type: Symbol('INIT') })

  return {
    dispatch,
    subscribe,
    getState,
    replaceReducer,
  }
}
```

核心的代码是这些

```js
let currentReducer = reducer
let state = preloadedState
let listeners = []

function subscribe(listener) {
  let isSubscribed = true
  listeners.push(listener)
  return function unsubscribe() {
    // 防止重复调用
    if (!isSubscribed) return
    isSubscribed = false
    listeners.splice(index, 1)
  }
}

function dispatch(action) {
  state = currentReducer(state, action)
  listeners.forEach(listener => listener())
  return action
}
```

可以看到，`subscribe`函数将我们传入的`listener`加入`listeners`数组，然后在 dispatch`的时候执行每个`listener`，这样就达到了更新订阅的目的

`subscribe`函数还会返回一个`unsubscribe`函数，用来取消订阅的`listener`

### combineReducers

combineReducers 是用来合并多个 reducer 的函数

```js
export default function combineReducers(reducers) {
  const reducerKeys = Object.keys(reducers)
  return function combination(state, action) {
    const nextState = {}
    reducerKeys.forEach(key => {
      const reducer = reducers[key]
      // 之前的 key 的 state
      const previousStateForKey = state[key]
      // 执行 分 reducer，获得新的 state
      const nextStateForKey = reducer(previousStateForKey, action)
      nextState[key] = nextStateForKey
    })
    return nextState
  }
}
```

其实就是根据不同的`key`，拿到对应的`reducer`和`state`再进行更新

### applyMiddleware

applyMiddleware 是实现中间件支持的函数

```js
//  把 compose(f, g, h) 转换成 (...args) => f(g(h(...args)))
const compose = (...funcs) =>
  funcs.reduce(
    (a, b) =>
      (...args) =>
        a(b(...args))
  )

export default function applyMiddleware(...middlewares) {
  return createStore => (reducer, preloadedState) => {
    const store = createStore(reducer, preloadedState)
    const middlewareAPI = {
      getState: store.getState,
    }
    const chain = middlewares.map(middleware => middleware(middlewareAPI))
    const dispatch = compose(...chain)(store.dispatch)
    store.dispatch = dispatch
    return store
  }
}
```

较为关键的是这一步`const dispatch = compose(...chain)(store.dispatch)`，将中间件进行组合

到现在为止我们已经实现了 redux 的主要功能，还有一些小细节就不继续深入了，现在我们再来看看 redux 的工作流程，是不是清晰多啦？

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1629355306002.png)

## 参考文章

[Redux 从设计到源码](https://tech.meituan.com/2017/07/14/redux-design-code.html)

[完全理解 redux](https://github.com/brickspert/blog/issues/22)
