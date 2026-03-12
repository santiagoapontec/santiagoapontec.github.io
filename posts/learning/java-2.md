---
title: Arrays and Loops
category: Coding
journal: Javascript
journal-title: JavaScript
journal-order: 2
order: 2
date: 2/10/2026
---

Arrays store multiple values in a single variable:

```javascript
const fruits = ["apple", "banana", "orange"];
```

You can loop through them like this:

```javascript
fruits.forEach(function (fruit) {
  console.log(fruit);
});
```

Or using a for loop:

```javascript
for (let i = 0; i < fruits.length; i++) {
  console.log(fruits[i]);
}
```
