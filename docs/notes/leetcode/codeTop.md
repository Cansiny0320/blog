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

## [88. 合并两个有序数组](https://leetcode-cn.com/problems/merge-sorted-array/)

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

## [415. 字符串相加](https://leetcode-cn.com/problems/add-strings/)

**双指针模拟**

```js
var addStrings = function (num1, num2) {
  let i = num1.length - 1,
    j = num2.length - 1
  let ans = []
  let carry = 0
  while (i >= 0 || j >= 0 || carry) {
    const n1 = i >= 0 ? num1.charAt(i) - '0' : 0
    const n2 = j >= 0 ? num2.charAt(j) - '0' : 0
    const sum = n1 + n2 + carry
    carry = Math.floor(sum / 10)
    ans.push(sum % 10)
    i--
    j--
  }
  return ans.reverse().join('')
}
```

## [3. 无重复字符的最长子串](https://leetcode-cn.com/problems/longest-substring-without-repeating-characters/)

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

## [165. 比较版本号](https://leetcode-cn.com/problems/compare-version-numbers/)

**分割 + 解析**

版本号通过`.`分割，我们可以通过`split`将版本号分成一个一个的块，长度不足的可以在后面补`0`

之后比较每个块的数字就可以

```js
var compareVersion = function (version1, version2) {
  const v1 = version1.split('.')
  const v2 = version2.split('.')
  let n1, n2
  let p = 0
  while (p < Math.max(v1.length, v2.length)) {
    n1 = p < v1.length ? parseInt(v1[p]) : 0
    n2 = p < v2.length ? parseInt(v2[p]) : 0
    if (n1 === n2) {
      p++
    } else {
      return n1 - n2 > 0 ? 1 : -1
    }
  }
  return 0
}
```

## [1. 两数之和](https://leetcode-cn.com/problems/two-sum/)

**哈希表**

我们可以在遍历数组的时候使用`map`将`target - nums[i]`和下标`i`存下来，当遇到`map`中有值为`nums[i]`的键后就返回`target - nums[i]`和`nums[i]`的下标

```js
var twoSum = function (nums, target) {
  const map = new Map()
  for (let i = 0; i < nums.length; i++) {
    if (map.has(nums[i])) {
      return [i, map.get(nums[i])]
    }
    map.set(target - nums[i], i)
  }
}
```

## [70. 爬楼梯](https://leetcode-cn.com/problems/climbing-stairs/)

**动态规划**

因为我们一次可以爬 1 或 2 个台阶，那么爬到第 n+2 阶台阶的方法数就等于爬到第 n+1 阶台阶的方法数和爬到第 n 阶台阶的方法数之和

我们定义 dp[n] 为爬到第 n 阶台阶的方法数，我们可以推出状态转移公式：

$$
dp[n+2] = dp[n+1] + dp[n+2]
$$

初始状态为 `dp[1] = 1`，`dp[2] = 2`

```js
var climbStairs = function (n) {
  const dp = []
  dp[1] = 1
  dp[2] = 2
  for (let i = 3; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2]
  }
  return dp[n]
}
```

## [112. 路径总和](https://leetcode-cn.com/problems/path-sum/)

**DFS + 递归**

分为左子树和右子树分别求解，在这里不需要保存已遍历的节点的值，直接用`targetSum - root.val`保存还剩多少值就可以了

```js
var hasPathSum = function (root, targetSum) {
  if (root === null) {
    return false
  }

  if (root.left === null && root.right === null) {
    return targetSum - root.val === 0
  }
  return (
    hasPathSum(root.left, targetSum - root.val) ||
    hasPathSum(root.right, targetSum - root.val)
  )
}
```

## [129. 求根节点到叶节点数字之和](https://leetcode-cn.com/problems/sum-root-to-leaf-numbers/)

**DFS**

用 `preSum` 记录之前的总和

```js
const dfs = (root, prevSum) => {
  if (root === null) {
    return 0
  }
  const sum = prevSum * 10 + root.val
  if (root.left == null && root.right == null) {
    return sum
  } else {
    return dfs(root.left, sum) + dfs(root.right, sum)
  }
}

var sumNumbers = function (root) {
  return dfs(root, 0)
}
```

## [53. 最大子序和](https://leetcode-cn.com/problems/maximum-subarray/)

**动态规划**

我们定义 dp[n] 为以 nums[n] 结尾的子数组最大和，我们可以想到 dp[n] 的最大值应该等于 dp[n - 1] 考虑加不加上 nums[n]，所以我们比较`dp[n - 1] + nums[n]`和`nums[n]` 的大小，其中较大的为 dp[n] 的值

那么有以下状态转移公式:

$$
dp[n] = max{dp[n - 1] + nums[n],nums[n]}
$$

初始值为 dp[0] = nums[0]

再用一个变量 `max` 记录一下 dp[n] 中的最大值

