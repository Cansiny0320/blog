---
slug: ts-type-gymnastics
title: TypeScript 类型体操
author: Cansiny0320
author_title: 前端开发者
author_url: https://github.com/Cansiny0320
author_image_url: https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1618298366420-logo.jpg
image: https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1613645877253.png
description: TypeScript 类型体操
tags: []
---

<!--truncate-->

# TypeScript 类型体操通关秘籍

本文章例子，大部分可在`https://github.com/type-challenges/type-challenges`找到

可在中`https://github.com/Cansiny0320/type-challenges-solutions`查看题解

## 套路一 模式匹配做提取

关键点：`infer`

`infer`关键字定义一个变量，然后在`?:`二元表达式为`true `的情况中使用

> TIPS：extends 可以用来限定类型

### 数组类型

**[First](https://github.com/type-challenges/type-challenges/tree/master/questions/14-easy-first)**

取出数组的第一个元素的类型

```typescript
type GetFirst<Arr extends unknown[]> = Arr extends [infer First, ...unknown[]] ? First : never
```

注意，这里我们用`unknown[]`来代表剩余的数组，不用`...infer Rest[]`再定义一个变量

**[Last](https://github.com/type-challenges/type-challenges/tree/master/questions/15-medium-last)**

取出数组的最后一个元素的类型

```typescript
type GetLast<Arr extends unknown[]> = Arr extends [...unknown[], infer Last] ? Last : never
```

**[pop](https://github.com/type-challenges/type-challenges/tree/master/questions/16-medium-pop)**

取去掉了最后一个元素的数组

```typescript
type Pop<Arr extends unknown[]> = Arr extends [...infer Rest, unknown] ? Rest : Arr
```

**[Shift](https://github.com/type-challenges/type-challenges/tree/master/questions/3062-medium-shift)**

```typescript
type Shift<T extends unknown[]> = T extends [unknown, ...infer Rest] ? Rest : T
```

### 字符串类型

字符串类型的提取和数组大同小异，也是利用`infer`取出需要的部分

**[StartsWith](https://github.com/type-challenges/type-challenges/tree/master/questions/2688-medium-startswith)**

```typescript
type StartsWith<Str extends string, Prefix extends string> = Str extends `${Prefix}${string}`
  ? true
  : false
```

**[Replace](https://github.com/type-challenges/type-challenges/tree/master/questions/116-medium-replace)**

```typescript
type Replace<Str extends string, From extends string, To extends string> = From extends ''
  ? Str
  : Str extends `${infer Prefix}${From}${infer Suffix}`
  ? `${Prefix}${To}${Suffix}`
  : Str
```

这里我们特殊判断一下`From`是否为空字符串，如果是，就直接返回`Str`，避免出现 `Replace<'foobarbar', '', 'foo'>`这样的情况

**[Trim](https://github.com/type-challenges/type-challenges/tree/master/questions/108-medium-trim)**

```typescript
type Space = ' ' | '\n' | '\t'

type TrimLeft<Str extends string> = Str extends `${Space}${infer Rest}` ? TrimLeft<Rest> : Str
type TrimRight<Str extends string> = Str extends `${infer Rest}${Space}` ? TrimRight<Rest> : Str
type Trim<Str extends string> = TrimLeft<TrimRight<Str>>
```

因为不知道有多少个空白符，所以这里我们利用了递归（类型也可以递归，很强大）

### 函数

函数同样也可以做类型匹配，比如提取参数、返回值的类型。

**[GetParameters](https://github.com/type-challenges/type-challenges/tree/master/questions/3312-easy-parameters)**

获取参数的类型

```typescript
type GetParameters<T extends Function> = T extends (...args: infer P) => unknown ? P : never
```

**[GetReturnType](https://github.com/type-challenges/type-challenges/tree/master/questions/2-medium-return-type)**

```typescript
type GetReturnType<Func extends Function> = Func extends (...args: any[]) => infer P ? P : never
```

参数类型可以是任意类型，也就是 any[]（注意，这里不能用 unknown，因为参数类型是要赋值给别的类型的，而 unknown 只能用来接收类型，所以用 any）

## 套路二 重新构造做变换

#### 数组类型

**[Push](https://github.com/type-challenges/type-challenges/tree/master/questions/3057-easy-push)**

给数组添加元素

```typescript
type Push<Arr extends unknown[], Ele> = [...Arr, Ele]
```

同理也可以实现`Unshift`

```typescript
type Unshift<Arr extends unknown[], Ele> = [Ele, ...Arr]
```

**[Zip](https://github.com/type-challenges/type-challenges/tree/master/questions/4471-medium-zip)**

我们需要实现如下功能：

```typescript
type exp = Zip<[1, 2], [true, false]> // expected to be [[1, true], [2, false]]
```

因为不确定元组的长度，所以这里我们用了递归

每次取出第一个元素出来合并，剩下的递归合并

```typescript
type Zip<One extends unknown[], Other extends unknown[]> = One extends [
  infer OneFirst,
  ...infer OneRest
]
  ? Other extends [infer OtherFirst, ...infer OtherRest]
    ? [[OneFirst, OtherFirst], ...Zip<OneRest, OtherRest>]
    : []
  : []
```

### 字符串类型

**[Capitalize](https://github.com/type-challenges/type-challenges/tree/master/questions/110-medium-capitalize)**

将字符串的首字母转换为大写

```typescript
type MyCapitalize<S extends string> = S extends `${infer First}${infer Rest}`
  ? `${Uppercase<First>}${Rest}`
  : S
```

`Uppercase`是 TS 内置的高级类型，可以把字符串的字母转为大写

**[CamelCase](https://github.com/type-challenges/type-challenges/tree/master/questions/114-hard-camelcase)**

将`HELLO_WORLD_WITH_TYPES`变为`helloWorldWithTypes`

同样的，这里我们也不知道有多少个`_world`，所以这里我们用递归

首先我们找出需要递归的部分，也就是第一个`_`后的部分

递归继续的条件是字符串满足`a_b`，那么就把第一个`_`前的部分定义为`First`，`_`后的部分定义为`Rest`，然后用内置函数`Lowercase`将`First`转为小写，把`Rest`作为参数传给`CamelCase`递归调用，这里要把结果用`Capitalize`函数首字母大写

否则，就返回小写的字符串

```typescript
type CamelCase<S extends string> = S extends `${infer First}_${infer Rest}`
  ? `${Lowercase<First>}${Capitalize<CamelCase<Rest>>}`
  : Lowercase<S>
```

**[DropString](https://github.com/type-challenges/type-challenges/tree/master/questions/2059-hard-drop-string)**

这道题我实现了一个辅助函数`Includes`来判断字符串中是否包含某个字符

`DropString`的思路就是取出每个字符和要删除的字符串`R`中的字符比较是否`includes`，如果是，那么删除该字符；否则，保留该字符。后面的字符串作为参数递归调用

```typescript
type Includes<T extends string, S extends string> = T extends `${infer H}${infer Rest}`
  ? S extends H
    ? true
    : Includes<Rest, S>
  : false

type DropString<S extends string, R extends string> = S extends `${infer First}${infer Rest}`
  ? Includes<R, First> extends true
    ? DropString<Rest, R>
    : `${First}${DropString<Rest, R>}`
  : S
```

### 函数类型

**[AppendArgument](https://github.com/type-challenges/type-challenges/blob/master/questions/191-medium-append-argument/README.zh-CN.md)**

```typescript
type AppendArgument<Fn extends Function, A extends unknown> = Fn extends (
  ...args: infer P
) => infer R
  ? (...args: [...P, A]) => R
  : never
```

### 索引类型

遍历索引类型的方法

对象

```typescript
type Mapping<Obj extends Record<string, any>> = {
  [Key in keyof Obj]: Obj[Key]
}

// 修改 key 比如把索引类型的 Key 变为大写

type UppercaseKey<Obj extends Record<string, any>> = {
  [Key in keyof Obj as Uppercase<Key & string>]: Obj[Key]
}
```

数组

```typescript
type TupleToUnion<T extends any[]> = T[number]

type TupleToObject<T extends readonly (string | number | symbol)[]> = {
  [key in T[number]]: key
}
```

## 套路三：递归复用做循环

**Awaited**

`Promise<ExampleType>`，请你返回 ExampleType 类型，可能会有嵌套`Promise<Promise<ExampleType>>`

```typescript
type MyAwaited<T extends Promise<any>> = T extends Promise<infer K>
  ? K extends Promise<any>
    ? MyAwaited<K>
    : K
  : never
```

**Includes**

```typescript
type IsEqual<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
  ? true
  : false

type Includes<T extends readonly any[], U> = T extends [infer First, ...infer Rest]
  ? IsEqual<First, U> extends true
    ? true
    : Includes<Rest, U>
  : false
```

**[ReaplaceAll](https://github.com/type-challenges/type-challenges/blob/master/questions/119-medium-replaceall/README.zh-CN.md)**

```typescript
type ReplaceAll<S extends string, From extends string, To extends string> = From extends ''
  ? S
  : S extends `${infer Prefix}${From}${infer Suffix}`
  ? `${Prefix}${To}${ReplaceAll<`${Suffix}`, From, To>}`
  : S
```

**[StringToUnion](https://github.com/type-challenges/type-challenges/tree/master/questions/531-medium-string-to-union)**

```typescript
type StringToUnion<T extends string> = T extends `${infer First}${infer Rest}`
  ? First | StringToUnion<Rest>
  : never
```

## 套路四 数组长度做计数

我们可以利用数组的 length 来进行数值计算

首先我们得定义一个构造数组的 type

```typescript
type BuildArray<
  Length extends number,
  Ele = unknown,
  Arr extends unknown[] = []
> = Arr['length'] extends Length ? Arr : BuildArray<Length, Ele, [...Arr, Ele]>
```

### 实现加减乘除

```typescript
type BuildArray<
  Length extends number,
  Ele = unknown,
  Arr extends unknown[] = []
> = Arr['length'] extends Length ? Arr : BuildArray<Length, Ele, [...Arr, Ele]>

type Add<T extends number, U extends number> = [...BuildArray<T, 1>, ...BuildArray<U, 1>]['length']

type Subtract<T extends number, U extends number> = BuildArray<T> extends [
  ...arr1: BuildArray<U>,
  ...arr2: infer Rest
]
  ? Rest['length']
  : never

type Multiply<T extends number, U extends number, Result extends unknown[] = []> = T extends 0
  ? Result['length']
  : Multiply<Subtract<T, 1>, U, [...BuildArray<U>, ...Result]>

type Divide<T extends number, U extends number, Result extends unknown[] = []> = T extends 0
  ? Result['length']
  : Divide<Subtract<T, U>, U, [unknown, ...Result]>
```

## 数组长度实现计数

**LengthOfString**

```typescript
type StrToArr<S extends string> = S extends ''
  ? []
  : S extends `${infer First}${infer Rest}`
  ? [First, ...StrToArr<Rest>]
  : [S]

type LengthOfString<S extends string> = StrToArr<S>['length']
```

**GreaterThan**

```typescript
type GreaterThan<
  Num1 extends number,
  Num2 extends number,
  CountArr extends unknown[] = []
> = Num1 extends Num2
  ? false
  : CountArr['length'] extends Num2
  ? true
  : CountArr['length'] extends Num1
  ? false
  : GreaterThan<Num1, Num2, [...CountArr, unknown]>
```

**[Fibonacci](https://github.com/type-challenges/type-challenges/blob/master/questions/4182-medium-fibonacci-sequence/README.zh-CN.md)**

```typescript
type FibonacciLoop<
  PrevArr extends unknown[],
  CurrentArr extends unknown[],
  IndexArr extends unknown[] = [],
  Num extends number = 1
> = IndexArr['length'] extends Num
  ? CurrentArr['length']
  : FibonacciLoop<CurrentArr, [...PrevArr, ...CurrentArr], [...IndexArr, unknown], Num>

type Fibonacci<Num extends number> = FibonacciLoop<[1], [], [], Num>
```

## 套路五 联合分散可简化

当我们传入联合类型的时候，条件判断 extends 的左边会将联合类型单个传入，右边则不会，是全部联合类型

**IsUnion**

```typescript
type IsUnion<A, B = A> = A extends A ? ([B] extends [A] ? false : true) : never
```

`A extends A` 看似没什么意义，实际上是为了拿到联合类型中的每一个类型

而 `[B] extends [A]` 这里，因为 B 在括号里，所以依然是整个联合类型，而 A 是单个类型，所以结果为 false，而传入的类型不是联合类型的话，`[B] extends [A]`的结果就为 true

**BEM**

```typescript
type BEM<
  B extends string,
  E extends string[],
  M extends string[],
  L extends number = 0
> = E extends [infer T]
  ? M extends [infer U, ...infer Rest]
    ? `${B}__${T & string}--${U & string}` | BEM<B, E, Rest extends string[] ? Rest : [], 1>
    : L extends 0
    ? `${B}__${T & string}`
    : never
  : M extends [infer U, ...infer Rest]
  ? `${B}--${U & string}` | BEM<B, [], Rest extends string[] ? Rest : []>
  : never

type BEM<
  Block extends string,
  Element extends string[],
  Modifiers extends string[]
> = `${Block}__${Element[number]}--${Modifiers[number]}`
```

**AllCombinations**

```typescript
type Combination<A extends string, B extends string> = A | B | `${A}${B}` | `${B}${A}`

type AllCombinations<A extends string, B extends string = A> = A extends A
  ? Combination<A, AllCombinations<Exclude<B, A>>>
  : never
```

## 参考文章

[掘金小册 TypeScript 类型体操通关秘籍](https://juejin.cn/book/7047524421182947366)
