// 2021-01-13  ["first", "second"]
const timer = a => {
  return new Promise(res =>
    setTimeout(() => {
      res(a)
    }, Math.random() * 100),
  )
}

const all = Promise.all([timer('first'), timer('second')]).then(data => console.log(data))

// 2021-01-14 120

const arr = [x => x * 1, x => x * 2, x => x * 3, x => x * 4]

console.log(arr.reduce((acc, cur) => acc + cur(acc), 1))

//2021-01-15 woof
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
