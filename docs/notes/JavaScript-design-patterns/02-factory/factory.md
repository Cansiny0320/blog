---
id: factory
title: 工厂模式
hide_title: true
# hide_table_of_contents: false
# sidebar_label: Markdown :)
# custom_edit_url: https://github.com/facebook/docusaurus/edit/master/docs/api-doc-markdown.md
description: JavaScript设计模式
keywords:
  - JavaScript
  - 设计模式
# image: https://i.imgur.com/mErPwqL.png
---

在说明工厂模式之前，我们需要了解一下`构造器模式`

## 构造器模式

构造器我们在 JS 中十分常见，比如

```js
function User(name, age, career) {
  this.name = name
  this.age = age
  this.career = career
}
```

构造器将 name、age、career 赋值给对象的过程封装，确保了每个对象都具备这些属性，确保了共性的不变，同时将 name、age、career 各自的取值操作开放，确保了个性的灵活

如果在使用构造器模式的时候，我们本质上是去抽象了每个对象实例的变与不变。那么使用工厂模式时，我们要做的就是去抽象不同构造函数（类）之间的变与不变。

## 简单工厂模式

要理解简单工厂模式，我们先来看看如下场景：

小王需要给根据不同的职位给员工分配职责，上面 User 这一个构造器就不够用了。

小王心想，这个简单，我再多写几个构造器不就行了？

```js
function Coder(name, age) {
  this.name = name
  this.age = age
  this.career = 'coder'
  this.work = ['写代码', '写系分', '修Bug']
}
function ProductManager(name, age) {
  this.name = name
  this.age = age
  this.career = 'product manager'
  this.work = ['订会议室', '写PRD', '催更']
}
```

再根据 career 判断一下职位，调用不同的构造器就行

```js
function Factory(name, age, career) {
    switch(career) {
        case 'coder':
            return new Coder(name, age)
            break
        case 'product manager':
            return new ProductManager(name, age)
            break
        ...
}
```

但是一个公司里面有很多个职位，难道每个职位我们都得手写一个构造器给它吗？

当然不！小王灵机一动，每个职位都有 name、age、career、work 这四个属性这样的共性，以及 work 根据 career 的值决定，我们上面的做法既没有将共性封装彻底，也没有将个性和共性分离彻底。

现在我们将相同的逻辑封装回 User 里，将 work 的取值逻辑从 User 中抽离。

```js
function User(name , age, career, work) {
    this.name = name
    this.age = age
    this.career = career
    this.work = work
}

function Factory(name, age, career) {
    let work
    switch(career) {
        case 'coder':
            work =  ['写代码','写系分', '修Bug']
            break
        case 'product manager':
            work = ['订会议室', '写PRD', '催更']
            break
        case 'boss':
            work = ['喝茶', '看报', '见客户']
        case 'xxx':
            // 其它职位的职责分配
            ...

    return new User(name, age, career, work)
}
```

这样一来，我们只需要向以前一样传参就行了。

## 抽象工厂模式

JavaScript 作为一种弱类型的语言，并没有实现抽象类的语法，实现抽象类，需要我们自己去模拟。但为什么我们需要学习抽象工厂模式呢，我们先来看一个例子：

我们都知道一部智能手机由操作系统和硬件组成，如果我们要开一个手机工厂，我们需要准备好操作系统和硬件，才能生产手机。但是操作系统和硬件也有着不同厂商，我们也不知道我们下一步手机需要什么样的操作系统和硬件，我们只知道需要操作系统和硬件，所以我们首先用一个抽象类来约定一部手机的组成部分。

```js
class MobilePhoneFactory {
  // 提供操作系统的接口
  createOS() {
    throw new Error('抽象工厂方法不允许直接调用，你需要将我重写！')
  }
  // 提供硬件的接口
  createHardWare() {
    throw new Error('抽象工厂方法不允许直接调用，你需要将我重写！')
  }
}
```

上面这个类，除了约定手机组成外，什么事也不能干，如果我们直接去 new 一个实例并调用它的实例方法，它还会给我们报错。

在抽象工厂模式里，上面这个类就是食物链顶端的大 Boss——`AbstractFactory`（抽象工厂）。

抽象工厂不干活，具体工厂（ConcreteFactory）来干活！当我们明确了生产方案，明确某一条手机生产流水线具体要生产什么样的手机了之后，就可以化抽象为具体，比如我现在想要一个专门生产 Android 系统 + 高通硬件的手机的生产线，我给这类手机型号起名叫 FakeStar，那我就可以为 FakeStar 定制一个具体工厂：

```js
// 具体工厂继承自抽象工厂
class FakeStarFactory extends MobilePhoneFactory {
  createOS() {
    // 提供安卓系统实例
    return new AndroidOS()
  }
  createHardWare() {
    // 提供高通硬件实例
    return new QualcommHardWare()
  }
}
```

我们提供安卓系统和高通的硬件时，调用了两个实例方法，用来创造具体的操作系统和硬件，像这种被我们用来 new 具体对象的类，叫做具体产品类（ConcreteProduct）。

这些具体产品类往往也具有一些相同的功能，因此我们还可以用一个抽象产品（AbstractProduct）类来声明这类产品的共同功能。

```js
// 定义操作系统这类产品的抽象产品类
class OS {
  controlHardWare() {
    throw new Error('抽象产品方法不允许直接调用，你需要将我重写！')
  }
}

// 定义具体操作系统的具体产品类
class AndroidOS extends OS {
  controlHardWare() {
    console.log('我会用安卓的方式去操作硬件')
  }
}

class AppleOS extends OS {
  controlHardWare() {
    console.log('我会用🍎的方式去操作硬件')
  }
}
```

硬件类产品同理：

```js
// 定义手机硬件这类产品的抽象产品类
class HardWare {
  // 手机硬件的共性方法，这里提取了“根据命令运转”这个共性
  operateByOrder() {
    throw new Error('抽象产品方法不允许直接调用，你需要将我重写！')
  }
}

// 定义具体硬件的具体产品类
class QualcommHardWare extends HardWare {
  operateByOrder() {
    console.log('我会用高通的方式去运转')
  }
}

class MiWare extends HardWare {
  operateByOrder() {
    console.log('我会用小米的方式去运转')
  }
}
```

这样一来，当我们需要制造一部 FakeStar 手机的时候，我们只需要这样做：

```js
// 这是我的手机
const myPhone = new FakeStarFactory()
// 让它拥有操作系统
const myOS = myPhone.createOS()
// 让它拥有硬件
const myHardWare = myPhone.createHardWare()
// 启动操作系统(输出‘我会用安卓的方式去操作硬件’)
myOS.controlHardWare()
// 唤醒硬件(输出‘我会用高通的方式去运转’)
myHardWare.operateByOrder()
```

是不是很方便了？关键的时刻来了，当我们需要一部新手机的时候我们怎么办呢？

我们只需要拓展抽象工厂 MobilePhoneFactory 的种类，而无需去修改它。

```js
class newStarFactory extends MobilePhoneFactory {
  createOS() {
    // 操作系统实现代码
  }
  createHardWare() {
    // 硬件实现代码
  }
}
```

这样操作是不是完美符合“开闭原则”？

## 总结

工厂模式都在尝试去分离一个系统中变与不变的部分，简单工厂和抽象工厂的区别在于**场景的复杂度**，简单工厂面对的是共性易于抽离，逻辑比较简单的类，而抽象工厂面对的是比较复杂的类，需要很高的可拓展性。
