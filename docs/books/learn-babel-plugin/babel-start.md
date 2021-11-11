---
id: babel-start
title: 初探 babel - 《babel 插件通关秘籍》笔记（一）

# hide_title: true

# hide_table_of_contents: false

# sidebar_label: Markdown :)

# custom_edit_url: https://github.com/facebook/docusaurus/edit/master/docs/api-doc-markdown.md

description: 介绍了 babel 的原理
keywords:
  - JavaScript
  - babel
# image: https://i.imgur.com/mErPwqL.png
---

写代码的时候，我们经常会使用 babel 来进行 polyfill，但是 babel 是怎么做到的呢？这篇文章会对 babel 有一个大概的介绍

## babel 是啥？

### babel 的用途

**js 转译器 转译 esnext、typescript、flow 等到目标环境支持的 js**

这个是最常用的功能，用来把代码中的 esnext 的新的语法、typescript 和 flow 的语法转成基于目标环境支持的语法的实现，并且还可以把目标环境不支持的 api 进行 polyfill。

**一些特定用途的代码转换**

babel 是一个转译器，暴露了很多 api，用这些 api 可以完成代码到 AST 的 parse，AST 的转换，以及目标代码的生成

开发者可以用它来来完成一些特定用途的转换，比如函数插桩（函数中自动插入一些代码，例如埋点代码）、自动国际化、default import 转 named import 等。

现在比较流行的小程序转译工具 taro，就是基于 babel 的 api 来实现的。

**代码的静态分析**

对代码进行 parse 之后，能够进行转换，是因为通过 AST 的结构能够理解代码。理解了代码之后，除了进行转换然后生成目标代码之外，也同样可以用于分析代码的信息，进行一些检查。

- linter 工具就是分析 AST 的结构，对代码规范进行检查。
- api 文档自动生成工具，可以提取源码中的注释，然后生成文档。
- type checker 会根据从 AST 中提取的或者推导的类型信息，对 AST 进行类型是否一致的检查，从而减少运行时因类型导致的错误。
- 压缩混淆工具，这个也是分析代码结构，进行删除死代码、变量名混淆、常量折叠等各种编译优化，生成体积更小、性能更优的代码。
- js 解释器，除了对 AST 进行各种信息的提取和检查以外，我们还可以直接解释执行 AST。

### babel 是转译器还是编译器？

先说结论** babel 是转译器**

来解释一下为什么，编译指的是将一种编程语言转成另一种编程语言，主要是高级语言到低级语言的转换。

> 高级语言：有很多用于描述逻辑的语言特性，比如分支、循环、函数、面向对象等，接近人的思维，可以让开发者快速的通过它来表达各种逻辑。比如 c++、javascript。

> 低级语言：与硬件和执行细节有关，会操作寄存器、内存，具体做内存与寄存器之间的复制，需要开发者理解熟悉计算机的工作原理，熟悉具体的执行细节。比如汇编语言、机器语言。

一般编译器 Compiler 是指高级语言到低级语言的转换工具，对于高级语言到高级语言的转换工具，被叫做转译器 (Transpiler)，转译器是一种 source-to-source 的 Compiler。

babel 就是一个 Javascript Transpiler。

## babel 的原理

在解释这个问题之前，我们需要了解几个概念

> AST：抽象语法树，它以树状的形式表现编程语言的语法结构，树上的每个节点都表示源代码中的一种结构。不同的语言生成 AST 规则不同，在 JS 中，AST 就是一个用于描述代码的 JSON 串

> token：指语言中不可再分的最小的单词。如 JS 中的 let、const 等

> sourcemap：源码映射，记录了源码到目标代码的转换关系，通过它我们可以找到目标代码中每一个节点对应的源码位置。

babel 是 source-to-source 的转换，整体编译流程分为三步：

- parse（解析）：通过 parse 把源码转换成 AST
- transform（转换）：遍历 AST，调用各种 transform 插件对 AST 进行增删改
- generate（生成）：将转换后的 AST 转换成字符串形式的代码，并生成 sourcemap

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1623510239043.png)

### parse（解析）

首先 babel 解析源代码生成 AST，那么**为什么要生成 AST 呢**？

首先 AST 省略了一些无意义的分隔符，如`;`、`{`、`}`等，分析一个 AST 和直接分析源码相比，肯定是分析 AST 简单

