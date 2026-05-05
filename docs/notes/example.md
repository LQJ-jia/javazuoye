# 示例笔记

这是一个示例笔记，演示 Markdown 的各种格式。

## 标题示例

### 三级标题
#### 四级标题

## 文本格式

**粗体文本**

*斜体文本*

~~删除线~~

`行内代码`

## 列表

### 无序列表
- 项目 1
- 项目 2
  - 子项目 2.1
  - 子项目 2.2
- 项目 3

### 有序列表
1. 第一步
2. 第二步
   1. 子步骤 2.1
   2. 子步骤 2.2
3. 第三步

## 代码块

### JavaScript
\`\`\`javascript
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10)); // 输出: 55
\`\`\`

### Python
\`\`\`python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

print(fibonacci(10))  # 输出: 55
\`\`\`

### Java
\`\`\`java
public class Fibonacci {
    public static int fibonacci(int n) {
        if (n <= 1) return n;
        return fibonacci(n - 1) + fibonacci(n - 2);
    }
    
    public static void main(String[] args) {
        System.out.println(fibonacci(10)); // 输出: 55
    }
}
\`\`\`

## 引用

> 这是一个引用块
> 
> 可以包含多行内容

> **重要提示**
> 这是一个重要的信息提示

## 表格

| 语言 | 类型 | 学习难度 |
|------|------|--------|
| JavaScript | 脚本语言 | ⭐⭐ |
| Python | 脚本语言 | ⭐⭐ |
| Java | 编译语言 | ⭐⭐⭐ |
| C++ | 编译语言 | ⭐⭐⭐⭐ |

## 链接

[访问 VitePress 官网](https://vitepress.dev)

[访问 Vue3 官网](https://vuejs.org)

## 图片

![示例图片](https://via.placeholder.com/300x200?text=Example+Image)

## 提示框

::: tip
这是一个提示框，可以用来强调重要信息。
:::

::: warning
这是一个警告框，请注意相关内容。
:::

::: danger
这是一个危险提示框，表示需要谨慎。
:::

::: info
这是一个信息框，提供附加信息。
:::

## 任务列表

- [x] 完成任务 1
- [x] 完成任务 2
- [ ] 待完成任务 3
- [ ] 待完成任务 4

## 分隔线

---

## 脚注

这是一段包含脚注的文本[^1]。

[^1]: 这是脚注的内容。

---

**下一步**: 创建更多笔记，按照相同的方式添加到配置文件中。
