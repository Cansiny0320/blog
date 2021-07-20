---
id: babel-plugin-try
title: babel 插件实战 - 《babel 插件通关秘籍》笔记（二）

# hide_title: true

# hide_table_of_contents: false

# sidebar_label: Markdown :)

# custom_edit_url: https://github.com/facebook/docusaurus/edit/master/docs/api-doc-markdown.md

description: 介绍了 babel 的 api 和 插件实现
keywords:
  - JavaScript
  - babel
# image: https://i.imgur.com/mErPwqL.png
---

了解了 babel 的大概原理之后，我们来尝试写一个自己的 babel 插件

## babel 的 API

磨刀不误砍柴工，在写 babel 插件之前，我们先来了解一下 babel 提供了哪些 api

我们知道 [babel 的编译流程](https://cansiny0320.vercel.app/babel-start#babel-%E7%9A%84%E5%8E%9F%E7%90%86)分三步：parse、transform、generate，每一步都暴露了一些 api 出来。

- parse 阶段有`@babel/parser`，功能是把源码转成 AST
- transform 阶段有 `@babel/traverse`，可以遍历 AST，并调用 visitor 函数修改 AST，修改 AST 自然涉及到 AST 的判断、创建、修改等，这时候就需要 `@babel/types` 了，当需要批量创建 AST 的时候可以使用 `@babel/template` 来简化 AST 创建逻辑。
- generate 阶段会把 AST 打印为目标代码字符串，同时生成 sourcemap，需要 `@babel/generate` 包
- 中途遇到错误想打印代码位置的时候，使用 `@babel/code-frame` 包
- babel 的整体功能通过 `@babel/core` 提供，基于上面的包完成 babel 整体的编译流程，并实现插件功能。

### @babel/parser

`@babel/parser` 的作用是将源码转换成 AST

它提供了有两个 api：`parse` 和 `parseExpression`。两者都是把源码转成 AST，不过 parse 返回的 AST 根节点是 File（整个 AST），parseExpression 返回的 AST 根节点是是 Expression（表达式的 AST），粒度不同。

```typescript
function parse(input: string, options?: ParserOptions): File
function parseExpression(input: string, options?: ParserOptions): Expression
```

详细的 options 可以查看[文档](https://babeljs.io/docs/en/babel-parser#options)。其实主要分为两类，一是 parse 的内容是什么，二是以什么方式去 parse

**parse 的内容是什么：**

- **`plugins`**：指定 jsx、typescript、flow 等插件来解析对应的语法
- `allowXxx`： 指定一些语法是否允许，比如函数外的 await、没声明的 export 等
- **`sourceType`**： 指定是否支持解析模块语法，有 module、script、unambiguous 3 个取值，module 是解析 es module 语法，script 则不解析 es module 语法，当作脚本执行，unambiguous 则是根据内容是否有 import 和 export 来确定是否解析 es module 语法。

**以什么方式 parse**

- `strictMode` 是否是严格模式
- `startLine` 从源码哪一行开始 parse
- `errorRecovery` 出错时是否记录错误并继续往下 parse
- `tokens` parse 的时候是否保留 token 信息
- `ranges` 是否在 ast 节点中添加 ranges 属性

使用例子

```js
const ast = parser.parse(sourceCode, {
  sourceType: "unambiguous",
  plugins: ["jsx"],
})
```

### @babel/traverse

parse 生成的 AST 由 `@babel/traverse` 来遍历和修改，= `@babel/traverse` 包提供了 traverse 方法：

```js
function traverse(parent, opts)
```

常用的就前面两个参数，parent 指定要遍历的 AST 节点，opts 指定 visitor 函数。babel 会在遍历 parent 对应的 AST 时调用相应的 visitor 函数。

#### 遍历过程

visitor 对象的 value 是对象或者函数：

- 如果 value 为函数，那么就相当于是 enter 时调用的函数。
- 如果 value 为对象，则可以明确指定 enter 或者 exit 时的处理函数。

函数会接收两个参数 path 和 state。

```js
visitor: {
    Identifier (path, state) {},
    StringLiteral: {
        enter (path, state) {},
        exit (path, state) {}
    }
}
```

enter 时调用是在遍历当前节点的子节点前调用，exit 时调用是遍历完当前节点的子节点后调用。

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1626772425036.png)

函数名可以为单个节点的类型，也可以是多个节点类型通过 `|` 连接，还可以通过别名指定一系列节点类型。

```js
// 进入 FunctionDeclaration 节点时调用
traverse(ast, {
  FunctionDeclaration: {
    enter(path, state) {},
  },
})

// 默认是进入节点时调用，和上面等价
traverse(ast, {
  FunctionDeclaration(path, state) {},
})

// 进入 FunctionDeclaration 和 VariableDeclaration 节点时调用
traverse(ast, {
  "FunctionDeclaration|VariableDeclaration"(path, state) {},
})

// 通过别名指定离开各种 Declaration 节点时调用
traverse(ast, {
  Declaration: {
    exit(path, state) {},
  },
})
```

具体的别名有哪些在[babel-types 的类型定义](https://github.com/babel/babel/blob/main/packages/babel-types/src/ast-types/generated/index.ts#L2489-L2535)可以查。

#### path

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1626772629855.png)

path 是遍历过程中的路径，会保留上下文信息，有很多属性和方法

获取当前节点以及它的关联节点的方法：

- `path.node` 指向当前 AST 节点
- `path.get`、`path.set` 获取和设置当前节点属性的 path
- `path.parent` 指向父级 AST 节点
- `path.getSibling`、`path.getNextSibling`、`path.getPrevSibling` 获取兄弟节点
- `path.find` 从当前节点向上查找节点

作用域的信息属性：

- `path.scope` 获取当前节点的作用域信息

判断 AST 类型的方法：

- `path.isXxx` 判断当前节点是不是 xx 类型
- `path.assertXxx` 判断当前节点是不是 xx 类型，不是则抛出异常

对 AST 进行增删改的方法：

- `path.insertBefore`、`path.insertAfter` 插入节点
- `path.replaceWith`、`path.replaceWithMultiple`、`replaceWithSourceString` 替换节点
- `path.remove` 删除节点

跳过遍历的方法：

- `path.skip` 跳过当前节点的子节点的遍历
- `path.stop` 结束后续遍历

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1626772843947.png)

