// Synchronous Thenable implementation from Zustand 5.0.15 (b57db4f).
// Keep this unmarked fixture unchanged to test interactions with older copies.
type Thenable<Value> = {
  then<V>(
    onFulfilled: (value: Value) => V | Promise<V> | Thenable<V>,
  ): Thenable<V>
  catch<V>(
    onRejected: (reason: Error) => V | Promise<V> | Thenable<V>,
  ): Thenable<V>
}

const toThenable =
  <Result, Input>(
    fn: (input: Input) => Result | Promise<Result> | Thenable<Result>,
  ) =>
  (input: Input): Thenable<Result> => {
    try {
      const result = fn(input)
      if (result instanceof Promise) {
        return result as Thenable<Result>
      }
      return {
        then(onFulfilled) {
          return toThenable(onFulfilled)(result as Result)
        },
        catch(_onRejected) {
          return this as Thenable<any>
        },
      }
    } catch (e: any) {
      return {
        then(_onFulfilled) {
          return this as Thenable<any>
        },
        catch(onRejected) {
          return toThenable(onRejected)(e)
        },
      }
    }
  }

export const legacyThenable: <Result, Input>(
  fn: (input: Input) => Result | Promise<Result> | Thenable<Result>,
) => (input: Input) => Thenable<Result> = toThenable
