// 2021-01-13  ["first", "second"]
const timer = a => {
  return new Promise(res =>
    setTimeout(() => {
      res(a);
    }, Math.random() * 100),
  );
};

const all = Promise.all([timer("first"), timer("second")]).then(data => console.log(data));

// 2021-01-14 120

const arr = [x => x * 1, x => x * 2, x => x * 3, x => x * 4];

console.log(arr.reduce((acc, cur) => acc + cur(acc), 1));

// 2021-01-15 woof
function Dog(name) {
  this.name = name;
  this.speak = function () {
    return "woof";
  };
}

const dog = new Dog("Pogo");

Dog.prototype.speak = function () {
  return "arf";
};

console.log(dog.speak());

// 2021-01-16 Daffodil
const user = {
  name: "Joe",
  age: 25,
  pet: {
    type: "dog",
    name: "Buttercup",
  },
};

Object.freeze(user);

user.pet.name = "Daffodil";

console.log(user.pet.name);

// 2021-01-18
const arr1 = [{ firstName: "James" }];
const arr2 = [...arr1];
arr2[0].firstName = "Jonah";
console.log(arr1);

// 2021-01-19 1 2 3
const map = ["a", "b", "c"].map.bind([1, 2, 3]);
map(el => console.log(el));

// 2021-01-20 4 2
const arr = [...new Set([3, 1, 2, 3, 4])];
console.log(arr.length, arr[2]);

// 2021-01-21 [1, NaN, NaN]
console.log(["1", "2", "3"].map(parseInt));

// 2021-01-26 d
const myFunc = str => {
  if (str.length > 1) {
    return myFunc(str.slice(1));
  }
  return str;
};

console.log(myFunc("Hello World"));

// 2021-01-28

var a = 10;
(function () {
  console.log(a);
  a = 5;
  console.log(window.a);
  var a = 20;
  console.log(a);
})();
