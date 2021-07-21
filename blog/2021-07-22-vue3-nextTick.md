---
slug: vue3-nextTick
title: vue3 nextTick 原理分析
author: Cansiny0320
author_title: 前端开发者
author_url: https://github.com/Cansiny0320
author_image_url: https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1618298366420-logo.jpg
tags: [JavaScript, SourceCode]
---

# vue3 nextTick 原理分析

## nextTick 的作用

官方的介绍是

> 将回调推迟到下一个 DOM 更新周期之后执行。在更改了一些数据以等待 DOM 更新后立即使用它。

在 vue 中数据发生变化后，dom 的更新是需要一定时间的，而我们在数据更新之后就立即去操作或者获取 dom 的话，其实还是操作和获取的未更新的 dom ，而我们可以调用 `nextTick` 拿到最新的 dom

<!--truncate-->

```js
import { createApp, nextTick } from "vue"

const app = createApp({
  setup() {
    const message = ref("Hello!")
    const changeMessage = async newMessage => {
      message.value = newMessage
      await nextTick()
      console.log("Now DOM is updated")
    }
  },
})
```

## 单元测试

我们先来阅读一下单测快速了解一下源码

`nextTick` 单元测试的目录位置：`packages/runtime-core/__tests__/scheduler.spec.ts`

### nextTick

```typescript
it("nextTick", async () => {
  const calls: string[] = []
  const dummyThen = Promise.resolve().then()
  const job1 = () => {
    calls.push("job1")
  }
  const job2 = () => {
    calls.push("job2")
  }
  nextTick(job1)
  job2()
  expect(calls.length).toBe(1)
  await dummyThen
  // job1 will be pushed in nextTick
  expect(calls.length).toBe(2)
  expect(calls).toMatchObject(["job2", "job1"])
})
```

`nextTick` 接收一个函数作为参数，加入到微任务队列，当宏任务执行完后，执行微任务队列中的函数，`job1` 执行

### queueJob

#### 基本用法

```typescript
it("basic usage", async () => {
  const calls: string[] = []
  const job1 = () => {
    calls.push("job1")
  }
  const job2 = () => {
    calls.push("job2")
  }
  queueJob(job1)
  queueJob(job2)
  expect(calls).toEqual([])
  await nextTick()
  expect(calls).toEqual(["job1", "job2"])
})
```

`queueJob` 接收一个函数作为参数，会将函数按顺序保存到一个队列中，它是一个微任务

#### 刷新时应按 job 的 ID 的升序插入 job

```typescript
it("should insert jobs in ascending order of job's id when flushing", async () => {
  const calls: string[] = []
  const job1 = () => {
    calls.push("job1")

    queueJob(job2)
    queueJob(job3)
  }

  const job2 = () => {
    calls.push("job2")
    queueJob(job4)
    queueJob(job5)
  }
  job2.id = 10

  const job3 = () => {
    calls.push("job3")
  }
  job3.id = 1

  const job4 = () => {
    calls.push("job4")
  }

  const job5 = () => {
    calls.push("job5")
  }

  queueJob(job1)

  expect(calls).toEqual([])
  await nextTick()
  expect(calls).toEqual(["job1", "job3", "job2", "job4", "job5"])
})
```

如果 `queueJob` 接收的函数有 `id` 属性的话，会按照 `id` 升序加入队列，不指定的话加入到最后

#### queueJob 会去重队列中的 job

```typescript
it("should dedupe queued jobs", async () => {
  const calls: string[] = []
  const job1 = () => {
    calls.push("job1")
  }
  const job2 = () => {
    calls.push("job2")
  }
  queueJob(job1)
  queueJob(job2)
  queueJob(job1)
  queueJob(job2)
  expect(calls).toEqual([])
  await nextTick()
  expect(calls).toEqual(["job1", "job2"])
})
```

`queueJob` 会将重复加入队列的 `job` 去重，应该是直接删除新加入的重复 `job`，这样可以保证顺序不变

#### 刷新时的 queueJob

