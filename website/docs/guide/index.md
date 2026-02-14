# Markdown & MDX

Rspress supports not only Markdown but also [MDX](https://mdxjs.com/), a powerful way to develop content.

## Markdown

MDX is a superset of Markdown, which means you can write Markdown files as usual. For example:

```md
# Hello world
```

## Use component

When you want to use React components in Markdown files, you should name your files with `.mdx` extension. For example:

```mdx
// docs/index.mdx
import { CustomComponent } from './custom';

# Hello world

<CustomComponent />
```

## Front matter

You can add Front Matter at the beginning of your Markdown file, which is a YAML-formatted object that defines some metadata. For example:

```yaml
---
title: Hello world
---
```

> Note: By default, Rspress uses h1 headings as html headings.

You can also access properties defined in Front Matter in the body, for example:

```markdown
---
title: Hello world
---

# {frontmatter.title}
```

The previously defined properties will be passed to the component as `frontmatter` properties. So the final output will be:

```html
<h1>Hello world</h1>
```

## Custom container

You can use the `:::` syntax to create custom containers and support custom titles. For example:

**Input:**

```markdown
:::tip
This is a `block` of type `tip`
:::

:::info
This is a `block` of type `info`
:::

:::warning
This is a `block` of type `warning`
:::

:::danger
This is a `block` of type `danger`
:::

::: details
This is a `block` of type `details`
:::

:::tip Custom Title
This is a `block` of `Custom Title`
:::

:::tip{title="Custom Title"}
This is a `block` of `Custom Title`
:::
```

**Output:**

:::tip
This is a `block` of type `tip`
:::

:::info
This is a `block` of type `info`
:::

:::warning
This is a `block` of type `warning`
:::

:::danger
This is a `block` of type `danger`
:::

::: details
This is a `block` of type `details`
:::

:::tip Custom Title
This is a `block` of `Custom Title`
:::

:::tip{title="Custom Title"}
This is a `block` of `Custom Title`
:::

## Code block

### Basic usage

You can use the \`\`\` syntax to create code blocks and support custom titles. For example:

**Input:**

````md
```js
console.log('Hello World');
```

```js title="hello.js"
console.log('Hello World');
```
````

**Output:**

```js
console.log('Hello World');
```

```js title="hello.js"
console.log('Hello World');
```

### Show line numbers

If you want to display line numbers, you can enable the `showLineNumbers` option in the config file:

```ts title="rspress.config.ts"
export default {
  // ...
  markdown: {
    showLineNumbers: true,
  },
};
```

### Wrap code

If you want to wrap long code line by default, you can enable the `defaultWrapCode` option in the config file:

```ts title="rspress.config.ts"
export default {
  // ...
  markdown: {
    defaultWrapCode: true,
  },
};
```

### Line highlighting

You can also apply line highlighting and code block title at the same time, for example:

**Input:**

````md
```js title="hello.js"
console.log('Hello World'); // [\!code highlight]

// [\!code highlight:3]
const a = 1;

console.log(a);

const b = 2;

console.log(b);
```
````

:::warning
The backslash (`\`) in `[\!code highlight]` is for Markdown escaping to display the raw syntax. Do not include it when using this notation in your actual code.
:::

**Output:**

```js title="hello.js"
console.log('Hello World'); // [!code highlight]

// [!code highlight:3]
const a = 1;

console.log(a);

const b = 2;

console.log(b);
```

## Rustify MDX compiler

You can enable Rustify MDX compiler by following config:
