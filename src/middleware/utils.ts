export const emitter = <L extends (...a: never[]) => void>(listeners: Set<L>) => {
  return ({
    emit: (...a: Parameters<L>) => listeners.forEach(f => f(...a)),
    subscribe: (listener: L) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    }
  })
}

export interface Thenable<T>
  { then: <U>(onFulfilled: (value: T) => U | Promise<U> | Thenable<U>) =>
      Thenable<U>
  , catch: <U>(onRejected: (error: unknown) => U | Promise<U> | Thenable<U>) =>
      Thenable<U>
  , throw: () => Thenable<T>
  }

export const thenablify =
  <A extends unknown[], R>
    (f: (...a: A) => R | Promise<R> | Thenable<R>) =>
      (...a: A): Thenable<R> => {

  try {
    const r = f(...a)
    if (hasThen(r)) return r as Thenable<R>

    return {
      then(f) { return thenablify(f)(r) },
      catch() { return this as Thenable<never> },
      throw() { return this }
    }
  } catch (error) {
    return {
      then() { return this as Thenable<never> },
      catch(f) { return thenablify(f)(error) },
      throw() { throw error; }
    }
  }
}

const hasThen = (t: unknown): t is { then: unknown } =>
  (t as any).then !== undefined
