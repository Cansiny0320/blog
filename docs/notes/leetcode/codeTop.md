---
id: codeTop
title: codeTop
hide_title: true
# hide_table_of_contents: false
# sidebar_label: Markdown :)
# custom_edit_url: https://github.com/facebook/docusaurus/edit/master/docs/api-doc-markdown.md
description: codeTop 面向面试刷题
keywords:
  - JavaScript
  - Java
  - 数据结构和算法
# image: https://i.imgur.com/mErPwqL.png
---

## [合并两个有序数组](https://leetcode-cn.com/problems/merge-sorted-array/)

**逆向双指针**

设置两个指针在两个数组最后，从后向前遍历，将较大的元素放到 `nums1` 的最后面

```js
var merge = function (nums1, m, nums2, n) {
  let p1 = m - 1,
    p2 = n - 1
  let tail = m + n - 1
  while (tail >= 0) {
    if (p1 < 0) {
      nums1[tail--] = nums2[p2--]
    } else if (p2 < 0) {
      nums1[tail--] = nums1[p1--]
    } else {
      nums1[tail--] = nums1[p1] >= nums2[p2] ? nums1[p1--] : nums2[p2--]
    }
  }
}
```

## [字符串相加](https://leetcode-cn.com/problems/add-strings/)

**双指针模拟**

```js
var addStrings = function (num1, num2) {
  let i = num1.length - 1,
    j = num2.length - 1
  let ans = []
  let carry = 0
  while (i >= 0 || j >= 0 || carry) {
    const n1 = i >= 0 ? num1.charAt(i) - "0" : 0
    const n2 = j >= 0 ? num2.charAt(j) - "0" : 0
    const sum = n1 + n2 + carry
    carry = Math.floor(sum / 10)
    ans.push(sum % 10)
    i--
    j--
  }
  return ans.reverse().join("")
}
```

## [无重复字符的最长子串](https://leetcode-cn.com/problems/longest-substring-without-repeating-characters/)

**双指针实现滑动窗口**

其中比较巧妙的一点是，用`Set`存储已经遍历过的字符，这样右指针遇到有重复的字符的时候，不用改变右指针的位置，只需要将左指针向右移动以为，并删掉左指针之前指向的字符就可以了

因为在`Set`里存的都是不重复的字符，这样避免了一些不必要的遍历

```js
var lengthOfLongestSubstring = function (s) {
  const len = s.length
  let j = -1
  const sub = new Set()
  let max = 0
  for (let i = 0; i < len; i++) {
    if (i != 0) {
      sub.delete(s[i - 1])
    }
    while (j + 1 < len && !sub.has(s[j + 1])) {
      sub.add(s[j + 1])
      j++
    }
    max = Math.max(max, j - i + 1)
  }
  return max
}
```
