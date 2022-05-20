import {useCounter} from './counter'
import {renderHook} from '@testing-library/react'

describe("Counter", () => {
  it('should have a 0 count', () => {
    const {result} = renderHook(useCounter)
    console.log(result)
  })
})
