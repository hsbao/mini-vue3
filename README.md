# 记录

## 区别介绍

- Vue3 源码使用 monorepo 的方式进行管理，将模块拆分到 packages 中
- Vue3 采用 ts 开发，增强类型检测。Vue2 则采用的是 flow
- Vue3 性能优化，支持 tree-shaking，没使用到的不会被打包

## 内部代码的优化

- Vue3 数据劫持的实现采用的 proxy，初始化不会递归，使用到的时候才会进行数据劫持。Vue2 使用的是 Object.defineProperty，初始化的时候需要递归进行数据劫持，如果数据层级多且复杂会存在性能缺陷。
- Vue3 中对模板编译进行了优化，编译的时候生成 Block Tree，可以对子节点的动态节点进行收集，这样可以减少比较，并且也有了 patchFlag 标记动态节点
- 静态节点的提升，对于静态节点，会抽离出来，不重复进行 createVNode
- Vue3 采用 composition API 进行组织功能，有效解决反复横跳，优化复用逻辑。Vue2 使用的是 mixin 进行公共逻辑的复用，这样会造成数据来源不清晰，命名冲突等问题
- 增加了 Flagment，Teleport，Suspense 等组件

## Block 的概念 --> Block Tree

- DIFF 算法的特定就是递归遍历，每次比较同一层级。（vue2 会标记一下静态节点，也就是那些没用到响应式数据的节点），同一层级上做全量的比较两个新旧 vnode
- 在 createVNode 的时候，会判断当前 vnode 对应的子节点是否是动态节点，如果是就让外层的 block 收集起来
- block 的作用就是收集动态节点：dynamicChildren，也就是收集当前节点下使用了响应式数据的子节点，包括子节点的子节点。收集到同一个数组中
- 但是如果是使用了 v-if,v-else,v-for 等指令影响的子节点，这种情况是影响页面结构的，这种就不会走动态节点的逻辑，会整正常的全量 diff 流程
- Block Tree 的最终目的就是为了在 diff 的时候，只比较动态的节点（vue3 的优化）

## patchFlags

对不同的动态节点进行描述，标记当前节点是需要更新那些内容，比如说更新属性，类名，事件等等，然后在 patch 的时候，根据对应的标记去执行操作，这样就不会全部都执行一遍

# Vue3 架构

## 1. Monorepo (要使用 yarn)

Monorepo 是管理项目代码的一种方式，指在一个项目仓库（repo）中管理多个模块/包（package）

- 一个项目中可维护多个模块
- 方便版本管理和依赖管理，模块之间的引用、调用都非常方便

> 缺点则是仓库的体积会变大

## 2. Vue3 项目结构

- reactivity：响应式系统
- runtime-core：与平台无关的运行时核心（可以创建针对特定平台的运行时-自定义渲染器）
- runtime-dom：针对浏览器的运行时，包括 DOM API，属性，事件处理等
- runtime-test：用于测试
- server-renderer：用于服务端渲染
- compiler-core：与平台无关的编译器核心
- compiler-dom：针对浏览器的编译模块
- compiler-sfc：单文件解析
- compiler-ssr：服务器渲染的编译模块
- size-check：测试代码体积
- template-explorer：用于调试编译器输出的开发工具
- shared：多个包之间共享的内容
- vue：完整版本，包括运行时和编译器

## 相关依赖

- typescript：支持 ts
- rollup：打包工具
- rollup-plugin-typescript2：rollup 和 ts 的桥梁
- @rollup/plugin-node-resolve：解析 node 第三方模块
- @rollup/plugin-json：支持引入 json
- execa：开启子进程，方便执行命令
