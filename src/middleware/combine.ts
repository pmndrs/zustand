import { GetState, SetState, State, StoreApi } from '../vanilla'
import { NamedSet } from './devtools'

type Combine<T, U> = Omit<T, keyof U> & U

export const combine =
  <PrimaryState extends State, SecondaryState extends State>(
    initialState: PrimaryState,
    create: (
      // Note: NamedSet added for convenience
      set: SetState<PrimaryState> & NamedSet<PrimaryState>,
      get: GetState<PrimaryState>,
      api: StoreApi<PrimaryState>
    ) => SecondaryState
  ) =>
  (
    set: SetState<Combine<PrimaryState, SecondaryState>>,
    get: GetState<Combine<PrimaryState, SecondaryState>>,
    api: StoreApi<Combine<PrimaryState, SecondaryState>>
  ) =>
    Object.assign(
      {},
      initialState,
      create(set as any, get as any, api as any)
    ) as Combine<PrimaryState, SecondaryState>