```typescript
    it('queueJob while flushing', async () => {
      const calls: string[] = []
      const job1 = () => {
        calls.push('job1')
        // job2 will be executed after job1 at the same tick
        queueJob(job2)
      }
      const job2 = () => {
        calls.push('job2')
      }
      queueJob(job1)

      await nextTick()
      expect(calls).toEqual(['job1', 'job2'])
    })
  })
```

如果 `queueJob(job2)` 在 `job1` 内部调用，那么 `job2` 会在 `job1` 之后的同一时间执行，不会等到下一次微任务

### queuePreFlushCb

#### 基本用法

```typescript
it("basic usage", async () => {
  const calls: string[] = []
  const cb1 = () => {
    calls.push("cb1")
  }
  const cb2 = () => {
    calls.push("cb2")
  }

  queuePreFlushCb(cb1)
  queuePreFlushCb(cb2)

  expect(calls).toEqual([])
  await nextTick()
  expect(calls).toEqual(["cb1", "cb2"])
})
```

`queuePreFlushCb` 和 `queueJob` 类似，也是接收一个函数作为参数，按顺序地加入队列，在微任务队列执行

#### preFlushCb 会去重队列中的 preFlushCb

```typescript
it("should dedupe queued preFlushCb", async () => {
  const calls: string[] = []
  const cb1 = () => {
    calls.push("cb1")
  }
  const cb2 = () => {
    calls.push("cb2")
  }
  const cb3 = () => {
    calls.push("cb3")
  }

  queuePreFlushCb(cb1)
  queuePreFlushCb(cb2)
  queuePreFlushCb(cb1)
  queuePreFlushCb(cb2)
  queuePreFlushCb(cb3)

  expect(calls).toEqual([])
  await nextTick()
  expect(calls).toEqual(["cb1", "cb2", "cb3"])
})
```

`preFlushCb` 也会去重

#### 链式 queuePreFlushCb

```typescript
it("chained queuePreFlushCb", async () => {
  const calls: string[] = []
  const cb1 = () => {
    calls.push("cb1")
    // cb2 will be executed after cb1 at the same tick
    queuePreFlushCb(cb2)
  }
  const cb2 = () => {
    calls.push("cb2")
  }
  queuePreFlushCb(cb1)

  await nextTick()
  expect(calls).toEqual(["cb1", "cb2"])
})
```

如果 `queuePreFlushCb(job2)` 在 `cb1` 内部调用，那么 `cb2` 会在 `cb1` 之后的同一时间执行，不会等到下一次微任务

### queueJob with queuePreFlushCb

#### preFlushCb 中的 queueJob

```typescript
it("queueJob inside preFlushCb", async () => {
  const calls: string[] = []
  const job1 = () => {
    calls.push("job1")
  }
  const cb1 = () => {
    // queueJob in postFlushCb
    calls.push("cb1")
    queueJob(job1)
  }

  queuePreFlushCb(cb1)
  await nextTick()
  expect(calls).toEqual(["cb1", "job1"])
})
```

`preFlushCb` 中可以嵌套 `job` ，且 `job` 会立即执行

#### preFlushCb 中的 queueJob 和 preFlushCb

```typescript
it("queueJob & preFlushCb inside preFlushCb", async () => {
  const calls: string[] = []
  const job1 = () => {
    calls.push("job1")
  }
  const cb1 = () => {
    calls.push("cb1")
    queueJob(job1)
    // cb2 should execute before the job
    queuePreFlushCb(cb2)
  }
  const cb2 = () => {
    calls.push("cb2")
  }

  queuePreFlushCb(cb1)
  await nextTick()
  expect(calls).toEqual(["cb1", "cb2", "job1"])
})
```

`preFlushCb` 中嵌套的 `queuePreFlushCb` 会在嵌套的 `queueJob` 之前执行，即 `queuePreFlushCb` 优先级高于 `queueJob`

#### queueJob 中的 preFlushCb

```typescript
it("preFlushCb inside queueJob", async () => {
  const calls: string[] = []
  const job1 = () => {
    queuePreFlushCb(cb1)
    queuePreFlushCb(cb2)
    flushPreFlushCbs(undefined, job1)
    calls.push("job1")
  }
  const cb1 = () => {
    calls.push("cb1")
    // a cb triggers its parent job, which should be skipped
    queueJob(job1)
  }
  const cb2 = () => {
    calls.push("cb2")
  }
})
```

