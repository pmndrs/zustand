const shallow = <A, B>(_a: A, _b: B) => {
  if (is(_a, _b)) return true

  if (typeof _a !== 'object') return false
  if (typeof _b !== 'object') return false
  if (_a === null) return false
  if (_b === null) return false

  const a = _a as WidenTo<A, B>;
  const b = _b as WidenTo<B, A>;
  const aKeys = keys(a)
  const bKeys = keys(b)
  const checkedKeys = new Set<(keyof A | keyof B) & string>();
  
  for (const k of aKeys) {
    if (!is(a[k], b[k])) return false;
    checkedKeys.add(k)
  }

  for (const k of bKeys) {
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