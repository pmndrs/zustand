import * as THREE from 'three'
import React, { Suspense, useRef, useState } from 'react'
import { Canvas, useFrame } from 'react-three-fiber'
import { Plane, useAspect, useTextureLoader } from 'drei'
import { EffectComposer, Bloom, DepthOfField, Noise, Vignette } from 'react-postprocessing'
import bgUrl from './resources/bg.jpg'
import starsUrl from './resources/stars.png'
import groundUrl from './resources/ground.png'
import bearUrl from './resources/bear.png'
import leaves1Url from './resources/leaves1.png'
import leaves2Url from './resources/leaves2.png'
import './materials/layerMaterial'

function Scene() {
  const scale = useAspect('cover', 1600, 1000, 0.21)
  const [bg, stars, ground, bear, leaves1, leaves2] = useTextureLoader([
    bgUrl,
    starsUrl,
    groundUrl,
    bearUrl,
    leaves1Url,
    leaves2Url,
  ])
  const dof = useRef()
  const subject = useRef()
  const group = useRef()
  const layersRef = useRef([])
  const [movementVector] = useState(() => new THREE.Vector3())
  const [tempVector] = useState(() => new THREE.Vector3())
  const [focusVector] = useState(() => new THREE.Vector3())
  const layers = [
    { texture: bg, z: 0, factor: 0.005 },
    { texture: stars, z: 10, factor: 0.005 },
    { texture: ground, z: 20 },
    { texture: bear, z: 30, ref: subject, scaleFactor: 0.83 },
    { texture: leaves1, factor: 0.03, scaleFactor: 1, z: 40, wiggle: 0.24 },
    { texture: leaves2, factor: 0.04, scaleFactor: 1.3, z: 49, wiggle: 0.24 },
  ]

  useFrame(({ clock, mouse }) => {
    dof.current.target = focusVector.lerp(subject.current.position, 0.05)
    movementVector.lerp(tempVector.set(mouse.x, mouse.y * 0.2, 0), 0.1)
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, mouse.x / 2, 0.1)
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -mouse.y / 2, 0.1)
    layersRef.current.forEach(layer => (layer.uniforms.time.value += 0.04))
  }, 1)

  return (
    <group ref={group}>
      {layers.map(({ texture, ref, factor = 0, scaleFactor = 1, wiggle = 0, z }, i) => (
        <Plane scale={scale} args={[1, 1, 10, 10]} position-z={z} key={i} ref={ref}>
          <layerMaterial
            attach="material"
            movementVector={movementVector.current}
            textr={texture}
            factor={factor}
            ref={el => (layersRef.current[i] = el)}
            wiggle={wiggle}
            scaleFactor={scaleFactor}
          />
        </Plane>
      ))}
      <EffectComposer>
        <Bloom luminanceThreshold={0.7} luminanceSmoothing={0.075} />
        <DepthOfField ref={dof} bokehScale={3} focalLength={0.1} />
        <Vignette />
        <Noise opacity={0.04} />
      </EffectComposer>
    </group>
  )
}

export default function App() {
  return (
    <Canvas
      gl={{ powerPreference: 'high-performance', antialias: false, stencil: false, alpha: false, depth: false }}
      orthographic
      camera={{ zoom: 5, position: [0, 0, 200], far: 200, near: 0.00001 }}>
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </Canvas>
  )
}
