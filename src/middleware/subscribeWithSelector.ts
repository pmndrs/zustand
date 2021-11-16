import {
  EqualityChecker,
  GetState,
  SetState,
  State,
  StateListener,
  StateSelector,
  StateSliceListener,
  StoreApi,
  Subscribe,
} from '../vanilla'

export type StoreApiWithSubscribeWithSelector<T extends State> = Omit<
  StoreApi<T>,
  'subscribe' // FIXME remove omit in v4
> & {
  subscribe: {
    (listener: StateListener<T>): () => void
    <StateSlice>(
      selector: StateSelector<T, StateSlice>,
      listener: StateSliceListener<StateSlice>,
      options?: {
        equalityFn?: EqualityChecker<StateSlice>
        fireImmediately?: boolean
      }
    ): () => void
  }
}

export const subscribeWithSelector =
  <
    S extends State,
    CustomSetState extends SetState<S>,
    CustomGetState extends GetState<S>,
    CustomStoreApi extends StoreApi<S>
  >(
    fn: (set: CustomSetState, get: CustomGetState, api: CustomStoreApi) => S
  ) =>
  (
    set: CustomSetState,
    get: CustomGetState,
    api: Omit<CustomStoreApi, 'subscribe'> & // FIXME remove omit in v4
      StoreApiWithSubscribeWithSelector<S>
  ): S => {
    const origSubscribe = api.subscribe as Subscribe<S>
    api.subscribe = ((selector: any, optListener: any, options: any) => {
      let listener: StateListener<S> = selector // if no selector
      if (optListener) {
        const equalityFn = options?.equalityFn || Object.is
        let currentSlice = selector(api.getState())
        listener = (state) => {
          const nextSlice = selector(state)
          if (!equalityFn(currentSlice, nextSlice)) {
            const previousSlice = currentSlice
            optListener((currentSlice = nextSlice), previousSlice)
          }
        }
        if (options?.fireImmediately) {
          optListener(currentSlice, currentSlice)
        }
      }
      return origSubscribe(listener)
    }) as any
    const initialState = fn(
      set,
      get,
      api as CustomStoreApi // FIXME can remove in v4?
    )
    return initialState
  }