#### state

第二个参数 state 则是遍历过程中在不同节点之间传递数据的机制，插件会通过 state 传递 options 和 file 信息，我们也可以通过 state 存储一些遍历过程中的共享数据。

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1626773098020.png)

### @babel/types

遍历 AST 的过程中需要创建一些 AST 和判断 AST 的类型，这时候就需要 `@babel/types` 包。

举例来说，如果要创建 IfStatement 就可以调用

```javascript
t.ifStatement(test, consequent, alternate)
```

而判断节点是否是 IfStatement 就可以调用 isIfStatement 或者 assertIfStatement

```javascript
t.isIfStatement(node, opts)
t.assertIfStatement(node, opts)
```

opts 可以指定一些属性是什么值，增加更多限制条件，做更精确的判断。

```javascript
t.isIdentifier(node, { name: "paths" })
```

isXxx 会返回 boolean 表示结果，而 assertXxx 则会在类型不一致时抛异常。

所有的 AST 的 build、assert 的 api 可以在 [babel types 文档](https://babeljs.io/docs/en/babel-types#api)中查。

### @babel/template

通过 `@babel/types` 创建 AST 还是比较麻烦的，要一个个的创建然后组装，如果 AST 节点比较多的话需要写很多代码，这时候就可以使用 `@babel/template` 包来批量创建。

这个包有这些 api：

```javascript
const ast = template(code, [opts])(args)
const ast = template.ast(code, [opts])
const ast = template.program(code, [opts])
```

如果是根据模版直接创建 AST，那么用 template.ast 或者 template.program 方法，这俩都是直接返回 ast 的，但是 template.program 返回的 AST 的根节点是 Program。

如果知道具体创建的 AST 的类型，可以使用 template.expression、template.statement、template.statements 等方法，当明确创建的 AST 的类型时可以使用。

默认 template.ast 创建的 Expression 会被包裹一层 ExpressionStatement 节点（会被当成表达式语句来 parse），但当 template.expression 方法创建的 AST 就不会。

如果模版中有占位符，那么就用 template 的 api，在模版中写一些占位的参数，调用时传入这些占位符参数对应的 AST 节点。

```javascript
const fn = template(`console.log(NAME)`)

const ast = fn({
  NAME: t.stringLiteral("guang"),
})
```

或者

```javascript
const fn = template(`console.log(%%NAME%%)`)

const ast = fn({
  NAME: t.stringLiteral("guang"),
})
```

这两种占位符的写法都可以，当占位符和其他变量名冲突时可以用第二种。

### @babel/generator

AST 转换完之后就要打印成目标代码字符串，通过 `@babel/generator` 包的 generate api

```js
function (ast: Object, opts: Object, code: string): {code, map}
```

第一个参数是要打印的 AST

第二个参数是 options，指定打印的一些细节，比如通过 comments 指定是否包含注释，通过 minified 指定是否包含空白字符

第三个参数当多个文件合并打印的时候需要用到

options 中常用的是 sourceMaps，开启了这个选项才会生成 sourcemap

```js
const { code, map } = generate(ast, { sourceMaps: true })
```

### @babel/code-frame

当有错误信息要打印的时候，需要打印错误位置的代码，可以使用`@babel/code-frame`。

```javascript
const result = codeFrameColumns(rawLines, location, {
  /* options */
})
```

options 可以设置 highlighted （是否高亮）、message（展示啥错误信息）。

比如

```javascript
const { codeFrameColumns } = require("@babel/code-frame")

try {
  throw new Error("xxx 错误")
} catch (err) {
  console.error(
    codeFrameColumns(
      `const name = guang`,
      {
        start: { line: 1, column: 14 },
      },
      {
        highlightCode: true,
        message: err.message,
      },
    ),
  )
}
```

会有比较友好的打印信息

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1626773605304.png)

