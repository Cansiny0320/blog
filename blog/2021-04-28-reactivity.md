---
slug: reactivity
title: vue3数据响应式原理分析
author: Cansiny0320
author_title: 前端开发者
author_url: https://github.com/Cansiny0320
author_image_url: https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1618298366420-logo.jpg
tags: [JavaScript]
---

## reactivity

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1619512811924-reacivity.jpeg)

vue3 中的 reactivity 是一个独立的包，可以完全脱离 vue 使用，理论上在任何地方都可以使用(react 都可以)

我们先来看看 reactivity 包的使用

1. 在项目根目录运行 `yarn dev reactivity`，然后进入 `packages/reactivity` 目录找到产出的 `dist/reactivity.global.js` 文件。

2. 新建一个 `index.html`，写入如下代码：

   ```html
   <script src="./dist/reactivity.global.js"></script>
   <script>
     const { reactive, effect } = VueObserver

     const origin = {
       count: 0,
     }
     const state = reactive(origin)

     const fn = () => {
       const count = state.count
       console.log(`set count to ${count}`)
     }
     effect(fn)
   </script>
   ```

3. 在浏览器打开该文件，于控制台执行 `state.count++`，便可看到输出 `set count to 1`。

在上述的例子中，我们使用 `reactive()` 函数把 `origin` 对象转化成了 Proxy 对象 `state`；使用 `effect()` 函数把 `fn()` 作为响应式回调。当 `state.count` 发生变化时，便触发了 `fn()`。接下来我们将以这个例子结合上文的流程图，来讲解这套响应式系统是怎么运行的。

## 初始化阶段

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1619590986637-reacivity-1.jpeg)

在初始化阶段，主要做了两件事：

1. 把 `origin` 对象转化成响应式的 Proxy 对象 `state`。
2. 把函数 `fn()` 作为一个响应式的 effect 函数。

首先我们来分析第一件事。

在 vue3 中使用了`Proxy`来代理对象，改写了对象的`setter`和`getter`操作，来实现依赖收集和响应触发。在初始化阶段，我们不详细说`setter`和`getter`的实现，先来看看`reactive`函数到底干了什么。

```typescript
export function reactive<T extends object>(target: T) {
  return createReactiveObject(target, handler)
}

export function createReactiveObject(target: object, handler: ProxyHandler<any>) {
  const observed = new Proxy(target, handler)
  return observed
}
```

可以看到`reactive`函数仅仅是将我们传入的对象用`Proxy`代理，并传入了`handler`。

让我们再来看看第二件事

当一个普通的函数 `fn()` 被 `effect()` 包裹之后，就会变成一个响应式的 effect 函数，而 `fn()` 也会被**立即执行一次**（设置为 lazy 的话不执行）,`fn`执行之后，如果有用到`Proxy`的对象，那么就会触发`getter`收集依赖。

这个`effect`也会被压入`effectStack`栈中，供后续调用。

```typescript
const effectStack: ReactiveEffect[] = []
let activeEffect: ReactiveEffect | undefined

export function effect<T = any>(fn: () => T) {
  const effect = createReactiveEffect(fn)
  effect()
  return effect
}

function createReactiveEffect<T = any>(fn: () => T): ReactiveEffect<T> {
  const effect = function reactiveEffect(): unknown {
    if (!effectStack.includes(effect)) {
      cleanup(effect) // effect 调用时会清除上一轮的依赖，防止本轮触发多余的依赖
      try {
        effectStack.push(effect) // 可能有 effect 中调用另一个 effect 的情况，模拟一个栈来处理
        activeEffect = effect
        // 立即执行一遍 fn()
        // fn() 执行过程会完成依赖收集，会用到 track
        return fn()
      } finally {
        // 完成依赖收集后从池子中扔掉这个 effect
        effectStack.pop()
        activeEffect = effectStack[effectStack.length - 1]
      }
    }
  } as ReactiveEffect
  effect.deps = [] // 收集对应的 dep，cleanup 时以找到 dep，从 dep 中清除 effect
  return effect
}
```

## 依赖收集阶段

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1619591046600-reacivity-2.jpeg)

这个阶段的触发时机，就是在 effect 被执行，其内部的 `fn()` 触发了 Proxy 对象的 getter 的时候。简单来说，只要执行到类似 `state.count` 的语句，就会触发 state 的 getter。