`job` 里可以嵌套 `queuePreFlushCb` ，如果在嵌套的 `cb` 中又调用了父 `job`，那么这次调用会被跳过

#### 在 postFlushCb 队列中的 preFlushCb

```typescript
it("queue preFlushCb inside postFlushCb", async () => {
  const cb = jest.fn()
  queuePostFlushCb(() => {
    queuePreFlushCb(cb)
  })
  await nextTick()
  expect(cb).toHaveBeenCalled()
})
```

`postFlushCb` 中可以嵌套 `queuePreFlushCb`，`queuePreFlushCb` 会立即执行

### queuePostFlushCb

#### 基本用法

```typescript
describe("queuePostFlushCb", () => {
  it("basic usage", async () => {
    const calls: string[] = []
    const cb1 = () => {
      calls.push("cb1")
    }
    const cb2 = () => {
      calls.push("cb2")
    }
    const cb3 = () => {
      calls.push("cb3")
    }

    queuePostFlushCb([cb1, cb2])
    queuePostFlushCb(cb3)

    expect(calls).toEqual([])
    await nextTick()
    expect(calls).toEqual(["cb1", "cb2", "cb3"])
  })
})
```

`queuePostFlushCb` 可以接收一个函数或一个函数数组作为参数，按顺序加入队列中，在微任务队列中执行

#### queuePostFlushCb 会去重队列中的 postFlushCb

```typescript
it("should dedupe queued postFlushCb", async () => {
  const calls: string[] = []
  const cb1 = () => {
    calls.push("cb1")
  }
  const cb2 = () => {
    calls.push("cb2")
  }
  const cb3 = () => {
    calls.push("cb3")
  }

  queuePostFlushCb([cb1, cb2])
  queuePostFlushCb(cb3)

  queuePostFlushCb([cb1, cb3])
  queuePostFlushCb(cb2)

  expect(calls).toEqual([])
  await nextTick()
  expect(calls).toEqual(["cb1", "cb2", "cb3"])
})
```

`queuePostFlushCb` 会去重队列中的函数，即使是通过数组传的函数，也会去重，应该是将数组拆开了

#### 刷新时 queuePostFlushCb

```typescript
it("queuePostFlushCb while flushing", async () => {
  const calls: string[] = []
  const cb1 = () => {
    calls.push("cb1")
    // cb2 will be executed after cb1 at the same tick
    queuePostFlushCb(cb2)
  }
  const cb2 = () => {
    calls.push("cb2")
  }
  queuePostFlushCb(cb1)

  await nextTick()
  expect(calls).toEqual(["cb1", "cb2"])
})
```

嵌套的 `queuePostFlushCb` 会立即执行

### queueJob with queuePostFlushCb

#### postFlushCb 内的 queueJob

```typescript
it("queueJob inside postFlushCb", async () => {
  const calls: string[] = []
  const job1 = () => {
    calls.push("job1")
  }
  const cb1 = () => {
    // queueJob in postFlushCb
    calls.push("cb1")
    queueJob(job1)
  }

  queuePostFlushCb(cb1)
  await nextTick()
  expect(calls).toEqual(["cb1", "job1"])
})
```

`postFlushCb` 中能嵌套 `queueJob`，`queueJob` 会立即执行

#### postFlushCb 内的 queueJob 和 postFlushCb

```typescript
it("queueJob & postFlushCb inside postFlushCb", async () => {
  const calls: string[] = []
  const job1 = () => {
    calls.push("job1")
  }
  const cb1 = () => {
    calls.push("cb1")
    queuePostFlushCb(cb2)
    // job1 will executed before cb2
    // Job has higher priority than postFlushCb
    queueJob(job1)
  }
  const cb2 = () => {
    calls.push("cb2")
  }

  queuePostFlushCb(cb1)
  await nextTick()
  expect(calls).toEqual(["cb1", "job1", "cb2"])
})
```

