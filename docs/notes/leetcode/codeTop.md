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
