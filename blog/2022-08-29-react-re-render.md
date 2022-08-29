---
slug: react-re-render
title: [译]React 中的 re-render
author: Cansiny0320
author_title: 前端开发者
author_url: https://github.com/Cansiny0320
author_image_url: https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1618298366420-logo.jpg
image: https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1613645877253.png
description: 介绍 React 中的 re-render 的概念以及如何防止 re-render 的方法。
tags: ['react', '性能优化', '翻译']
---

介绍 React 中的 re-render 的概念以及如何防止 re-render 的方法。

<!--truncate-->

原文：https://www.developerway.com/posts/react-re-renders-guide

## 什么是 React 中的 re-render？

当我们谈论 React 的性能的时候，有两个主要的阶段需要我们关注：

- **初始渲染** - 发生在组件第一次出现在屏幕上时
- **重新渲染 (re-render)** - 已经在屏幕上的组件的第二次和任何连续渲染

re-render 发生在 React 需要用新的数据去更新 app 的时候。通常是用户操作、异步请求返回数据或者是订阅数据发生变化产生的结果。

没有任何异步数据更新的不可交互的应用，永远不会 re-render，因此不需要关心 re-render 性能优化。

### 🧐 什么是必要的和不必要的 re-render？

**必要的 re-render** - 对发生变化的组件或直接使用新信息的组件进行 re-render。例如，用户输入的时候，input 组件和使用了该 state 的组件需要在每次输入时更新，即 re-render。

**不必要的 re-render** - 对不依赖变化的 state 的组件进行 re-render。例如，用户输入的时候，整个页面都 re-render 了，那么这就是不必要的 re-render。

对于组件自身不必要的 re-render **不是问题**：React 的速度非常快，通常能够在用户没有注意到的情况下处理它们。

然而，如果 re-render 发生得太频繁且发生在非常“重”的组件中，这可能会导致交互都出现延迟，甚至应用程序变得完全没有响应。

## 什么时候 React 组件会 re-render？

这有四个原因为什么组件会 re-render：state 改变、父（或子）组件 re-render、context 改变和 hooks 改变。

还有一个反直觉结论：当 props 改变时，组件会 re-render，就其自己而言，这不完全正确，下面会进行解释。

### 🧐 Re-renders 原因：state 改变

当一个组件的 state 改变时，它会 re-render 它自己。通常发生在 callback 或 `useEffect` 中。

state 改变是所有 re-render 的根因。

[🌰 例子](https://codesandbox.io/s/part2-1-re-renders-because-of-state-ngh8uc?file=/src/App.tsx)

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1661437226714.png)

### 🧐 Re-renders 原因：父组件 re-render

组件会 re-render 如果它的父组件发生了 re-render。换个角度说，如果一个组件发生了 re-render，它所有的子组件都会 re-render