```typescript
const get = createGetter()

export const handler = {
  get,
}

function createGetter() {
  return function get(target: object, key: string | symbol, receiver: object): any {
    const res = Reflect.get(target, key, receiver)
    track(target, TrackOpTypes.GET, key)
    return isObject(res) ? reactive(res) : res
  }
}
```

我们看到 getter 里面调用了`track`函数进行依赖收集，`track`具体怎么工作的我们之后再说。

还有一个小细节是当访问的属性还是一个对象的时候，我们会递归的调用`reactive`函数，实现深层响应式。

在收集依赖阶段，我们需要收集一张“依赖收集表”，也就是图上的`targetMap`，key 为`Proxy`代理后的对象，value 为该对象对应的`depsMap`。

depsMap 是一个 Map，key 值为触发 getter 时的属性值（此处为 `count`），而 value 则是**触发过该属性值**所对应的各个 effect。

举个栗子：

```javascript
const state = reactive({
  count: 0,
  age: 18,
})

const effect1 = effect(() => {
  console.log("effect1: " + state.count)
})

const effect2 = effect(() => {
  console.log("effect2: " + state.age)
})

const effect3 = effect(() => {
  console.log("effect3: " + state.count, state.age)
})
```

这里的 targetMap 应该就是这样：

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1619591807637.png)

这样，`{ target -> key -> dep }` 的对应关系就建立起来了，依赖收集也就完成了。

我们来看看`track`是怎么实现的，

```typescript
export function track(target: object, type: TrackOpTypes, key: string | symbol) {
  if (activeEffect === undefined) {
    return
  }

  let depsMap = targetMap.get(target)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }

  let dep = depsMap.get(key)
  if (!dep) {
    depsMap.set(key, (dep = new Set()))
  }

  if (!dep.has(activeEffect)) {
    /*
    dep 到 effect 是为了 trigger 使用，
    而 effect 到 dep 是为了 effect 调用时找到依赖于这个 effect 所有 dep，
    从 dep 中删除这个调用过的 effect，用来清除上一轮的依赖，防止本轮触发多余的依赖 
    */
    dep.add(activeEffect)
    activeEffect.deps.push(dep)
  }
}
```

## 响应阶段

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1619592415768-reacivity-3.jpeg)

当修改对象的某个属性值的时候，会触发对应的 setter。

```typescript
const set = createSetter()

export const handler = {
  set,
}

function createSetter() {
  return function set(
    target: object,
    key: string | symbol,
    value: unknown,
    receiver: object,
  ): boolean {
    const hadKey = hasOwn(target, key)
    const oldValue = (target as any)[key]
    // 这里一定要先执行 set 后再 trigger，effect 中可能有操作依赖于 set 后的对象，先 set 能保证 effect 中的函数执行出正确的结果
    const result = Reflect.set(target, key, value, receiver)
    if (!hadKey) {
      trigger(target, TriggerOpTypes.ADD, key)
    } else if (value !== oldValue) {
      trigger(target, TriggerOpTypes.SET, key)
    }
    return result
  }
}
```

setter 里面的 trigger() 函数会从依赖收集表里找到当前属性对应的各个 dep，然后把它们推入到 `effects` 中，最后通过 `scheduleRun()` 挨个执行里面的 effect。

```typescript
export function trigger(target: object, type: TriggerOpTypes, key?: unknown) {
  const depsMap = targetMap.get(target)
  if (!depsMap) {
    return
  }
  // 需要新建一个 set，如果直接 const effect = depsMap.get(key)
  // effect 函数执行时 track 的依赖就也会在这一轮 trigger 执行，导致无限循环
  const effects = new Set<ReactiveEffect>()
  const add = (effectsToAdd: Set<ReactiveEffect> | undefined) => {
    if (effectsToAdd) {
      effectsToAdd.forEach(effect => {
        // 不要添加自己当前的 effect，否则之后 run（mutate）的时候
        // 遇到 effect(() => foo.value++) 会导致无限循环
        if (effect !== activeEffect) {
          effects.add(effect)
        }
      })
    }
  }
  // SET | ADD
  if (key !== undefined) {
    add(depsMap.get(key))
  }

  // iteration key on ADD | Map.SET
  switch (type) {
    case TriggerOpTypes.ADD:
      if (isArray(target) && isIntegerKey(key)) add(depsMap.get("length"))
  }
  // 简化版 scheduleRun，挨个执行 effect
  effects.forEach(effect => {
    effect()
  })
}
```

