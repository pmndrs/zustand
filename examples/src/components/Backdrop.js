import React, { Suspense, useRef } from 'react'
import { Canvas } from 'react-three-fiber'
import Effects from './Effects'
import Scene from './Scene'

export default function Backdrop() {
  const dof = useRef()
  return (
    <Canvas
      className="canvas-container"
      orthographic
      gl={{ powerPreference: 'high-performance', antialias: false, stencil: false, alpha: false, depth: false }}
      camera={{ zoom: 5, position: [0, 0, 200], far: 300, near: 0 }}
    >
      <Suspense fallback={null}>
        <Scene dof={dof} />
      </Suspense>
      <Effects ref={dof} />
    </Canvas>
  )
}
