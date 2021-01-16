---
id: everyday-one-question-js
title: JavaScript
# hide_title: false
# hide_table_of_contents: false
# sidebar_label: Markdown :)
# custom_edit_url: https://github.com/facebook/docusaurus/edit/master/docs/api-doc-markdown.md
description: 峰华每日一题JavaScript
keywords:
  - JavaScript
  - frontend
  - 前端
# image: https://i.imgur.com/mErPwqL.png
---

## 2021-01-13

```js
const timer = a => {
  return new Promise(res =>
    setTimeout(() => {
      res(a)
    }, Math.random() * 100),
  )
}

const all = Promise.all([timer('first'), timer('second')]).then(data => console.log(data))
```

答案是["first", "second"]，Promise.all 方法获得的成功结果的数组里面的数据顺序和 Promise.all 接收到的数组顺序是一致的

## 2021-01-14

```js
const arr = [x => x * 1, x => x * 2, x => x * 3, x => x * 4]

console.log(arr.reduce((acc, cur) => acc + cur(acc), 1))
```

答案是 120，reduce 方法有两个参数，第一个参数是回调函数，回调函数有四个参数，分别是

- acc(累计值)，即回调函数 return 的值

- cur(当前值)，数组中的当前元素的值

- index(索引)，数组的下标

- initValue(初始值)，累计值的初始值

注意**当有 initValue 参数时，index 才从 0 开始，否则从 1 开始**

所以上述代码运行结果为

1 + 1 \* 1 = 2

2 + 2 \* 2 = 6

6 + 6 \* 3 = 24

24 + 24 \* 4 = 120

## 2021-01-15

```js
function Dog(name) {
  this.name = name
  this.speak = function () {
    return 'woof'
  }
}

const dog = new Dog('Pogo')

Dog.prototype.speak = function () {
  return 'arf'
}

console.log(dog.speak())
```

答案是 woof，实例中有 speak 方法就使用实例中的，没有的话再沿原型链向上找

## 2021-01-16

```js
const user = {
  name: 'Joe',
  age: 25,
  pet: {
    type: 'dog',
    name: 'Buttercup',
  },
}

Object.freeze(user)

user.pet.name = 'Daffodil'

console.log(user.pet.name)
```

答案是 Daffodil，对象在使用 freeze() 冻结之后便不能添加新属性和修改现有属性了，但是 freeze() 不会冻结嵌套的子对象，它所执行的是浅冻结。
