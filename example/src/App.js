import * as THREE from 'three'
import { HalfFloatType } from 'three'
import React, { Suspense, useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from 'react-three-fiber'
import create from 'zustand'

import { OrbitControls, Plane, Stats, useAspect, useTextureLoader } from 'drei'

// import {
//   EffectComposer,
//   RenderPass,
//   EffectPass,
//   DepthOfFieldEffect,
//   BloomEffect,
//   // eslint-disable-next-line
//   TextureEffect,
//   NoiseEffect,
//   VignetteEffect,
// } from 'postprocessing'

import {
  EffectComposer,
  Bloom,
  DepthOfField,
  Noise,
  Vignette,
} from 'react-postprocessing'

import PrismCode from 'react-prism'
import 'prismjs'
import 'prismjs/components/prism-jsx.min'
import 'prismjs/themes/prism-okaidia.css'

import bgUrl from './resources/bg.jpg'
import starsUrl from './resources/stars.png'
import groundUrl from './resources/ground.png'
import bearUrl from './resources/bear.png'
import leaves1Url from './resources/leaves1.png'
import leaves2Url from './resources/leaves2.png'

import './materials/layerMaterial'

const code = `import create from 'zustand'

const useStore = create(set => ({
  count: 1,
  inc: () => set(state => ({ count: state.count + 1 })),
  dec: () => set(state => ({ count: state.count - 1 })),
}))

function Counter() {
  const { count, inc, dec } = useStore()
  return (
    <>
      <h1>{count}</h1>
      <button onClick={inc}>up</button>
      <button onClick={dec}>down</button>
    </>
  )
}`

const [useStore] = create(set => ({
  count: 1,
  inc: () => set(state => ({ count: state.count + 1 })),
  dec: () => set(state => ({ count: state.count - 1 })),
}))

function Counter() {
  const { count, inc, dec } = useStore()
  return (
    <div class="counter">
      <span>{count}</span>
      <button onClick={inc}>up</button>
      <button onClick={dec}>down</button>
    </div>
  )
}

function Scene() {
  const [bg, stars, ground, bear, leaves1, leaves2] = useTextureLoader([
    bgUrl,
    starsUrl,
    groundUrl,
    bearUrl,
    leaves1Url,
    leaves2Url,
  ])

  // this ref will be used to focus the depth of field effect
  const subject = useRef()

  // holds mouse movement for parallax effect
  const movementVector = useRef(new THREE.Vector3(0))
  // this vector is only used for lerping the mov vector
  const tempVector = useRef(new THREE.Vector3(0))

  // holds a reference to the depth of field effect, used for focusing on the subject
  const depthOfFieldEffect = useRef()

  // this vector holds the current focus subject, that will be lerped towards the subject positin
  const focusVector = useRef(new THREE.Vector3(0))

  // lerp focus on subject
  useFrame(() => {
    if (subject.current && depthOfFieldEffect.current) {
      depthOfFieldEffect.current.target = focusVector.current.lerp(
        subject.current.position,
        0.05
      )
    }
  }, 1)

  // lerp mouse movement
  useFrame(state => {
    if (movementVector.current) {
      movementVector.current.lerp(
        tempVector.current.set(state.mouse.x * 1, state.mouse.y * 0.2, 0),
        0.1
      )
    }
  })

  const layers = [
    {
      texture: bg,
      z: 0,
      factor: 0.005,
    },
    {
      texture: stars,
      z: 10,
      factor: 0.005,
    },
    {
      texture: ground,
      z: 20,
    },
    {
      texture: bear,
      z: 30,
      ref: subject,
      scaleFactor: 0.9,
    },
    {
      texture: leaves1,
      factor: 0.03,
      scaleFactor: 1,
      z: 40,
    },
    {
      texture: leaves2,
      factor: 0.04,
      scaleFactor: 1.3,
      z: 49,
    },
  ]

  // scale the layers to cover the screen
  const scale = useAspect('cover', 1600, 1000, 0.2)

  return (
    <Suspense fallback={null}>
      {layers.map(({ texture, ref, factor = 0, scaleFactor = 1, z }, i) => (
        <Plane scale={scale} position-z={z} key={i} ref={ref}>
          <layerMaterial
            attach="material"
            movementVector={movementVector.current}
            textr={texture}
            factor={factor}
            scaleFactor={scaleFactor}
          />
        </Plane>
      ))}

      <EffectComposer>
        <Bloom luminanceThreshold={0.7} luminanceSmoothing={0.075} />
        <DepthOfField
          ref={depthOfFieldEffect}
          bokehScale={3}
          focalLength={0.1}
        />
        <Vignette />
        <Noise opacity={0.04} />
      </EffectComposer>

      <Stats />
    </Suspense>
  )
}

export default function App() {
  return (
    <>
      <Canvas
        gl={{
          powerPreference: 'high-performance',
          antialias: false,
          stencil: false,
          alpha: false,
          depth: true,
        }}
        pixelRatio={1}
        orthographic
        camera={{ zoom: 5, position: [0, 0, 50], far: 50, near: 0.00001 }}>
        <ambientLight />
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
        <OrbitControls />
      </Canvas>
    </>
  )
}