### @babel/core

前面的包是完成某一部分的功能的，而 `@babel/core` 包则是基于它们完成整个编译流程，从源码到目标代码，生成 sourcemap。

```js
transformSync(code, options) // => { code, map, ast }
transformFileSync(filename, options) // => { code, map, ast }
transformFromAstSync(parsedAst, sourceCode, options) // => { code, map, ast }
```

前三个 transformXxx 的 api 分别是从源代码、源代码文件、源代码 AST 这开始处理，最终生成目标代码和 sourcemap。

options 主要配置 plugins 和 presets，指定具体要做什么转换。

这些 api 也同样提供了异步的版本，异步地进行编译，返回一个 promise

```javascript
transformAsync("code();", options).then(result => {})
transformFileAsync("filename.js", options).then(result => {})
transformFromAstAsync(parsedAst, sourceCode, options).then(result => {})
```

注意：transformXxx 的 api，已经被标记为过时了，后续会删掉，不建议用，直接用 transformXxxSync 和 transformXxxAsync。

`@babel/core` 包还有一个 createConfigItem 的 api，用于 plugin 和 preset 的封装

```javascript
createConfigItem(value, options) // configItem
```

## 实战：插入函数调用参数

我们要实现一个在调用`console.log`等输出信息的 api 的地方自动加上行号和列号，方便定位的插件

### 思路分析

我们首先需要在遍历 AST 的时候对 `console.log` 等 api 加上一些参数，可以通过 `visitor` 指定对函数表达式 `CallExpression` （可以通过[https://astexplorer.net/](https://astexplorer.net/)查看是类型的 AST 节点），然后通过 `CallExpression` 的两个属性 `callee` 和 `arguments`，分别对应函数名和参数，我们只需在`callee` 是 `console.xxx` 的时候，向 `arguments` 数组中插入一个 AST 节点，创建 AST 节点需要用到 `@babel/types` 包。

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1626778281624.png)

### 代码实现

我们要转换的源码如下

```js
const sourceCode = `
    console.log(1);

    function func() {
        console.info(2);
    }

    export default class Clazz {
        say() {
            console.debug(3);
        }
        render() {
            return <div>{console.error(4)}</div>
        }
    }
`
```

可以看到其中使用了 `JSX` 语法，所以在 `parse` 的时候我们需要使用 `jsx` plugin，`sourceType` 我们让它自动选择，设置为 `unambiguous`

```js
const ast = parse.parse(sourceCode, {
  sourceType: "unambiguous",
  plugins: ["jsx"],
})
```

接下来就需要 `@babel/traverse` 来对 AST 做处理了

```js
const targetCalleeName = ["log", "info", "error", "debug"].map(item => `console.${item}`)

traverse(ast, {
  CallExpression(path) {
    const calleeName = path.get("callee").toString()
    if (targetCalleeName.includes(calleeName)) {
      const { line, column } = path.node.loc.start
      path.node.arguments.unshift(types.stringLiteral(`filename: (${line}, ${column})`))
    }
  },
})
```

我们首先使用 `path.get("callee").toString()` 获取到了 `calleeName` , 也可以用 `generate(path.node.callee).code` 获取

然后判断 `calleeName` 是否是我们需要处理的，如果是的话就创建一个包含行列信息的`stringLiteral` AST 节点加入到 `arguments` 开头

