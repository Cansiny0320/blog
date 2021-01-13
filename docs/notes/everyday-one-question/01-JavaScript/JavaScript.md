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
