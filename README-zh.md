<p align="center">
  <img src="./docs/bear.jpg" />
</p>

[![Build Status](https://img.shields.io/github/actions/workflow/status/pmndrs/zustand/test.yml?branch=main&style=flat&colorA=000000&colorB=000000)](https://github.com/pmndrs/zustand/actions?query=workflow%3ATest)
[![Build Size](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fdeno.bundlejs.com%2F%3Fq%3Dzustand&query=%24.size.uncompressedSize&style=flat&label=bundle%20size&colorA=000000&colorB=000000)](https://bundlejs.com/?q=zustand)
[![Version](https://img.shields.io/npm/v/zustand?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/zustand)
[![Downloads](https://img.shields.io/npm/dt/zustand.svg?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/zustand)
[![Discord Shield](https://img.shields.io/discord/740090768164651008?style=flat&colorA=000000&colorB=000000&label=discord&logo=discord&logoColor=ffffff)](https://discord.gg/poimandres)

<a href="https://dai-shi.github.io/zustand-banner-sponsorship/sponsors/" target="_blank" rel="noopener">
  <p align="center">
    <img src="https://dai-shi.github.io/zustand-banner-sponsorship/api/banner.png" />
  </p>
</a>

# Zustand

一个小型、快速、可扩展的状态管理解决方案，基于简化的 flux 原则。拥有基于 hooks 的舒适 API，没有样板代码，也不强制特定的使用方式。

不要因为它可爱就忽视它。它有相当强的能力，花了大量时间处理常见的陷阱，比如可怕的 [zombie child 问题](https://react-redux.js.org/api/hooks#stale-props-and-zombie-children)、[react 并发](https://github.com/bvaughn/rfcs/blob/useMutableSource/text/0000-use-mutable-source.md)，以及混合渲染器之间的 [context 丢失](https://github.com/facebook/react/issues/13332)。它可能是 React 领域中唯一能正确处理所有这些问题的状态管理器。

你可以尝试在线 [演示](https://zustand-demo.pmnd.rs/) 并阅读 [文档](https://zustand.docs.pmnd.rs/)。

```bash
npm install zustand
```

:warning: :warning: :warning: Zustand v5 已发布 :warning: :warning: :warning:
查看 [迁移指南](./docs/migrations/migrating-to-v5.md)

## 为什么选择 Zustand？

- 🐻 小巧而简洁
- 🚀 快速且可扩展
- 🎯 基于 hooks 的 API
- 💡 没有样板代码
- 🔒 类型安全
- 🔌 可组合
- 📦 支持 tree-shaking

## 快速开始

### 创建 store

```jsx
import { create } from 'zustand'

const useBearStore = create((set) => ({
  bears: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
}))
```

### 在组件中使用

```jsx
function BearCounter() {
  const bears = useBearStore((state) => state.bears)
  return <h1>{bears} bears around here...</h1>
}

function Controls() {
  const increasePopulation = useBearStore((state) => state.increasePopulation)
  return <button onClick={increasePopulation}>one up</button>
}
```

## 文档

- [介绍](./docs/introduction.md)
- [指南](./docs/guides/README.md)
- [API](./docs/api/README.md)
- [Recipes](./docs/recipes/README.md)
- [迁移指南](./docs/migrations/README.md)
- [常见问题](./docs/faq/README.md)

## 示例

- [演示](https://zustand-demo.pmnd.rs/)
- [示例代码](./examples)

## 贡献

欢迎贡献！请阅读 [贡献指南](./CONTRIBUTING.md) 了解如何参与。

## 许可证

MIT