最后我们只需要使用 `@babel/generator` 将处理之后的 AST 转换成代码就可以啦

```js
const { code, map } = generate(ast)

console.log(code)
```

完整代码如下：

```js
// 在 log 代码中加入行列信息
const parse = require("@babel/parser")
const traverse = require("@babel/traverse").default
const generate = require("@babel/generator").default
const types = require("@babel/types")

const sourceCode = `
    console.log(1);

    function func() {
        console.info(2);
    }

    export default class Clazz {
        say() {
            console.debug(3);
        }
        render() {
            return <div>{console.error(4)}</div>
        }
    }
`

const ast = parse.parse(sourceCode, {
  sourceType: "unambiguous",
  plugins: ["jsx"],
})

const targetCalleeName = ["log", "info", "error", "debug"].map(item => `console.${item}`)

traverse(ast, {
  CallExpression(path) {
    const calleeName = path.get("callee").toString()
    if (targetCalleeName.includes(calleeName)) {
      const { line, column } = path.node.loc.start
      path.node.arguments.unshift(types.stringLiteral(`filename: (${line}, ${column})`))
    }
  },
})

const { code, map } = generate(ast)

console.log(code)
```

### 另一个版本

现在我们是将行列信息输出在 `console.xxx` 的同一行的，但是这样可能会造成一些干扰，我们现在来修改一下代码，并实现一个真正的插件

要实现这个功能我们只需要在上一般的基础上修改一下 AST 的处理逻辑

```js
traverse(ast, {
  CallExpression(path) {
    if (path.node.isNew) {
      return
    }
    const calleeName = path.get("callee").toString()
    if (targetCalleeName.includes(calleeName)) {
      const { line, column } = path.node.loc.start
      const newNode = template.expression(`console.log("filename: (${line}, ${column})")`)()
      newNode.isNew = true

      if (path.findParent(p => p.isJSXElement())) {
        path.replaceWith(types.arrayExpression([newNode, path.node]))
        path.skip()
      } else {
        path.insertBefore(newNode)
      }
    }
  },
})
```

可以发现，我们将一段 AST 用 `insertBefore` 插入到了 `console.xxx` 的前面

如果是在 JSX 中调用 `console.xxx` 的话需要一些特殊处理，因为在 JSX 中调用多条语句需要替换成数组的形式

```jsx
<div>{[console.log("filename.js(11,22)"), console.log(111)]}</div>
```

如果 `console.xxx` 的父节点有 `isJSXElement` 的话需要将旧节点用 `replaceWith` 替换为数组节点`arrayExpression`

```js
path.replaceWith(types.arrayExpression([newNode, path.node]))
```

然后这个旧节点的子节点我们就直接用 `path.skip()` 跳过

并且用新节点替换了旧节点之后，新节点的遍历是没必要的，但这个新节点不是子节点，用 `path.skip()` 无法跳过，需要加一个标记让我们的遍历过程跳过它

我们给新节点了一个 `isNew` 的标记 ，并在遍历中判断 `isNew`，有的话就跳过它

```js
if (path.node.isNew) {
  return
}
```

### 插件实现

现在我们完成了代码的改造，接下来我们把它写成一个插件的形式

babel 支持 transform 插件，形式是函数返回一个对象，对象有 visitor 属性。

```js
module.exports = function (api, options) {
  return {
    visitor: {
      Identifier(path, state) {},
    },
  }
}
```

第一个参数可以拿到 types、template 等常用包的 api，可以直接用。

作为插件用的时候，并不需要自己调用 parse、traverse、generate，只需要提供一个 visitor 函数，在这个函数内完成转换功能。state 中可以拿到用户配置信息 options 和 file 信息，filename 就可以通过 `state.file.opts.filename` 来取。

上面的代码很容易可以改造成插件：

```js
const targetCalleeName = ["log", "info", "error", "debug"].map(item => `console.${item}`)

const parametersInsertPlugin = ({ types, template }) => {
  return {
    visitor: {
      CallExpression(path, state) {
        if (path.node.isNew) {
          return
        }
        const calleeName = path.get("callee").toString()
        if (targetCalleeName.includes(calleeName)) {
          const { line, column } = path.node.loc.start
          const newNode = template.expression(
            `console.log("${state.file.opts.filename || "unkown filename"}: (${line}, ${column})")`,
          )()
          newNode.isNew = true

          if (path.findParent(path => path.isJSXElement())) {
            path.replaceWith(types.arrayExpression([newNode, path.node]))
            path.skip()
          } else {
            path.insertBefore(newNode)
          }
        }
      },
    },
  }
}

module.exports = parametersInsertPlugin
```