[完整代码](https://github.com/Cansiny0320/mini-vue3/tree/main/packages/reactivity/src)

## 小细节

### 多次触发 setter / getter

当代理对象是数组时，`push` 操作会触发多次 `set` 执行，同时，也引发 `get` 操作

```javascript
let data = [1, 2, 3]
let p = new Proxy(data, {
  get(target, key, receiver) {
    console.log("get value:", key)
    return Reflect.get(target, key, receiver)
  },
  set(target, key, value, receiver) {
    console.log("set value:", key, value)
    return Reflect.set(target, key, value, receiver)
  },
})

p.unshift("a")

// get value: unshift
// get value: length
// get value: 2
// set value: 3 3
// get value: 1
// set value: 2 2
// get value: 0
// set value: 1 1
// set value: 0 a
// set value: length 4
```

可以看到，在对数组做 `unshift` 操作时，会多次触发 `get` 和 `set` 。 仔细观察输出，不难看出，`get` 先拿数组最末位下标，开辟新的下标 `3` 存放原有的末位数值，然后再将原数值都往后挪，将 `0` 下标设置为了 `unshift` 的值 `a` ，由此引发了多次 `set` 操作。

而这对于 **通知外部操作** 显然是不利，我们假设 `set` 中的 `console` 是触发外界渲染的 `render` 函数，那么这个 `unshift` 操作会引发 **多次** `render` 。

我们来看看 vue3 是怎么解决这个问题的

```typescript
export const hasOwn = (val: object, key: string | symbol): key is keyof typeof val =>
  Object.prototype.hasOwnProperty.call(val, key)

function createSetter() {
  return function set(
    target: object,
    key: string | symbol,
    value: unknown,
    receiver: object,
  ): boolean {
    console.log(target, key, value)
    const hadKey = hasOwn(target, key)
    const oldValue = (target as any)[key]
    const result = Reflect.set(target, key, value, receiver)
    if (!hadKey) {
      console.log("trigger ... is a add OperationType")
      trigger(target, TriggerOpTypes.ADD, key)
    } else if (value !== oldValue) {
      console.log("trigger ... is a set OperationType")
      trigger(target, TriggerOpTypes.SET, key)
    }
    return result
  }
}
```

当改变数组长度的时候

```javascript
const state = reactive([1])
state.push(1)
```

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1619598102111.png)

`state.push(1)`触发了两次 set，一次是值本身`1`，一次是`length`属性改变。

当我们设置值本身的时候是一个 add 操作，`hasOwn(target, key)`显然返回 `false`，

而 length 是一个自身属性，`hasOwn(target, key)`返回`true`，且`oldvalue === value`,所以没有触发 trigger。

所以通过 **判断 key 是否为 target 自身属性，以及设置 val 是否跟 target[key]相等** 可以确定 `trigger` 的类型，并且避免多余的 `trigger`。

### 深度响应式

还有一个细节就是，`Proxy`只能代理一层，比如

```javascript
let data = { foo: "foo", bar: { key: 1 }, ary: ["a", "b"] }
let p = new Proxy(data, {
  get(target, key, receiver) {
    console.log("get value:", key)
    return Reflect.get(target, key, receiver)
  },
  set(target, key, value, receiver) {
    console.log("set value:", key, value)
    return Reflect.set(target, key, value, receiver)
  },
})

p.bar.key = 2

// get value: bar
```

执行代码，可以看到并没有触发 `set` 的输出，反而是触发了 `get` ，因为 `set` 的过程中访问了 `bar` 这个属性。 由此可见，`proxy` 代理的对象只能代理到第一层，而对象内部的深度侦测，是需要开发者自己实现的。同样的，对于对象内部的数组也是一样。

```javascript
p.ary.push("c")

// get value: ary
```

所以在 vue3 使用了递归的方式来实现深度响应式

```typescript
function createGetter() {
  return function get(target: object, key: string | symbol, receiver: object): any {
    const res = Reflect.get(target, key, receiver)
    track(target, TrackOpTypes.GET, key)
    return isObject(res) ? reactive(res) : res
  }
}
```

判断了`res`是否是一个对象，是对象的话就再走一遍`reactive`,并且会将这个对象存入`reactiveMap`中，提高性能。

```typescript
// 已经有了对应的 proxy
const existingProxy = reactiveMap.get(target)
if (existingProxy) {
  return existingProxy
}
```

## refs

[一张图理清 Vue 3.0 的响应式系统](https://juejin.cn/post/6844903959660855309)

[Vue3 中的数据侦测](https://juejin.cn/post/6844903957807169549)
