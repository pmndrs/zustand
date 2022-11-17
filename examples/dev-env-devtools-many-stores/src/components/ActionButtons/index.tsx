/* eslint-disable react/no-multi-comp */
import { useBearsStore } from '../Bears/bear-store'
import { useBeesStore } from '../Bees/bees-store'
import React, { FC } from 'react'

export const ShowBears: FC = () => {
  const bears = useBearsStore((state) => state.bears)
  return <p>{bears} bears in the forest</p>
}

export const ShowBees: FC = () => {
  const bees = useBeesStore((state) => state.bees)
  return <p>{bees} bees in the forest</p>
}

export const AddBear: FC = () => {
  const incrementBear = useBearsStore((state) => state.increasePopulation)
  return (
    <button type="button" onClick={() => incrementBear()}>
      Add bear
    </button>
  )
}

export const RemoveBear: FC = () => {
  const removeBear = useBearsStore((state) => state.removeBear)

  return (
    <button type="button" onClick={() => removeBear()}>
      Remove bear
    </button>
  )
}

export const NukeBears: FC = () => {
  const removeAllBears = useBearsStore((state) => state.removeAllBears)
  return (
    <button type="button" onClick={() => removeAllBears()}>
      Nuke all bears
    </button>
  )
}

export const SpecificBearsAmount: FC = () => {
  const specificBearsAmount = useBearsStore(
    (state) => state.setSpecificBearsAmount
  )
  return (
    <button type="button" onClick={() => specificBearsAmount(25)}>
      Set 25 bears
    </button>
  )
}

export const AddBee: FC = () => {
  const incrementCat = useBeesStore((state) => state.increasePopulation)
  return (
    <button type="button" onClick={() => incrementCat()}>
      Add bee
    </button>
  )
}

export const RemoveBee: FC = () => {
  const removeCat = useBeesStore((state) => state.removeBee)

  return (
    <button type="button" onClick={() => removeCat()}>
      Remove bee
    </button>
  )
}

export const NukeBees: FC = () => {
  const removeAllBees = useBeesStore((state) => state.removeAllBees)
  return (
    <button type="button" onClick={() => removeAllBees()}>
      Nuke all bees
    </button>
  )
}

export const SpecificBeesAmount: FC = () => {
  const specificBeesAmount = useBeesStore(
    (state) => state.setSpecificBeesAmount
  )
  return (
    <button type="button" onClick={() => specificBeesAmount(25)}>
      Set 25 bees
    </button>
  )
}
