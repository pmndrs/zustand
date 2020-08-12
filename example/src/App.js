import * as THREE from 'three'
import React, { Suspense, useRef } from 'react'
import { Canvas, useLoader, useFrame } from 'react-three-fiber'
import create from 'zustand'
import { useAspect } from 'drei'
import {
  EffectComposer,
  DepthOfField,
  Depth,
  Bloom,
  Noise,
  Vignette,
} from 'react-postprocessing'
import { Controls, useControl } from 'react-three-gui'

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

function Img({ url, factor = 1, offset = 1, ...props }) {
  const ref = useRef()
  const scale = useAspect('cover', 1600, 1000, factor)
  const texture = useLoader(THREE.TextureLoader, url)

  const vec = new THREE.Vector3()

  useFrame(state => {
    ref.current.position.lerp(
      vec.set(state.mouse.x * offset, state.mouse.y * offset, 0),
      0.1
    )
  })
  return (
    <group ref={ref}>
      <mesh scale={scale} {...props}>
        <planeBufferGeometry attach="geometry" args={[1, 1]} />
        <meshStandardMaterial attach="material" map={texture} transparent />
      </mesh>
    </group>
  )
}

function Effects() {
  const focusDistance = useControl('focus distance', {
    type: 'number',
    min: 0,
    max: 1000,
  })
  const focalLength = useControl('focal length', {
    type: 'number',
    min: 0,
    max: 1000,
  })
  const bokehScale = useControl('bokeh scale', {
    type: 'number',
    min: 0,
    max: 1000,
  })
  return (
    <EffectComposer>
      <DepthOfField
        focusDistance={focusDistance / 10000}
        focalLength={focalLength / 10000}
        bokehScale={bokehScale / 100}
        height={480}
        target={[0, 0, 0]}
      />
    </EffectComposer>
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
        camera={{ zoom: 5, position: [0, 0, 50], far: 200, near: 0.00001 }}>
        <ambientLight />
        <Suspense fallback={null}>
          <Img url={bgUrl} factor={0.2} position-z={0} />
          <Img url={starsUrl} factor={0.2} position-z={10} />
          <Img url={groundUrl} factor={0.2} position-z={20} />
          <Img url={bearUrl} factor={0.15} position-z={30} />
          <Img url={leaves1Url} factor={0.2} position-z={40} />
          <Img url={leaves2Url} factor={0.2} position-z={50} offset={1} />
        </Suspense>
        <Effects />
      </Canvas>
      <Controls />
    </>
  )
}