其次，生成了 AST 之后，之后就可以通过修改 AST 来修改代码，为之后的 transform 和 generate 流程提供了便利

**生成 AST 的过程分为词法分析和语法分析**

词法分析就是把源码分为一个个的 token，而语法分析就是将 token 根据不同的语法结构生成 AST

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1623511548379.png)

### transform（转换）

transform 阶段会对 parse 生成的 AST 进行处理，使 AST 符合目标环境的 js 代码规范

babel 会对 AST 进行遍历，遍历的过程中处理到不同的 AST 节点会调用注册的相应的 visitor 中的函数，visitor 中的函数可以对 AST 节点进行增删改，返回新的 AST（可以指定是否继续遍历新生成的 AST）。这样遍历完一遍 AST 之后就完成了对代码的修改。

> 当 Babel 处理一个节点时，是以访问者的形式获取节点信息，并进行相关操作，这种方式是通过 visitor（访问者）对象来完成的

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1623512150665.png)

### generate（生成）

generate 阶段把最终（经过一系列转换之后）的 AST 转换成目标代码，同时还会创建 sourcemap

babel 会深度优先遍历整个 AST，然后构建可以表示转换后代码的字符串。

## AST

AST 也是有标准的，JS parser 的 AST 大多是 [ESTree 标准](https://github.com/estree/estree)，从 SpiderMonkey 的 AST 标准扩展而来。

> Babel 使用一个基于 [ESTree](https://github.com/estree/estree) 并修改过的 AST，它的内核说明文档可以在 [这里](https://github/.com/babel/babel/blob/master/doc/ast/spec.md) 找到

接下来我们来了解一下 AST 中的常见节点

### Literal

Literal 是字面量的意思，比如 `let name = 'guang'`中，`'guang'`就是一个字符串字面量 StringLiteral，相应的还有 数字字面量 NumericLiteral，布尔字面量 BooleanLiteral，字符串字面量 StringLiteral，正则表达式字面量 RegExpLiteral 等。

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1623513208049.png)

代码中的字面量很多，babel 就是通过 xxLiteral 来抽象这部分内容的。

### Identifier

Identifer 是标识符的意思，变量名、属性名、参数名等各种声明和引用的名字，都是 Identifer。我们知道，JS 中的标识符只能包含字母或数字或下划线（“\_”）或美元符号（“$”），且不能以数字开头。这是 Identifier 的词法特点。

下面这段代码中的 Identifier 有哪些？

```javascript
const name = "guang"

function say(name) {
  console.log(name)
}

const obj = {
  name: "guang",
}
```

答案是这些

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1623513313183.png)

Identifier 是变量和变量的引用，代码中也是随处可见。

### Statement

statement 是语句，它是可以独立执行的单位，比如 break，continue，debugger，return 或者 if 语句、while 语句、for 语句，还有声明语句，表达式语句等。我们写的每一条可以独立执行的代码，都是语句。

语句末尾一般会加一个分号分隔，或者用换行分隔。

下面这些我们经常写的代码，每一行都是一个 Statement：

```javascript
break;
continue;
return;
debugger;
throw Error();
{}
try {} catch(e) {} finally{}
for (let key in obj) {}
for (let i = 0;i < 10;i ++) {}
while (true) {}
do {} while (true)
switch (v){case 1: break;default:;}
label: console.log();
with (a){}
```

他们对应的 AST 节点如图所示

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1623513390343.png)

语句是代码执行的最小单位，可以说，代码是由语句（Statement）构成的。

### Declaration

声明语句是一种特殊的语句，它执行的逻辑是在作用域内声明一个变量、函数、class、import、export 等。

比如下面这些声明语句：

```javascript
const a = 1
function b() {}
class C {}

import d from "e"

export default e = 1
export { e }
export * from "e"
```

他们对应的 AST 节点如图：

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1623513440529.png)

声明语句用于定义变量，变量声明也是代码中一个基础的部分。

### Expression

expression 是表达式，特点是执行完以后有返回值，这是和语句 (statement) 的区别。

下面是一些常见的表达式

```javascript
[1,2,3]
a = 1
1 + 2;
-1;
function(){};
() => {};
class{};
a;
this;
super;
a::b;
```

它们对应的 AST 如图：

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1623513469088.png)

细心的同学可能会问 identifier 和 super 怎么也是表达式呢？

其实有的节点可能会是多种类型，identifier、super 有返回值，符合表达式的特点，所以也是 expression。

