## Map and Set Usage

You need to wrap Maps and Sets inside an object, and when you want it's update to be reflected (e.g. in React),
one way you can do it is calling the setState on it:

```js
import create from "zustand";

const useFooBar = create(() => ({ foo: new Map(), bar: new Set() }));

const { getState: getFooBar, setState: setFooBar } = useFooBar;
  
function doSomething() {
  // Following React's best practices, you should create a new Map/Set when updating them:
  const foo = new Map(useFooBar.getState().foo);
  const bar = new Set(getFooBar().bar);
  
  // use foo/bar...
  
  bar.set("bar");
  foo.set("foo", "bar");
  foo.delete("foo");
  
  // If you want to update some React component that uses `useFooBar`, you have to call setState
  // to let React know that an update happened:
  setFooBar({ foo, set });
}
```

This will not work if you want to tell React there was an update:

```js
import create from "zustand";

const useFoo = create(() => new Map());

function doSomething() {
  // everything else corrected to follow the example above...

  foo.set("foo", "bar");
    
  // To update, you just call setState, and it will be updated.
  setFooBar({ foo, set });

  // However, the above setState (setFooBar) will NOT communicate React that there was an update!
  // You need to have it wrapped inside an object!
}
```