`queueJob` 比 `queuePostFlushCb` 先执行，即 `queueJob` 优先级高于 `queuePostFlushCb`

#### queueJob 内的 postFlushCb

```typescript
it("postFlushCb inside queueJob", async () => {
  const calls: string[] = []
  const job1 = () => {
    calls.push("job1")
    // postFlushCb in queueJob
    queuePostFlushCb(cb1)
  }
  const cb1 = () => {
    calls.push("cb1")
  }

  queueJob(job1)
  await nextTick()
  expect(calls).toEqual(["job1", "cb1"])
})
```

可以在 `job` 中嵌套 `queuePostFlushCb`，`queuePostFlushCb` 立即执行

#### queueJob 和 postFlushCb 在 queueJob 中

```typescript
it("queueJob & postFlushCb inside queueJob", async () => {
  const calls: string[] = []
  const job1 = () => {
    calls.push("job1")
    // cb1 will executed after job2
    // Job has higher priority than postFlushCb
    queuePostFlushCb(cb1)
    queueJob(job2)
  }
  const job2 = () => {
    calls.push("job2")
  }
  const cb1 = () => {
    calls.push("cb1")
  }

  queueJob(job1)
  await nextTick()
  expect(calls).toEqual(["job1", "job2", "cb1"])
})
```

`queueJob` 先于 `queuePostFlushCb` 执行，`queueJob` 优先级高于 `queuePostFlushCb`

#### 嵌套的 queueJob 与 postFlush

```typescript
it("nested queueJob w/ postFlushCb", async () => {
  const calls: string[] = []
  const job1 = () => {
    calls.push("job1")

    queuePostFlushCb(cb1)
    queueJob(job2)
  }
  const job2 = () => {
    calls.push("job2")
    queuePostFlushCb(cb2)
  }
  const cb1 = () => {
    calls.push("cb1")
  }
  const cb2 = () => {
    calls.push("cb2")
  }

  queueJob(job1)
  await nextTick()
  expect(calls).toEqual(["job1", "job2", "cb1", "cb2"])
})
```

在`job1` 中调用 `queueJob(job2)` ，`job2`中的 `queuePostFlushCb` 会在和 `queueJob(job2)` 同级的 `queuePostFlushCb` 执行后执行

#### 无效作业

```typescript
test("invalidateJob", async () => {
  const calls: string[] = []
  const job1 = () => {
    calls.push("job1")
    invalidateJob(job2)
    job2()
  }
  const job2 = () => {
    calls.push("job2")
  }
  const job3 = () => {
    calls.push("job3")
  }
  const job4 = () => {
    calls.push("job4")
  }
  // queue all jobs
  queueJob(job1)
  queueJob(job2)
  queueJob(job3)
  queuePostFlushCb(job4)
  expect(calls).toEqual([])
  await nextTick()
  // job2 should be called only once
  expect(calls).toEqual(["job1", "job2", "job3", "job4"])
})
```

`invalidateJob` 可以让一个 `job` 不执行

#### 根据 id 对作业进行排序

```typescript
test("sort job based on id", async () => {
  const calls: string[] = []
  const job1 = () => calls.push("job1")
  // job1 has no id
  const job2 = () => calls.push("job2")
  job2.id = 2
  const job3 = () => calls.push("job3")
  job3.id = 1

  queueJob(job1)
  queueJob(job2)
  queueJob(job3)
  await nextTick()
  expect(calls).toEqual(["job3", "job2", "job1"])
})
```

如果 `queueJob` 接收的函数有 `id` 属性的话，会按照 `id` 升序加入队列，不指定的话加入到最后

#### 根据 id 对 SchedulerCbs 进行排序

```typescript
test("sort SchedulerCbs based on id", async () => {
  const calls: string[] = []
  const cb1 = () => calls.push("cb1")
  // cb1 has no id
  const cb2 = () => calls.push("cb2")
  cb2.id = 2
  const cb3 = () => calls.push("cb3")
  cb3.id = 1

  queuePostFlushCb(cb1)
  queuePostFlushCb(cb2)
  queuePostFlushCb(cb3)
  await nextTick()
  expect(calls).toEqual(["cb3", "cb2", "cb1"])
})
```

如果 `queuePostFlushCb` 接收的函数有 `id` 属性的话，会按照 `id` 升序加入队列，不指定的话默认为`Infinity`加入到最后

#### 避免重复的 postFlushCb 调用

```typescript
test("avoid duplicate postFlushCb invocation", async () => {
  const calls: string[] = []
  const cb1 = () => {
    calls.push("cb1")
    queuePostFlushCb(cb2)
  }
  const cb2 = () => {
    calls.push("cb2")
  }
  queuePostFlushCb(cb1)
  queuePostFlushCb(cb2)
  await nextTick()
  expect(calls).toEqual(["cb1", "cb2"])
})
```

重复调用的 `postFlushCb` 不会执行

#### nextTick 应捕获调度程序刷新错误

```typescript
test("nextTick should capture scheduler flush errors", async () => {
  const err = new Error("test")
  queueJob(() => {
    throw err
  })
  try {
    await nextTick()
  } catch (e) {
    expect(e).toBe(err)
  }
  expect(
    `Unhandled error during execution of scheduler flush`,
  ).toHaveBeenWarned()

  // this one should no longer error
  await nextTick()
})
```

`nextTick` 会捕获错误

#### 默认情况下应防止自触发作业

```typescript
test("should prevent self-triggering jobs by default", async () => {
  let count = 0
  const job = () => {
    if (count < 3) {
      count++
      queueJob(job)
    }
  }
  queueJob(job)
  await nextTick()
  // only runs once - a job cannot queue itself
  expect(count).toBe(1)
})
```

默认情况下，`job` 不能递归调用自己

#### 应该允许明确标记的作业触发自身

```typescript
test("should allow explicitly marked jobs to trigger itself", async () => {
  // normal job
  let count = 0
  const job = () => {
    if (count < 3) {
      count++
      queueJob(job)
    }
  }
  job.allowRecurse = true
  queueJob(job)
  await nextTick()
  expect(count).toBe(3)

  // post cb
  const cb = () => {
    if (count < 5) {
      count++
      queuePostFlushCb(cb)
    }
  }
  cb.allowRecurse = true
  queuePostFlushCb(cb)
  await nextTick()
  expect(count).toBe(5)
})
```

如果将 `job` 或 `postFlushCb` 的 `allowRecurse` 属性指定为 `true`，那么它们可以递归调用自己

#### 应该防止重复队列

```typescript
test("should prevent duplicate queue", async () => {
  let count = 0
  const job = () => {
    count++
  }
  job.cb = true
  queueJob(job)
  queueJob(job)
  await nextTick()
  expect(count).toBe(1)
})
```

防止重复调用 `job`

#### flushPostFlushCbs

```typescript
test("flushPostFlushCbs", async () => {
  let count = 0

  const queueAndFlush = (hook: Function) => {
    queuePostFlushCb(hook)
    flushPostFlushCbs()
  }

  queueAndFlush(() => {
    queueAndFlush(() => {
      count++
    })
  })

  await nextTick()
  expect(count).toBe(1)
})
```

`flushPostFlushCbs` 会让 `queuePostFlushCb` 中的递归只执行一次

#### 不运行 stopped reactive effects

```typescript
test("should not run stopped reactive effects", async () => {
  const spy = jest.fn()

  // simulate parent component that toggles child
  const job1 = () => {
    // @ts-ignore
    job2.active = false
  }
  // simulate child that's triggered by the same reactive change that
  // triggers its toggle
  const job2 = () => spy()
  expect(spy).toHaveBeenCalledTimes(0)

  queueJob(job1)
  queueJob(job2)
  await nextTick()

  // should not be called
  expect(spy).toHaveBeenCalledTimes(0)
})
```

如果 `job` 的 `active` 属性为 `false`，那么 `job` 不会被执行

### 小结

