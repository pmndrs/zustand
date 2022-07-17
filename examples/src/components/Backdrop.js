import { Suspense, useRef } from 'react'
import Effects from './Effects'
import Scene from './Scene'

export default function Backdrop() {
  const dof = useRef()

  return (
    <Suspense fallback={null}>
      <Scene dof={dof} />
      <Effects ref={dof} />
    </Suspense>
  )
}