```js
var maxSubArray = function (nums) {
  let max = nums[0]
  const dp = []
  dp[0] = nums[0]
  for (let i = 1; i < nums.length; i++) {
    dp[i] = Math.max(dp[i - 1] + nums[i], nums[i])
    max = Math.max(max, dp[i])
  }
  return max
}
```

## [46. 全排列](https://leetcode-cn.com/problems/permutations/)

**DFS**

`dfs`函数有四个参数，分别是`used`用来记录已经使用过的数字，`path`保存遍历的路径，`nums`原数组，`ans`结果

回溯终止条件是 `path` 的长度和 `nums` 的长度相等，就可以将 `path` 加入 `ans`，需要注意的是需要用`slice()`获得 path 的深拷贝，避免获取的是 path 的引用

```js
var permute = function (nums) {
  const ans = []
  nums.forEach(e => dfs([e], [e], nums, ans))
  return ans
}

const dfs = (used, path, nums, ans) => {
  if (path.length === nums.length) {
    ans.push(path.slice())
  }
  nums.forEach(e => {
    if (!used.includes(e)) {
      // 回溯操作
      used.push(e)
      path.push(e)
      dfs(used, path, nums, ans)
      used.pop()
      path.pop()
    }
  })
}
```

[215. 数组中的第 K 个最大元素](https://leetcode-cn.com/problems/kth-largest-element-in-an-array/)

**先排序**

我们可以将数组先排序，再找出第 K 个最大元素，这里我们使用快速排序，可以在排序过程中就找到第 K 个最大元素

![](https://cansiny.oss-cn-shanghai.aliyuncs.com/images/1627468415426.png)

如图，如果我们发现排序后分割点`index < target`，那么就应该继续排序 `index` 右边的数组，如果`index > target`，那么就应该继续排序 `index` 左边的数组，直到 `index === target`

```js
var findKthLargest = function (nums, k) {
  const target = nums.length - k
  let low = 0
  let high = nums.length - 1
  while (true) {
    const index = partition(nums, low, high)
    if (index === target) {
      return nums[target]
    } else if (index < target) {
      low = index + 1
    } else {
      high = index - 1
    }
  }
}

function partition(nums, low, high) {
  if (high > low) {
    let mid = low + ((high - low) >> 1)
    swap(nums, mid, low)
  }
  const pivot = nums[low]
  const start = low
  while (low < high) {
    while (low < high && nums[high] >= pivot) high--
    while (low < high && nums[low] <= pivot) low++
    if (low < high) {
      swap(nums, low, high)
    }
  }
  swap(nums, low, start)
  return low
}

function swap(nums, i, j) {
  ;[nums[i], nums[j]] = [nums[j], nums[i]]
}
```

## [102. 二叉树的层序遍历](https://leetcode-cn.com/problems/binary-tree-level-order-traversal/)

**BFS**

用一个数组保存每一层的节点，如果这个数组中没有元素，那么就终止遍历

```js
var levelOrder = function (root) {
  if (root === null) return []
  const ans = []
  bfs([root], ans)
  return ans
}

const bfs = (list, ans) => {
  ans.push(list.map(e => e.val))
  const nextList = []
  list.forEach(e => {
    e.left !== null && nextList.push(e.left)
    e.right !== null && nextList.push(e.right)
  })
  if (!nextList.length) return
  bfs(nextList, ans)
}
```

## [300. 最长递增子序列](https://leetcode-cn.com/problems/longest-increasing-subsequence/)

**方法一 动态规划**

首先考虑题目问什么，就把什么定义成状态。题目问最长上升子序列的长度，其实可以把「子序列的长度」定义成状态，但是发现「状态转移」不好做。

基于「动态规划」的状态设计需要满足「无后效性」的设计思想，可以将状态定义为「以 `nums[i]` 结尾 的「上升子序列」的长度」。

> 「无后效性」的设计思想：让不确定的因素确定下来，以保证求解的过程形成一个逻辑上的有向无环图。这题不确定的因素是某个元素是否被选中，而我们设计状态的时候，让 nums[i] 必需被选中，这一点是「让不确定的因素确定下来」，也是我们这样设计状态的原因。

1. 定义状态:

`dp[i]` 表示：以 `nums[i]` 结尾 的「上升子序列」的长度。注意：这个定义中 `nums[i]` 必须被选取，且必须是这个子序列的最后一个元素；

2. 状态转移方程：

如果一个较大的数接在较小的数后面，就会形成一个更长的子序列。只要 `nums[i]` 严格大于在它位置之前的某个数，那么 `nums[i]` 就可以接在这个数后面形成一个更长的上升子序列。

$$
  dp[i] = \max_{0 \leq j<i,nums[j]<nums[i]}dp[j] + 1
$$

3. 初始化：

`dp[i] = 1`，1 个字符显然是长度为 1 的上升子序列。

4. 输出：

不能返回最后一个状态值，最后一个状态值只表示以 nums[len - 1] 结尾的「上升子序列」的长度，状态数组 dp 的最大值才是题目要求的结果。

$$
  \max_{0 \leq i \leq len -1}dp[i]
$$

5. 空间优化：

遍历到一个新数的时候，之前所有的状态值都得保留，因此无法优化空间。

```js
var lengthOfLIS = function (nums) {
  const len = nums.length
  const dp = new Array(len).fill(1)
  for (let i = 1; i < len; i++) {
    let preMax = 1
    for (let j = 0; j < i; j++) {
      if (nums[j] < nums[i]) {
        preMax = Math.max(dp[j], preMax)
        dp[i] = preMax + 1
      }
    }
  }
  return Math.max(...dp)
}
```

**方法二 贪心+二分查找**

1. 定义新状态（特别重要）

`tail[i]` 表示：长度为 `i + 1` 的**所有**上升子序列的结尾的最小值。

说明：

- 数组 `tail` 不是问题中的「最长上升子序列」（下文还会强调），不能命名为`LIS`。数组 `tail` 只是用于求解 `LIS` 问题的状态数组；
- `tail[0]` 表示长度为 1 的所有上升子序列中，结尾最小的元素的数值。以题目中的示例为例 `[10, 9, 2, 5, 3, 7, 101, 18]` 中，容易发现长度为 2 的所有上升子序列中，结尾最小的是子序列 `[2, 3]` ，因此 `tail[1] = 3`；
- 下标和长度有数值为 1 的偏差；
  状态定义其实也描述了状态转移方程。

1. 状态转移方程：

因为只需要维护状态数组 `tail` 的定义，它的长度就是最长上升子序列的长度。下面说明在遍历中，如何维护状态数组 `tail` 的定义。

1.  在遍历数组 `nums` 的过程中，看到一个新数 `num`，如果这个数**严格**大于有序数组 `tail` 的最后一个元素，就把 `num` 放在有序数组 `tail` 的后面，否则进入第 2 点；
2.  在有序数组 `tail` 中查找第 1 个等于大于 `num` 的那个数，让他变为 `num`；
    - 如果有序数组 `tail` 中存在 等于 `num` 的元素，什么都不做，因为以 `num` 结尾的最短的「上升子序列」已经存在；
    - 如果有序数组 `tail` 中存在 大于 `num` 的元素，找到第 1 个，让它变小，这样我们就找到了一个结尾更小的相同长度的上升子序列。

说明：

- 我们再看一下数组 `tail[i]` 的定义：长度为 i + 1 的 所有 最长上升子序列的结尾的最小值。因此，在遍历的过程中，我们试图让一个大的值变小是合理的；
- 这一步可以认为是「贪心算法」，总是做出在当前看来最好的选择，当前「最好的选择」是：当前只让让第 1 个严格大于 `nums[i]` 的数变小，变成 `nums[i]`，这一步操作是「无后效性」的；
- 由于是在有序数组中的操作，因此可以使用「二分查找算法」。

3. 初始化：

遍历第 1 个数 `nums[0]`，直接放在有序数组 `tail` 的开头 `tail[0] = nums[0]`。

4. 输出：

有序数组 `tail` 的长度，就是所求的「最长上升子序列」的长度。

```js
var lengthOfLIS = function (nums) {
  const len = nums.length
  const tail = [nums[0]]
  for (let i = 1; i < len; i++) {
    if (nums[i] > tail[tail.length - 1]) {
      tail.push(nums[i])
    } else {
      let left = 0
      let right = tail.length - 1
      while (left < right) {
        const mid = (left + right) >> 1
        if (tail[mid] < nums[i]) {
          left = mid + 1
        } else {
          right = mid
        }
      }
      tail[left] = nums[i]
    }
  }
  return tail.length
}
```

## [94. 二叉树的中序遍历](https://leetcode-cn.com/problems/binary-tree-inorder-traversal/description/)

**方法一 递归**

```js
var inorderTraversal = function (root) {
  const res = []
  const inorder = root => {
    if (!root) {
      return
    }
    inorder(root.left)
    res.push(root.val)
    inorder(root.right)
  }
  inorder(root)
  return res
}
```

**方法二 迭代**

```js
var inorderTraversal = function (root) {
  const res = []
  const stk = []
  while (root || stk.length) {
    while (root) {
      stk.push(root)
      root = root.left
    }
    root = stk.pop()
    res.push(root.val)
    root = root.right
  }
  return res
}
```

## [剑指 Offer 10- I. 斐波那契数列](https://leetcode-cn.com/problems/fei-bo-na-qi-shu-lie-lcof/)

**动态规划**

状态定义：`dp[i]`表示斐波那契数列第 i 项的值

状态转移方程：`dp[i] = (dp[i - 1] + dp[i - 2]) % 1000000007` (本题要求取模)

初始状态：`dp = [0,1]`

输出：`dp[n]`

```js
const fib = n => {
  const dp = [0, 1]
  for (let i = 2; i <= n; i++) {
    dp[i] = (dp[i - 1] + dp[i - 2]) % 1000000007
  }
  return dp[n]
}
```