- `queueJob` 接收一个函数 `job` 作为参数，若 `job` 设置了 `id` ，那么按 `id`升序排序，否则按顺序保存到一个队列中，会去除重复的 `job`，`job1` 中嵌套的 `job2` 会立即执行
- `queuePreFlushCb` 接收一个函数 `cb` 作为参数，其他性质和 `queueJob` 相同
- `queuePostFlushCb` 接收一个函数 `cb` 或一个函数数组 `cbs` 作为参数，其他性质和 `queueJob` 相同
- `queuePreFlushCb` 、 `queueJob` 、 `queuePostFlushCb` 可以互相调用，且会立即执行
- 如果在嵌套的 `preFlushCb` 中又调用了父 `job`，那么这次调用会被跳过
- 在`job1` 中调用 `queueJob(job2)` ，`job2`中的 `queuePostFlushCb` 会在和 `queueJob(job2)` 同级的 `queuePostFlushCb` 执行后执行
- `invalidateJob` 可以让一个 `job` 不执行
- `nextTick` 会捕获错误
- 默认情况下不允许递归的`job`等，除非指定了 `allowRecurse` 为 `true`
- `flushPostFlushCbs` 会让 `queuePostFlushCb` 中的递归只执行一次
- 优先级：`queuePreFlushCb` > `queueJob` > `queuePostFlushCb`
- 如果 `job` 的 `active` 属性为 `false`，那么 `job` 不会被执行

## 源码解析

### 数据结构

被调度的任务的数据结构 `SchedulerJob`

```typescript
export interface SchedulerJob extends Function {
  id?: number
  active?: boolean
  computed?: boolean
  allowRecurse?: boolean
  ownerInstance?: ComponentInternalInstance
}
```

- `id` ：让任务保持唯一性，队列中的任务按 `id` 升序排序
- `active` ：任务是否执行
- `computed` ：
- `allowRecurse` : 是否允许递归调用自身
- `ownerInstance` ：

需要调度的任务队列 `queue`

```typescript
const queue: SchedulerJob[] = []
```

两类四种回调函数的数据结构

```typescript
// 异步任务队列中任务执行前的回调函数队列
const pendingPreFlushCbs: SchedulerJob[] = []
let activePreFlushCbs: SchedulerJob[] | null = null
let preFlushIndex = 0

// 异步任务队列中任务执行完成后的回调函数队列
const pendingPostFlushCbs: SchedulerJob[] = []
let activePostFlushCbs: SchedulerJob[] | null = null
let postFlushIndex = 0
```

### nextTick

```typescript
export function nextTick<T = void>(
  this: T,
  fn?: (this: T) => void,
): Promise<void> {
  const p = currentFlushPromise || resolvedPromise
  return fn ? p.then(this ? fn.bind(this) : fn) : p
}
```

为了方便理解，我们可以将代码简化一下

```typescript
const p = Promise.resolve()
export function nextTick(fn?: () => void): Promise<void> {
  return fn ? p.then(fn) : p
}
```

其实就是用 `Promise.resolve().then` 将 `fn` 转换成一个微任务，加入微任务队列

### queueJob 入队异步任务

```typescript
export function queueJob(job: SchedulerJob) {
  if (
    (!queue.length ||
      !queue.includes(
        job,
        isFlushing && job.allowRecurse ? flushIndex + 1 : flushIndex,
      )) &&
    job !== currentPreFlushParentJob
  ) {
    if (job.id == null) {
      queue.push(job)
    } else {
      queue.splice(findInsertionIndex(job.id), 0, job)
    }
    queueFlush()
  }
}
```

在默认情况下，搜索的起始位置为当前任务，即不允许递归调用和重复添加

当 `job.allowRecurse` 的值为 `true` 时，将搜索起始位置加一，无法搜索到自身，也就是允许递归调用了。

然后根据有无 `job.id` 属性判断把任务放到最后还是按 `id` 升序排序，保证了队列刷新时任务能按照 `id` 升序正确排序

最后调用 `queueFlush()` 处理队列

### queuePreFlushCb / queuePostFlushCb 处理回调

```typescript
export function queuePreFlushCb(cb: SchedulerJob) {
  queueCb(cb, activePreFlushCbs, pendingPreFlushCbs, preFlushIndex)
}

export function queuePostFlushCb(cb: SchedulerJobs) {
  queueCb(cb, activePostFlushCbs, pendingPostFlushCbs, postFlushIndex)
}
```

可以看到`queuePreFlushCb`和`queuePostFlushCb`其实是对`queueCb`的封装。它们之间的区别仅有传递进去的参数的不同。下面我们来看一下 `queueCb` 这个函数：

```typescript
function queueCb(
  cb: SchedulerJobs,
  activeQueue: SchedulerJob[] | null,
  pendingQueue: SchedulerJob[],
  index: number,
) {
  if (!isArray(cb)) {
    if (
      !activeQueue ||
      !activeQueue.includes(cb, cb.allowRecurse ? index + 1 : index)
    ) {
      pendingQueue.push(cb)
    }
  } else {
    pendingQueue.push(...cb)
  }
  queueFlush()
}
```

入队的逻辑和异步任务的处理基本上是一致的。一方面做了去重，另一方面依照配置处理了递归的逻辑。
另外的，如果回调是一个数组，它会是组件的生命周期钩子函数。这组函数仅可被异步任务调用，且已经完成去重了。所以这里直接将数组拉平为一维，推入 `pendingQueue` 中。这部分是 `Vue` 自身的设计。

### queueFlush 推入微任务队列

入队完成后，我们纠结着需要开始处理异步任务了。我们先来看两个全局变量，它们控制着刷新逻辑：

```typescript
let isFlushing = false
let isFlushPending = false
```

在这里，如果没有正在等待或正在执行的任务，我们就会将 `flushJobs` 塞入引擎的微任务队列：

```typescript
const resolvedPromise: Promise<any> = Promise.resolve()
let currentFlushPromise: Promise<void> | null = null

function queueFlush() {
  if (!isFlushing && !isFlushPending) {
    isFlushPending = true
    currentFlushPromise = resolvedPromise.then(flushJobs)
  }
}
```

通过这样的设计，确保了你可以在一个 `tick` 内可以多次添加任务。同时引擎在执行完主调用栈的函数后，一定会调用一次微任务队列中的 `flushJobs`。

### flushJobs 处理异步任务

我们之前通过

```typescript
resolvedPromise.then(flushJobs)
```

将`flushJobs`加入到了微任务队列，那么`flushJobs`就会在引擎处理下一个微任务队列时执行

首先看一下回调的处理时机：

```typescript
type CountMap = Map<SchedulerJob | SchedulerCb, number>
function flushJobs(seen?: CountMap) {
  isFlushPending = false
  isFlushing = true
  // ...
  flushPreFlushCbs(seen)

  // 处理异步任务

  flushPostFlushCbs(seen)
  isFlushing = false
}
```

事实上就是通过这两个函数，分别执行回调函数队列的。

另外的，在实际处理异步任务队列前，我们还需要对任务队列做一次排序，使队列的任务按 `id` 升序排序

```typescript
const getId = (job: SchedulerJob): number =>
  job.id == null ? Infinity : job.id!
function flushJobs(seen?: CountMap) {
  flushPreFlushCbs(seen)
  queue.sort((a, b) => getId(a) - getId(b))
  // 处理异步任务
}
```

这么做的原因有二，源码上的注释是这么说的：

> Sort queue before flush.
>
> This ensures that:
>
> 1. Components are updated from parent to child. (because parent is always created before the child so its render effect will have smaller priority number)
> 2. If a component is unmounted during a parent component's update,its update can be skipped.

翻译一下，主要是为了确保两点：

- 组件更新顺序是从父组件到子组件（因为父组件总是先于子组件创建，那么父组件有更小的 `id`，即更高的优先级）
- 如果一个组件在其父组件的更新过程中被卸载，它的更新可以被跳过

现在让我们来看看异步任务处理的部分

主要代码如下：

```typescript
for (flushIndex = 0; flushIndex < queue.length; flushIndex++) {
  const job = queue[flushIndex]
  if (job && job.active !== false) {
    callWithErrorHandling(job, null, ErrorCodes.SCHEDULER)
 }
```

