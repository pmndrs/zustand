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
    "src/vanilla.ts:104:17 - error TS2590: Expression produces a union type that is too complex to represent.

    104   createState ? createStoreImpl(createState) : createStoreImpl) as CreateStore
                        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

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


    Found 6 errors.

    "
  `)
})