子组件的 re-render 不会触发父组件的 re-render（这里有一些注意事项和一些边界情况，详情查看 [The mystery of React Element, children, parents and re-renders](https://www.developerway.com/posts/react-elements-children-parents)）

[🌰 例子](https://codesandbox.io/s/part-2-2-re-renders-because-of-parent-b0xvxt?file=/src/App.tsx)

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1661437659789.png)

### 🧐 Re-renders 原因：context 改变

当 Context Provider 中的值发生变化时，**所有**使用了这个 context 的组件都会 re-render，即使他们没有直接使用变化的数据。这些组件的 re-render 不能直接通过缓存阻止，但是有一些解决方法可以。（查看）

[🌰 例子](https://codesandbox.io/s/part-2-3-re-render-because-of-context-i75lwh?file=/src/App.tsx)

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1661600199403.png)

### 🧐 Re-renders 原因：hooks 改变

在 hooks 里发生的一切都 "属于 "使用它的组件。context 和 state 变化的 re-render 规则在这同样适用：

- hook 里面的 state change 会触发 re-render。
- 如果 hooks 中使用了 context 并且 context 改变了，也会触发 re-render。

hooks 可以链式调用。每个在调用链中的独立 hook 依旧属于调用 hook 的组件，适用上面的规则。

[🌰 例子](https://codesandbox.io/s/part-2-4-re-render-because-of-hooks-5kpdrp?file=/src/App.tsx)

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1661601807592.png)

### ⛔️ Re-renders 原因：props changes （惊人的事实）

在谈论没有缓存的组件的 re-render 时，组件的 props 是否改变并不重要。

props 的改变依托于父组件的更新。这意味着父组件会发生 re-render，所以不管 props 是否改变，子组件都会 re-render。

[🌰 例子](https://codesandbox.io/s/part-2-5-re-render-props-not-relevant-2b8o0p?file=/src/App.tsx)

只有当使用缓存时（`React.memo`, `useMemo`），props 的改变才变得重要。

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1661605450369.png)

## 通过组合防止 re-render

### ⛔️ 错误的做法：在 render 函数中创建组件

在另一个组件的渲染函数内创建组件是一种错误的做法，非常影响性能。每次 re-render React 都会 re-mount 这个组件（即先销毁再重新创建），这将比正常的 re-rerender 慢得多。除此之外，这还会导致诸如以下的错误：

- re-render 过程中可能会出现内容的闪现。
- 每次 re-render 组件的 state 都会被重置
- 没有依赖项的 useEffect 每次 re-render 时都会被触发
- 组件会丢失 focus 状态

[🌰 例子](https://codesandbox.io/s/part-3-1-creating-components-inline-t2vmkj?file=/src/App.tsx)

另外的一些资料：[How to write performant React code: rules, patterns, do's and don'ts](https://www.developerway.com/posts/how-to-write-performant-react-code)

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1661606463349.png)

### ✅ 通过组合防止 re-render：状态下移

当一个复杂组件里的某个 state，且这个 state 只用于一小部分时，这种做法是有利的。一个典型的例子是一个复杂组件中通过一个 button 控制 diglog 组件的开/关状态。

在这种情况下，控制 diglog 显隐的状态、diglog 本身和触发更新的按钮可以被封装在一个较小的组件中。这样，大组件不会在这些状态变化时 re-render。

[🌰 例子](https://codesandbox.io/s/part-3-2-moving-state-down-vlh4gf?file=/src/App.tsx)

另外的一些资料：[The mystery of React Element, children, parents and re-renders](https://www.developerway.com/posts/react-elements-children-parents), [How to write performant React code: rules, patterns, do's and don'ts](https://www.developerway.com/posts/how-to-write-performant-react-code)

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1661607302132.png)

## ✅ 通过组合防止 re-render：children 作为 props

这种做法和“状态下移”类似：它将状态变化封装在一个较小的组件中。这里的不同之处在于，状态用于渲染得慢的元素，不太容易提取它。一个典型的例子是连接到一个组件的根元素的 onScroll 或 onMouseMove 回调。

在这种情况下，可以将状态管理和使用该状态的组件提取到更小的组件中，并且“慢”组件可以作为子组件传递给它。从小组件的角度来看，`children` 只是 props，不会被 state 改变影响，因此不会 re-render。

[🌰 例子](https://codesandbox.io/s/part-3-3-children-as-props-59icyq?file=/src/App.tsx)

另外的一些资料：[The mystery of React Element, children, parents and re-renders](https://www.developerway.com/posts/react-elements-children-parents)

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1661608073989.png)

## ✅ 通过组合防止 re-render：组件作为 props

与之前的做法差不多：将状态封装在一个较小的组件中，而重组件作为 props 传递给它。props 不受 state 变化的影响，因此重组件不会 re-render。

当一些重组件独立于状态，但不能作为一个`children`提取时，它可能很有用。

在此阅读更多关于将组件作为 props 传递的信息：[ React component as prop: the right way™️](https://www.developerway.com/posts/react-component-as-prop-the-right-way)

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1661608457206.png)

## 通过 React.memo 防止 re-render

用 `React.memo` 包裹组件会阻止因为父组件 re-render 导致的子组件 re-render，除非 props 有变化。

这在渲染不依赖于重新渲染源（即状态、更改的数据）的重组件时很有用。

[🌰 例子](https://codesandbox.io/s/part-4-simple-memo-fz4xhw?file=/src/App.tsx)

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1661758477379.png)

### ✅ React.memo: 需要 props 的组件

**所有**不是基本类型的值都需要缓存，来让 React.memo 可以正常工作。

[🌰 例子](https://codesandbox.io/s/part-4-1-memo-on-component-with-props-fq55hm?file=/src/App.tsx)

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1661758662516.png)

### ✅ React.memo: 组件作为 props 或 children

使用 `React.memo` 的元素必须作为 props 或 children。 缓存父组件将不起作用：children 和 props 是对象，因此它们会随着每次 re-render 改变。

[🌰 例子](https://codesandbox.io/s/part-4-2-memo-on-components-in-props-55tebl?file=/src/App.tsx)

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1661758879777.png)

## 使用 useMemo/useCallback 提升 re-render 性能

### ⛔️ 错误的做法：不必要的对 props 使用 useMemo/useCallback

在父组件内缓存 props 并不能阻止子组件的 re-render。如果父组件 re-render，不管 props 是否改变，子组件都会被重新渲染。

[🌰 例子](https://codesandbox.io/s/part-5-1-unnecessary-usememo-lmk8fq?file=/src/App.tsx)

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1661759287242.png)

### ✅ 必要的 useMemo/useCallback

如果子组件使用了 `React.memo` 包裹，所有不是基本类型的 props 都应该被缓存。

[🌰 例子](https://codesandbox.io/s/part-5-2-usememo-in-props-trx97x?file=/src/App.tsx)

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1661759493906.png)

如果一个组件在 `useEffect`、`useMemo`、`useCallback`，这些 hooks 的依赖项中添加了非原始值的依赖，那么这些依赖需要被缓存。

[🌰 例子](https://codesandbox.io/s/part-5-2-usememo-in-effect-88tbov)

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1661759697836.png)

### ✅ 对于昂贵计算使用 useMemo

`useMemo` 的使用情况之一是避免每次 re-render 时进行昂贵的计算。

使用 `useMemo` 有它自己的一些成本（消耗一些内存并使初始渲染稍慢），所以它不应该被用于每次计算。在 React 中，在大多数情况下，挂载和更新组件将是最昂贵的计算。（除非你在做一些不应该在前端做的事，比如计算素数）

因此，useMemo 的典型用例是缓存 React 元素。与组件更新相比，“纯” javascript 操作（如排序或过滤数组）的成本通常可以忽略不计。

[🌰 例子](https://codesandbox.io/s/part-5-3-usememo-for-expensive-calculations-trx97x?file=/src/App.tsx)

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1661767311283.png)

## 提升 list 的 re-render 性能

除了常规的 re-render，key 属性会影响 React 中列表的性能。

**重要**：仅提供 `key` 属性不会提高列表的性能。为了防止 re-render 列表，你需要将它们包装在 `React.memo` 中并遵循其所有最佳实践。

`key` 值应该是一个不变且唯一的 string，通常是列表元素的 `id` 或者 `index`。

如果列表是**静态**的，使用 `index` 作为 key 是可以的。即列表元素不会增删，插入和排序。

在动态列表中使用 index 作为 key 会导致：

- 如果元素具有状态或任何不受控制的元素（如表单输入），则会出现错误
- 如果元素包装在 React.memo 中，性能会下降

更多资料：[React key attribute: best practices for performant lists.](https://www.developerway.com/posts/react-key-attribute)

[🌰 静态列表例子](https://codesandbox.io/s/part-6-static-list-with-index-and-id-as-key-7i0ebi?file=/src/App.tsx)

[🌰 动态列表例子](https://codesandbox.io/s/part-6-dynamic-list-with-index-and-id-as-key-s50knr?file=/src/App.tsx)

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1661769599325.png)

## 防止由于 context 的 re-render

### ✅ 防止由于 context 的 re-render: 缓存 Provider value

如果 Context Provider 不是放在 app 的根节点，并且由于其祖先的更改，它可能会重新渲染自身，则应该缓存它的值。

[🌰 例子](https://codesandbox.io/s/part-7-1-memoize-context-provider-value-qgn0me?file=/src/App.tsx)

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1661769872927.png)

### ✅ 防止由于 context 的 re-render: 分离数据和 API

如果在 context 中把数据和 API（getters 和 setters）放在一起，则它们可以拆分成不同的 Provider。这样，使用 API 的组件仅在数据更改时不会 re-render。

更多资料：[How to write performant React apps with Context](https://www.developerway.com/posts/how-to-write-performant-react-apps-with-context)

[🌰 例子](https://codesandbox.io/s/part-7-2-split-context-data-and-api-r8lsws?file=/src/App.tsx)

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1661770164579.png)

### ✅ 防止由于 context 的 re-render: 数据分块

如果 Context 管理一些独立的数据块，它们可以被拆分为同一个 Provider 下的更小的 Providers。这样，只有更改块的 consumers 才会 re-render。

[🌰 例子](https://codesandbox.io/s/part-7-3-split-context-into-chunks-dbg20m?file=/src/App.tsx)

### ✅ 防止由于 context 的 re-render：Context selectors

没有办法阻止使用部分 Context 值的组件重新渲染，即使使用的数据没有更改，即使使用 `useMemo` 也是如此。

然而可以使用高阶组件和 `React.memo` 来伪造 Context selector。

更多资料：[Higher-Order Components in React Hooks era](https://www.developerway.com/posts/higher-order-components-in-react-hooks-era)

[🌰 例子](https://codesandbox.io/s/part-7-4-context-selector-lc8n5g?file=/src/App.tsx)

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1661770601981.png)
