const shallow = <A, B>(_a: A, _b: B) => {
  if (is(_a, _b)) return true

  if (typeof _a !== 'object') return false
  if (typeof _b !== 'object') return false
  if (_a === null) return false
  if (_b === null) return false

  let a = _a as WidenTo<A, B>;
  let b = _b as WidenTo<B, A>;
  let aKeys = keys(a)
  let bKeys = keys(b)
  let checkedKeys = new Set<keyof A | keyof B>();
  
  for (let k of aKeys) {
    if (!is(a[k], b[k])) return false;
    checkedKeys.add(k)
  }

  for (let k of bKeys) {
    if (checkedKeys.has(k)) continue;
    if (!is(b[k], a[k])) return false;
  }

  return true
}

const is =
  Object.is as (a: unknown, b: unknown) => boolean;

const keys =
  Object.keys as <T>(t: T) => (keyof T & string)[];

type WidenTo<T, U> =
  T & { [K in keyof U]?: never }

export default shallow;