# 记录

## 区别介绍
- Vue3 源码使用 monorepo 的方式进行管理，将模块拆分到 packages 中
- Vue3 采用 ts 开发，增强类型检测。Vue2 则采用的是 flow
- Vue3 性能优化，支持 tree-shaking，没使用到的不会被打包

## 内部代码的优化
- Vue3 数据劫持的实现采用的 proxy，初始化不会递归，使用到的时候才会进行数据劫持。Vue2 使用的是 Object.defineProperty，初始化的时候需要递归进行数据劫持，如果数据层级多且复杂会存在性能缺陷。
- Vue3 中对模板编译进行了优化，编译的时候生成 Block Tree，可以对子节点的动态节点进行收集，这样可以减少比较，并且才有了 patchFlag 标记动态节点
- Vue3 采用 composition API 进行组织功能，有效解决反复横跳，优化复用逻辑。Vue2 使用的是 mixin 进行公共逻辑的复用，这样会造成数据来源不清晰，命名冲突等问题
- 增加了 Flagment，Teleport，Suspense 等组件


# Vue3 架构

## 1. Monorepo (要使用yarn)
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
- typescript：支持ts
- rollup：打包工具
- rollup-plugin-typescript2：rollup和ts的桥梁
- @rollup/plugin-node-resolve：解析node第三方模块
- @rollup/plugin-json：支持引入json
- execa：开启子进程，方便执行命令