import { exec as _exec } from 'child_process'
import { promisify } from 'util'
const exec = promisify(_exec)

jest.setTimeout(30_000)

it('tsc v4.3.5 --noEmit', async () => {
  let tscOutput = (
    await exec(
      './node_modules/typescript-4.3.5/bin/tsc --noEmit --pretty'
    ).catch((e) => Promise.resolve(e))
  ).stdout.replace(/\033\[\d+m/g, '')

  expect(tscOutput).toMatchInlineSnapshot(`
    "src/middleware/devtools.ts:188:9 - error TS2345: Argument of type '{ type: string; } | { type: undefined; } | undefined' is not assignable to parameter of type 'Action<unknown>'.
      Type 'undefined' is not assignable to type 'Action<unknown>'.

    188         nameOrAction === undefined
                ~~~~~~~~~~~~~~~~~~~~~~~~~~
    189           ? { type: anonymousActionType || 'anonymous' }
        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    ... 
    191           ? { type: nameOrAction }
        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    192           : nameOrAction,
        ~~~~~~~~~~~~~~~~~~~~~~~~

    src/middleware/redux.ts:49:72 - error TS2345: Argument of type 'A' is not assignable to parameter of type 'undefined'.
      Type 'Action' is not assignable to type 'undefined'.

    49     ;(set as NamedSet<S>)((state: S) => reducer(state, action), false, action)
                                                                              ~~~~~~

    src/vanilla.ts:104:17 - error TS2590: Expression produces a union type that is too complex to represent.

    104   createState ? createStoreImpl(createState) : createStoreImpl) as CreateStore
                        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    tests/devtools.test.tsx:91:40 - error TS2345: Argument of type '\\"testSetStateName\\"' is not assignable to parameter of type 'undefined'.

    91     api.setState({ count: 10 }, false, 'testSetStateName')
                                              ~~~~~~~~~~~~~~~~~~

    tests/devtools.test.tsx:97:40 - error TS2345: Argument of type '{ type: string; payload: number; }' is not assignable to parameter of type 'undefined'.

     97     api.setState({ count: 15 }, false, {
                                               ~
     98       type: 'testSetStateName',
        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     99       payload: 15,
        ~~~~~~~~~~~~~~~~~~
    100     })
        ~~~~~

    tests/devtools.test.tsx:106:9 - error TS2554: Expected 3-4 arguments, but got 2.

    106     api.setState({ count: 5, foo: 'baz' }, true)
                ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    tests/devtools.test.tsx:227:11 - error TS2554: Expected 3-4 arguments, but got 1.

    227       api.setState({ count: 1 })
                  ~~~~~~~~~~~~~~~~~~~~~~

    tests/devtools.test.tsx:243:11 - error TS2554: Expected 3-4 arguments, but got 1.

    243       api.setState({ count: 2 })
                  ~~~~~~~~~~~~~~~~~~~~~~

    tests/devtools.test.tsx:429:41 - error TS2345: Argument of type '\\"increment\\"' is not assignable to parameter of type 'undefined'.

    429       api.setState({ count: 1 }, false, 'increment')
                                                ~~~~~~~~~~~

    tests/devtools.test.tsx:439:41 - error TS2345: Argument of type '\\"increment\\"' is not assignable to parameter of type 'undefined'.

    439       api.setState({ count: 2 }, false, 'increment')
                                                ~~~~~~~~~~~

    tests/devtools.test.tsx:449:41 - error TS2345: Argument of type '\\"increment\\"' is not assignable to parameter of type 'undefined'.

    449       api.setState({ count: 3 }, false, 'increment')
                                                ~~~~~~~~~~~

    tests/devtools.test.tsx:467:5 - error TS2322: Type 'WithRedux<WithDevtools<StoreApi<Write<{ count: number; }, ReduxState<{ type: \\"INCREMENT\\"; } | { type: \\"DECREMENT\\"; }>>>>, { type: \\"INCREMENT\\"; } | { ...; }>' is not assignable to type 'StoreApi<{ count: number; dispatch: (action: { type: \\"INCREMENT\\"; } | { type: \\"DECREMENT\\"; }) => { type: \\"INCREMENT\\"; } | { type: \\"DECREMENT\\"; }; }>'.
      Types of property 'setState' are incompatible.
        Type '<A extends string | { type: unknown; }>(partial: Write<{ count: number; }, ReduxState<{ type: \\"INCREMENT\\"; } | { type: \\"DECREMENT\\"; }>> | Partial<Write<{ count: number; }, ReduxState<{ type: \\"INCREMENT\\"; } | { type: \\"DECREMENT\\"; }>>> | ((state: Write<...>) => Write<...> | Partial<...>), replace: boolean | undefined,...' is not assignable to type '(partial: { count: number; dispatch: (action: { type: \\"INCREMENT\\"; } | { type: \\"DECREMENT\\"; }) => { type: \\"INCREMENT\\"; } | { type: \\"DECREMENT\\"; }; } | Partial<{ count: number; dispatch: (action: { type: \\"INCREMENT\\"; } | { ...; }) => { ...; } | { ...; }; }> | ((state: { ...; }) => { ...; } | Partial<...>), replace?: ...'.

    467     api = create(
            ~~~

    tests/devtools.test.tsx:543:7 - error TS2554: Expected 3-4 arguments, but got 1.

    543   api.setState({ count: 1 })
              ~~~~~~~~~~~~~~~~~~~~~~

    tests/middlewareTypes.test.tsx:105:61 - error TS2345: Argument of type '\\"inc\\"' is not assignable to parameter of type 'undefined'.

    105           inc: () => set({ count: get().count + 1 }, false, 'inc'),
                                                                    ~~~~~

    tests/middlewareTypes.test.tsx:117:51 - error TS2345: Argument of type '\\"reset\\"' is not assignable to parameter of type 'undefined'.

    117       useBoundStore.setState({ count: 0 }, false, 'reset')
                                                          ~~~~~~~

    tests/middlewareTypes.test.tsx:122:11 - error TS2322: Type 'WithDevtools<StoreApi<{ count: number; }>>' is not assignable to type 'StoreApi<object>'.
      Types of property 'setState' are incompatible.
        Type '<A extends string | { type: unknown; }>(partial: { count: number; } | Partial<{ count: number; }> | ((state: { count: number; }) => { count: number; } | Partial<{ count: number; }>), replace: boolean | undefined, a1: undefined, action?: A | undefined) => void' is not assignable to type '(partial: object | ((state: object) => object), replace?: boolean | undefined) => void'.

    122     const _testSubtyping: StoreApi<object> = createVanilla(
                  ~~~~~~~~~~~~~~

    tests/middlewareTypes.test.tsx:275:17 - error TS2345: Argument of type '{ type: string; by: number; }' is not assignable to parameter of type 'undefined'.

    275                 { type: 'inc', by: 1 }
                        ~~~~~~~~~~~~~~~~~~~~~~

    tests/middlewareTypes.test.tsx:289:51 - error TS2345: Argument of type '\\"reset\\"' is not assignable to parameter of type 'undefined'.

    289       useBoundStore.setState({ count: 0 }, false, 'reset')
                                                          ~~~~~~~

    tests/middlewareTypes.test.tsx:318:51 - error TS2345: Argument of type '\\"reset\\"' is not assignable to parameter of type 'undefined'.

    318       useBoundStore.setState({ count: 0 }, false, 'reset')
                                                          ~~~~~~~

    tests/middlewareTypes.test.tsx:329:61 - error TS2345: Argument of type '\\"inc\\"' is not assignable to parameter of type 'undefined'.

    329           inc: () => set({ count: get().count + 1 }, false, 'inc'),
                                                                    ~~~~~

    tests/middlewareTypes.test.tsx:341:51 - error TS2345: Argument of type '\\"reset\\"' is not assignable to parameter of type 'undefined'.

    341       useBoundStore.setState({ count: 0 }, false, 'reset')
                                                          ~~~~~~~

    tests/middlewareTypes.test.tsx:377:61 - error TS2345: Argument of type '\\"inc\\"' is not assignable to parameter of type 'undefined'.

    377           inc: () => set({ count: get().count + 1 }, false, 'inc'),
                                                                    ~~~~~

    tests/middlewareTypes.test.tsx:393:51 - error TS2345: Argument of type '\\"reset\\"' is not assignable to parameter of type 'undefined'.

    393       useBoundStore.setState({ count: 0 }, false, 'reset')
                                                          ~~~~~~~

    tests/middlewareTypes.test.tsx:406:63 - error TS2345: Argument of type '\\"inc\\"' is not assignable to parameter of type 'undefined'.

    406             inc: () => set({ count: get().count + 1 }, false, 'inc'),
                                                                      ~~~~~

    tests/middlewareTypes.test.tsx:420:51 - error TS2345: Argument of type '\\"reset\\"' is not assignable to parameter of type 'undefined'.

    420       useBoundStore.setState({ count: 0 }, false, 'reset')
                                                          ~~~~~~~

    tests/middlewareTypes.test.tsx:445:15 - error TS2554: Expected 3-4 arguments, but got 1.

    445               set((state) => {
                      ~~~~~~~~~~~~~~~~
    446                 state.count = get().count + 1
        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    447               }),
        ~~~~~~~~~~~~~~~~

      src/middleware/immer.ts:45:11
        45           shouldReplace?: boolean | undefined,
                     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        An argument for 'shouldReplace' was not provided.

    tests/middlewareTypes.test.tsx:461:51 - error TS2345: Argument of type '\\"reset\\"' is not assignable to parameter of type 'undefined'.

    461       useBoundStore.setState({ count: 0 }, false, 'reset')
                                                          ~~~~~~~

    tests/middlewareTypes.test.tsx:474:63 - error TS2345: Argument of type '\\"inc\\"' is not assignable to parameter of type 'undefined'.

    474             inc: () => set({ count: get().count + 1 }, false, 'inc'),
                                                                      ~~~~~

    tests/middlewareTypes.test.tsx:491:51 - error TS2345: Argument of type '\\"reset\\"' is not assignable to parameter of type 'undefined'.

    491       useBoundStore.setState({ count: 0 }, false, 'reset')
                                                          ~~~~~~~

    tests/middlewareTypes.test.tsx:505:26 - error TS2554: Expected 3-4 arguments, but got 2.

    505               inc: () => set({ count: get().count + 1 }, false),
                                 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    tests/middlewareTypes.test.tsx:524:51 - error TS2345: Argument of type '\\"reset\\"' is not assignable to parameter of type 'undefined'.

    524       useBoundStore.setState({ count: 0 }, false, 'reset')
                                                          ~~~~~~~

    tests/middlewareTypes.test.tsx:550:17 - error TS2554: Expected 3-4 arguments, but got 1.

    550                 set((state) => {
                        ~~~~~~~~~~~~~~~~
    551                   state.count = get().count + 1
        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    552                 }),
        ~~~~~~~~~~~~~~~~~~

      src/middleware/immer.ts:45:11
        45           shouldReplace?: boolean | undefined,
                     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        An argument for 'shouldReplace' was not provided.

    tests/middlewareTypes.test.tsx:571:51 - error TS2345: Argument of type '\\"reset\\"' is not assignable to parameter of type 'undefined'.

    571       useBoundStore.setState({ count: 0 }, false, 'reset')
                                                          ~~~~~~~

    tests/types.test.tsx:109:5 - error TS2578: Unused '@ts-expect-error' directive.

    109     // @ts-expect-error we shouldn't be able to set count to undefined
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    tests/types.test.tsx:111:5 - error TS2578: Unused '@ts-expect-error' directive.

    111     // @ts-expect-error we shouldn't be able to set count to undefined
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    tests/types.test.tsx:127:3 - error TS2578: Unused '@ts-expect-error' directive.

    127   // @ts-expect-error type undefined is not assignable to type number
          ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    tests/types.test.tsx:129:3 - error TS2578: Unused '@ts-expect-error' directive.

    129   // @ts-expect-error type undefined is not assignable to type number
          ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    tsconfig.json:9:5 - error TS5023: Unknown compiler option 'exactOptionalPropertyTypes'.

    9     \\"exactOptionalPropertyTypes\\": true,
          ~~~~~~~~~~~~~~~~~~~~~~~~~~~~


    Found 38 errors.

    "
  `)
})