我们来测试一下

```js
const { transformFromAstSync } = require("@babel/core")
const parser = require("@babel/parser")

const insertParametersPlugin = require("./plugin")

const fs = require("fs")
const path = require("path")

const sourceCode = fs.readFileSync(path.join(__dirname, "./sourceCode.js"), {
  encoding: "utf-8",
})

const ast = parser.parse(sourceCode, {
  sourceType: "unambiguous",
  plugins: ["jsx"],
})

const { code } = transformFromAstSync(ast, sourceCode, {
  plugins: [insertParametersPlugin],
  filename: "sourceCode.js",
})

console.log(code)
```

输出

```js
console.log("D:\frontenddemolearn-babelsourceCode.js: (1, 0)")
console.log(1)

function func() {
  console.log("D:\frontenddemolearn-babelsourceCode.js: (4, 2)")
  console.info(2)
}

export default class Clazz {
  say() {
    console.log("D:\frontenddemolearn-babelsourceCode.js: (9, 4)")
    console.debug(3)
  }

  render() {
    return (
      <div>
        {[console.log("D:\frontenddemolearn-babelsourceCode.js: (12, 17)"), console.error(4)]}
      </div>
    )
  }
}
```

perfect!

## 实战：自动埋点

埋点是一个常见的需求，就是在函数里面上报一些信息。像一些性能的埋点，每个函数都要处理，很繁琐。能不能自动埋点呢？

答案是可以的。埋点只是在函数里面插入了一段代码，这段代码不影响其他逻辑，这种函数插入不影响逻辑的代码的手段叫做函数插桩。

我们可以基于 babel 来实现自动的函数插桩，在这里就是自动的埋点。

### 思路分析

比如这样一段代码：

```javascript
import aa from "aa"
import * as bb from "bb"
import { cc } from "cc"
import "dd"

function a() {
  console.log("aaa")
}

class B {
  bb() {
    return "bbb"
  }
}

const c = () => "ccc"

const d = function () {
  console.log("ddd")
}
```

我们要实现埋点就是要转成这样：

```javascript
import _tracker2 from "tracker"
import aa from "aa"
import * as bb from "bb"
import { cc } from "cc"
import "dd"

function a() {
  _tracker2()

  console.log("aaa")
}

class B {
  bb() {
    _tracker2()

    return "bbb"
  }
}

const c = () => {
  _tracker2()

  return "ccc"
}

const d = function () {
  _tracker2()

  console.log("ddd")
}
```

有两方面的事情要做：

- 引入 `tracker` 模块。如果已经引入过就不引入，没有的话就引入，并且生成个唯一 id 作为标识符
- 对所有函数在函数体开始插入 `tracker` 的代码

### 代码实现

引入模块我们可以使用 `@babel/helper-module-imports` 来实现

```js
const importModule = require("@babel/helper-module-imports")

// 省略一些代码
importModule.addDefault(path, "tracker", {
  nameHint: path.scope.generateUid("tracker"),
})
```

首先要判断是否被引入过 `tracker`：在 `Program` 根结点里通过 `path.traverse` 来遍历 `ImportDeclaration`，如果引入了 `tracker` 模块，就记录 id 到 `state`，并用 `path.stop` 来终止后续遍历；没有就引入 `tracker` 模块，用 `generateUid` 生成唯一 id，然后放到 `state`

当然 `default import` （`import xxx from 'xxx'`）和 `namespace import`（`import {xxx} from 'xxx'`） 取 id 的方式不一样，需要分别处理下。

我们把 tracker 模块名作为参数传入，通过 `options.trackerPath` 来取

```js
Program: {
    enter (path, state) {
        path.traverse({
            ImportDeclaration (curPath) {
                const requirePath = curPath.get('source').node.value;
                if (requirePath === options.trackerPath) {// 如果已经引入了
                    const specifierPath = curPath.get('specifiers.0');
                    if (specifierPath.isImportSpecifier()) {
                        state.trackerImportId = specifierPath.toString();
                    } else if(specifierPath.isImportNamespaceSpecifier()) {
                        state.trackerImportId = specifierPath.get('local').toString();// tracker 模块的 id
                    }
                    path.stop();// 找到了就终止遍历
                }
            }
        });
        if (!state.trackerImportId) {
            state.trackerImportId  = importModule.addDefault(path, 'tracker',{
                nameHint: path.scope.generateUid('tracker')
            }).name; // tracker 模块的 id
            state.trackerAST = api.template.statement(`${state.trackerImportId}()`)();// 埋点代码的 AST
        }
    }
}
```