遍历队列，并执行这些任务

另外有些异步任务在执行的时候也会添加新的异步任务进去，那么我们就将它们也执行完

```typescript
if (queue.length || pendingPreFlushCbs.length || pendingPostFlushCbs.length) {
  flushJobs(seen)
}
```

### flushPreFlushCbs 处理异步任务前时的回调

```typescript
export function flushPreFlushCbs(
  seen?: CountMap,
  parentJob: SchedulerJob | null = null,
) {
  if (pendingPreFlushCbs.length) {
    currentPreFlushParentJob = parentJob
    activePreFlushCbs = [...new Set(pendingPreFlushCbs)]
    pendingPreFlushCbs.length = 0

    for (
      preFlushIndex = 0;
      preFlushIndex < activePreFlushCbs.length;
      preFlushIndex++
    ) {
      activePreFlushCbs[preFlushIndex]()
    }
    activePreFlushCbs = null
    preFlushIndex = 0
    currentPreFlushParentJob = null
    // recursively flush until it drains
    flushPreFlushCbs(seen, parentJob)
  }
}
```

逻辑很清楚，就是遍历 `activePreFlushCbs` 队列，依次执行函数。
注意最后递归调用了 `flushPreFlushCbs` 函数，用来处理递归。在递归的过程中，可能会改变队列，所以我们在正式处理前，拷贝了一份队列的副本：

```typescript
activePreFlushCbs = [...new Set(pendingPreFlushCbs)]
```

### flushPostFlushCbs 处理异步任务处理完成后的回调

```typescript
export function flushPostFlushCbs(seen?: CountMap) {
  if (pendingPostFlushCbs.length) {
    const deduped = [...new Set(pendingPostFlushCbs)]
    pendingPostFlushCbs.length = 0

    // #1947 already has active queue, nested flushPostFlushCbs call
    if (activePostFlushCbs) {
      activePostFlushCbs.push(...deduped)
      return
    }

    activePostFlushCbs = deduped

    activePostFlushCbs.sort((a, b) => getId(a) - getId(b))

    for (
      postFlushIndex = 0;
      postFlushIndex < activePostFlushCbs.length;
      postFlushIndex++
    ) {
      activePostFlushCbs[postFlushIndex]()
    }
    activePostFlushCbs = null
    postFlushIndex = 0
  }
}
```

`flushPostFlushCbs` 和 `flushPreFlushCbs` 逻辑大同小异，`flushPostFlushCbs` 其中还会处理嵌套的情况,让嵌套的函数执行一次

```typescript
if (activePostFlushCbs) {
  activePostFlushCbs.push(...deduped)
  return
}
```

也就是这个用例

```typescript
// #1947 flushPostFlushCbs should handle nested calls
// e.g. app.mount inside app.mount
test("flushPostFlushCbs", async () => {
  let count = 0

  const queueAndFlush = (hook: Function) => {
    queuePostFlushCb(hook)
    flushPostFlushCbs()
  }

  queueAndFlush(() => {
    queueAndFlush(() => {
      count++
    })
  })

  await nextTick()
  expect(count).toBe(1)
})
```

另外的，在 `flushJob` 函数调用 `flushPostFlushCbs` 函数后，还将 `isFlushing` 重置为了 `false`。这是为了处理新添加的异步任务。如果有的话，`flushJob` 会继续递归，直到处理完所有的异步任务。

```typescript
flushPostFlushCbs(seen)
isFlushing = false
```

## 总结

总的来说 `nextTick` 的实现主要利用了

- 利用`Promise.resolve().then()`将任务推入 `Micro Task Queue` ，借助引擎的 `Event Loop` 机制处理队列中的任务
- 处理异步任务与回调，对于新添加的异步任务也递归的处理完成。这与引擎处理 `Task Queue` 的逻辑是一致的

## refs

[Vue3 源码解析：nextTick](https://juejin.cn/post/6844904016112009223)

[Vue3 源码阅读笔记（六）—— nextTick 与调度器](https://www.bebopser.com/2021/01/22/vue3source6/)