我们判断 AST 节点是不是某种类型要看它是不是符合该种类型的特点，比如语句的特点是能够单独执行，表达式的特点是有返回值。

有的表达式可以单独执行，符合语句的特点，所以也是语句，比如赋值表达式、数组表达式等，但有的表达式不能单独执行，需要和其他类型的节点组合在一起构成语句。比如匿名函数表达式和匿名 class 表达式单独执行会报错

```javascript
function(){};
class{}
```

需要和其他部分一起构成一条语句，比如组成赋值语句

```javascript
a = function () {}
b = class {}
```

表达式语句解析成 AST 的时候会包裹一层 ExpressionStatement 节点，代表这个表达式是被当成语句执行的。

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1623513838251.png)

表达式的特点是有返回值，有的表达式可以独立作为语句执行，会包裹一层 ExpressionStatement。

### Class

class 的语法比较特殊，有专门的 AST 节点来表示。

整个 class 的内容是 ClassBody，属性是 ClassProperty，方法是 ClassMethod（通过 kind 属性来区分是 constructor 还是 method）。

比如下面的代码

```javascript
class Guang extends Person {
  name = "guang"
  constructor() {}
  eat() {}
}
```

对应的 AST 是这样的

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1623513873275.png)

class 是 es next 的语法，babel 中有专门的 AST 来表示它的内容。

### Modules

es module 是语法级别的模块规范，所以也有专门的 AST 节点。

#### import

`import` 有 3 种语法：

named import：

```javascript
import { c, d } from "c"
```

default import：

```javascript
import a from "a"
```

namespaced import:

```javascript
import * as b from "b"
```

这 3 种语法都对应 ImportDeclaration 节点，但是 specifiers 属性不同，分别对应 ImportSpecifier、ImportDefaultSpecifier、ImportNamespaceSpecifier。

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1623513894027.png)

图中黄框标出的是 specifier 部分。可以直观的看出整体结构相同，只是 specifier 部分不同，所以 import 语法的 AST 的结构是 ImportDeclaration 包含着各种 import specifier。

#### export

`export` 也有 3 种语法：

named export：

```javascript
export { b, d }
```

default export：

```javascript
export default a
```

all export：

```js
export * from "c"
```

分别对应 ExportNamedDeclaration、ExportDefaultDeclaration、ExportAllDeclaration 的节点

其中 ExportNamedDeclaration 才有 specifiers 属性，其余两种都没有这部分（也比较好理解，export 不像 import 那样结构类似，这三种 export 语法结构是不一样的，所以不是都包含 specifier）。

比如这三种 export

```javascript
export { b, d }
export default a
export * from "c"
```

对应的 AST 节点为

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1623513911021.png)

`import` 和 `export` 是语法级别的模块化实现，也是经常会操作的 AST。

### Program & Directive

program 是代表整个程序的节点，它有 body 属性代表程序体，存放 statement 数组，就是具体执行的语句的集合。还有 directives 属性，存放 Directive 节点，比如`"use strict"` 这种指令会使用 Directive 节点表示。

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1623513927619.png)

Program 是包裹具体执行语句的节点，而 Directive 则是代码中的指令部分。

### File & Comment

babel 的 AST 最外层节点是 File，它有 program、comments、tokens 等属性，分别存放 Program 程序体、注释、token 等，是最外层节点。

注释分为块注释和行内注释，对应 CommentBlock 和 CommentLine 节点。

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1623513940640.png)

### AST 可视化查看工具

当然，我们并不需要记什么内容对应什么 AST 节点，可以通过 [astexplorer.net](https://astexplorer.net/) 这个网站来直观的查看。

![img](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c26502def1b84a36a54ab09c7b071e73~tplv-k3u1fbpfcp-watermark.image)

这个网站可以查看代码 parse 以后的结果，但是如果想查看全部的 AST 可以在 [babel parser 仓库里的 AST 文档](https://github.com/babel/babel/blob/main/packages/babel-parser/ast/spec.md) 里查，或者直接去看 @babel/types 的 [ typescript 类型定义](https://github.com/babel/babel/blob/main/packages/babel-types/src/ast-types/generated/index.ts)。

## refs

[babel 插件通关秘籍](https://juejin.cn/book/6946117847848321055/section)

[Babel 插件手册](https://github.com/jamiebuilds/babel-handbook/blob/master/translations/zh-Hans/plugin-handbook.md)