我们在记录 tracker 模块的 id 的时候，也生成调用 tracker 模块的 AST，使用 `template.statement`.

### 函数插桩

函数插桩要找到对应的函数，这里要处理的有：`ClassMethod`、`ArrowFunctionExpression`、`FunctionExpression`、`FunctionDeclaration` 这些节点。

当然有的函数没有函数体，这种要包装一下，然后修改下 return 值。如果有函数体，就直接在开始插入就行了。

```javascript
'ClassMethod|ArrowFunctionExpression|FunctionExpression|FunctionDeclaration'(path, state) {
    const bodyPath = path.get('body');
    if (bodyPath.isBlockStatement()) { // 有函数体就在开始插入埋点代码
        bodyPath.node.body.unshift(state.trackerAST);
    } else { // 没有函数体要包裹一下，处理下返回值
        const ast = api.template.statement(`{${state.trackerImportId}();return PREV_BODY;}`)({PREV_BODY: bodyPath.node});
        bodyPath.replaceWith(ast);
    }
}
```

这样我们就实现了自动埋点。

完整代码

```js
const { declare } = require("@babel/helper-plugin-utils")
const importModule = require("@babel/helper-module-imports")

const autoTrackPlugin = declare((api, options, dirname) => {
  api.assertVersion(7)

  return {
    visitor: {
      Program: {
        enter(path, state) {
          path.traverse({
            ImportDeclaration(curPath) {
              const requirePath = curPath.get("source").node.value
              if (requirePath === options.trackerPath) {
                // 如果已经引入了
                const specifierPath = curPath.get("specifiers.0")
                if (specifierPath.isImportSpecifier()) {
                  state.trackerImportId = specifierPath.toString()
                } else if (specifierPath.isImportNamespaceSpecifier()) {
                  state.trackerImportId = specifierPath.get("local").toString() // tracker 模块的 id
                }
                path.stop() // 找到了就终止遍历
              }
            },
          })
          if (!state.trackerImportId) {
            state.trackerImportId = importModule.addDefault(path, "tracker", {
              nameHint: path.scope.generateUid("tracker"),
            }).name // tracker 模块的 id
            state.trackerAST = api.template.statement(`${state.trackerImportId}()`)()
          }
        },
      },
      "ClassMethod|ArrowFunctionExpression|FunctionExpression|FunctionDeclaration"(path, state) {
        const bodyPath = path.get("body")
        if (bodyPath.isBlockStatement()) {
          // 有函数体就在开始插入埋点代码
          bodyPath.node.body.unshift(state.trackerAST)
        } else {
          const ast = api.template.statement(`{${state.trackerImportId}();return PREV_BODY;}`)({
            PREV_BODY: bodyPath.node,
          })
          bodyPath.replaceWith(ast)
        }
      },
    },
  }
})

module.exports = autoTrackPlugin
```

测试一下

```js
const { transformFromAstSync } = require("@babel/core")
const parser = require("@babel/parser")
const autoTrackPlugin = require("./plugin")

const sourceCode = `
import aa from 'aa';
import * as bb from 'bb';
import {cc} from 'cc';
import 'dd';

function a () {
    console.log('aaa');
}

class B {
    bb() {
        return 'bbb';
    }
}

const c = () => 'ccc';

const d = function () {
    console.log('ddd');
}
`

const ast = parser.parse(sourceCode, {
  sourceType: "unambiguous",
})

const { code } = transformFromAstSync(ast, sourceCode, {
  plugins: [
    [
      autoTrackPlugin,
      {
        trackerPath: "tracker",
      },
    ],
  ],
})

console.log(code)
```

输出

```js
import _tracker2 from "tracker"
import aa from "aa"
import * as bb from "bb"
import { cc } from "cc"
import "dd"

function a() {
  _tracker2()

  console.log("aaa")
}

class B {
  bb() {
    _tracker2()

    return "bbb"
  }
}

const c = () => {
  _tracker2()

  return "ccc"
}

const d = function () {
  _tracker2()

  console.log("ddd")
}
```

实现成功！

## refs

[babel 插件通关秘籍](https://juejin.cn/book/6946117847848321055/section)

[Babel 插件手册](https://github.com/jamiebuilds/babel-handbook/blob/master/translations/zh-Hans/plugin-handbook.md)
