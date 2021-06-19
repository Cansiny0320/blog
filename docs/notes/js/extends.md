---
id: extends
title: 继承

hide_title: true

# hide_table_of_contents: false

# sidebar_label: Markdown :)

# custom_edit_url: https://github.com/facebook/docusaurus/edit/master/docs/api-doc-markdown.md

description: 继承
keywords:
  - JavaScript
image: https://i.imgur.com/mErPwqL.png
---

import Zmage from "@site/src/components/react-zmage-ssr"

> 原文链接：[JavaScript 深入之继承的多种方式和优缺点 ](https://github.com/mqyqingfeng/Blog/issues/16)

<Zmage src="https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1618227316193-%E7%BB%A7%E6%89%BF.png" />

## 原型链继承

```js
function Parent() {
  this.name = "kevin"
}

Parent.prototype.getName = function () {
  console.log(this.name)
}

function Child() {}

Child.prototype = new Parent()

var child1 = new Child()

console.log(child1.getName()) // kevin
```

问题：

1. 引用类型的属性被所有实例共享，在使用原型实现继承的时候，子类的原型实际上变成了父类的实例，父类的实例属性变成了子类的原型的属性，举个例子：

   ```js
   function Parent() {
     this.names = ["kevin", "daisy"]
   }

   function Child() {}

   Child.prototype = new Parent()

   var child1 = new Child()

   child1.names.push("yayu")

   console.log(child1.names) // ["kevin", "daisy", "yayu"]

   var child2 = new Child()

   console.log(child2.names) // ["kevin", "daisy", "yayu"]
   ```

   `names`是引用类型，所有的`names`都指向同一块内存空间，而不是引用类型就不存在这个问题，每创建一个实例，都会重新分配一块内存空间。

2. 在创建 Child 的实例时，不能向 Parent 传参

## 借用构造函数(经典继承)

```js
function Parent() {
  this.names = ["kevin", "daisy"]
}

function Child() {
  Parent.call(this)
}

var child1 = new Child()

child1.names.push("yayu")

console.log(child1.names) // ["kevin", "daisy", "yayu"]

var child2 = new Child()

console.log(child2.names) // ["kevin", "daisy"]
```

`Parent.call(this)`相当于在`Child`对象上运行了所有`Parent()`函数中的所有初始化代码

优点：

1. 避免了引用类型的属性被所有实例共享

2. 可以在 Child 中向 Parent 传参,例如：

   ```js
   function Parent(name) {
     this.name = name
   }

   function Child(name) {
     Parent.call(this, name)
   }

   var child1 = new Child("kevin")

   console.log(child1.name) // kevin

   var child2 = new Child("daisy")

   console.log(child2.name) // daisy
   ```

缺点

1. Parent 必须在构造函数中定义方法，每次创建实例都会创建一遍方法
2. 子类不能访问父类原型上的方法

## 组合继承

原型链继承和经典继承双剑合璧

使用原型链继承原型上的属性和方法，通过借用构造函数来继承实例属性

```js
function Parent(name) {
  this.name = name
  this.colors = ["red", "blue", "green"]
}

Parent.prototype.getName = function () {
  console.log(this.name)
}

function Child(name, age) {
  Parent.call(this, name)

  this.age = age
}

Child.prototype = new Parent()
Child.prototype.constructor = Child

var child1 = new Child("kevin", "18")

child1.colors.push("black")

console.log(child1.name) // kevin
console.log(child1.age) // 18
console.log(child1.colors) // ["red", "blue", "green", "black"]

var child2 = new Child("daisy", "20")

console.log(child2.name) // daisy
console.log(child2.age) // 20
console.log(child2.colors) // ["red", "blue", "green"]
```

优点：融合原型链继承和构造函数的优点，是 JavaScript 中最常用的继承模式

## 原型式继承

```js
function createObj(o) {
  function F() {}
  F.prototype = o
  return new F()
}
```

就是 ES5 `Object.create` 的模拟实现，将传入的对象作为创建的对象的原型。

缺点：

包含引用类型的属性值始终会共享相应的值，这点和原型链继承一样

```js
var person = {
  name: "kevin",
  friends: ["daisy", "kelly"],
}

var person1 = createObj(person)
var person2 = createObj(person)

person1.name = "person1"
console.log(person2.name) // kevin

person1.firends.push("taylor")
console.log(person2.friends) // ["daisy", "kelly", "taylor"]
```

注意：修改`person1.name`的值，`person2.name`的值并未发生改变，并不是因为`person1`和`person2`有独立的 name 值，而是因为`person1.name = 'person1'`，给`person1`添加了 name 值，并非修改了原型上的 name 值。

## 寄生式继承

创建一个仅用于封装继承过程的函数，该函数在内部以某种形式来做增强对象，最后返回对象。

```js
function createObj(o) {
  var clone = Object.create(o)
  clone.sayName = function () {
    console.log("hi")
  }
  return clone
}
```

缺点：跟借用构造函数模式一样，每次创建对象都会创建一遍方法。

## 寄生组合式继承

为了方便大家阅读，在这里重复一下组合继承的代码：

```js
function Parent(name) {
  this.name = name
  this.colors = ["red", "blue", "green"]
}

Parent.prototype.getName = function () {
  console.log(this.name)
}

function Child(name, age) {
  Parent.call(this, name)
  this.age = age
}

Child.prototype = new Parent()

var child1 = new Child("kevin", "18")

console.log(child1)
```

组合继承最大的缺点是会调用两次父构造函数。

一次是设置子类型实例的原型的时候：

```js
Child.prototype = new Parent()
```

一次在创建子类型实例的时候：

```js
var child1 = new Child("kevin", "18")
```

回想下 new 的模拟实现，其实在这句中，我们会执行：

```js
Parent.call(this, name)
```

在这里，我们又会调用了一次 Parent 构造函数。

所以，在这个例子中，如果我们打印 child1 对象，我们会发现 Child.prototype 和 child1 都有一个属性为`colors`，属性值为`['red', 'blue', 'green']`。

那么我们该如何精益求精，避免这一次重复调用呢？

如果我们不使用 Child.prototype = new Parent() ，而是间接的让 Child.prototype 访问到 Parent.prototype 呢？

看看如何实现：

```js
function Parent(name) {
  this.name = name
  this.colors = ["red", "blue", "green"]
}

Parent.prototype.getName = function () {
  console.log(this.name)
}

function Child(name, age) {
  Parent.call(this, name)
  this.age = age
}

// 关键的三步
var F = function () {}

F.prototype = Parent.prototype

Child.prototype = new F()

var child1 = new Child("kevin", "18")

console.log(child1)
```

最后我们封装一下这个继承方法：

```js
function object(o) {
  function F() {}
  F.prototype = o
  return new F()
}

function prototype(child, parent) {
  var prototype = object(parent.prototype)
  prototype.constructor = child
  child.prototype = prototype
}

// 当我们使用的时候：
prototype(Child, Parent)
```

引用《JavaScript 高级程序设计》中对寄生组合式继承的夸赞就是：

> 这种方式的高效率体现它只调用了一次 Parent 构造函数，并且因此避免了在 Parent.prototype 上面创建不必要的、多余的属性。与此同时，原型链还能保持不变；因此，还能够正常使用 instanceof 和 isPrototypeOf。开发人员普遍认为寄生组合式继承是引用类型最理想的继承范式。