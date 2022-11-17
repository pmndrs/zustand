/* eslint-disable react/no-multi-comp */
import './App.css'
import {
  AddBear,
  AddBee,
  NukeBears,
  NukeBees,
  RemoveBear,
  RemoveBee,
  ShowBears,
  ShowBees,
  SpecificBearsAmount,
  SpecificBeesAmount,
} from './components/ActionButtons'
import { Bears } from './components/Bears'
import { Bees } from './components/Bees'
import { useBearsStore } from './components/Bears/bear-store'
import React from 'react'

const App = () => {
  const isZeroBears = useBearsStore((state) => state.bears) === 0
  const isZeroBees = useBearsStore((state) => state.bears) === 0

  return (
    <div className="App">
      <ShowBears />
      <div className="actions">
        {isZeroBears ? null : <RemoveBear />}
        <AddBear />
        {isZeroBears ? null : <NukeBears />}
        <SpecificBearsAmount />
      </div>
      <br />
      <Bears />
      <br />
      <ShowBees />
      <div className="actions">
        {isZeroBees ? null : <RemoveBee />}
        <AddBee />
        {isZeroBees ? null : <NukeBees />}
        <SpecificBeesAmount />
      </div>
      <br />
      <Bees />
    </div>
  )
}

// eslint-disable-next-line import/no-default-export
export default App
