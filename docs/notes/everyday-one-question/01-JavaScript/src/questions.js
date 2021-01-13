// 2021-01-13  ["first", "second"]
const timer = a => {
  return new Promise(res =>
    setTimeout(() => {
      res(a)
    }, Math.random() * 100),
  )
}

const all = Promise.all([timer('first'), timer('second')]).then(data => console.log(data))
