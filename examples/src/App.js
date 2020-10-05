import * as THREE from 'three'
import React, { Suspense, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from 'react-three-fiber'
import { Plane, useAspect, useTextureLoader } from 'drei'
import { EffectComposer, DepthOfField, Vignette } from 'react-postprocessing'
import create from 'zustand'
import PrismCode from 'react-prism'
import 'prismjs'
import 'prismjs/components/prism-jsx.min'
import 'prismjs/themes/prism-okaidia.css'
import Fireflies from './components/Fireflies'
import bgUrl from './resources/bg.jpg'
import starsUrl from './resources/stars.png'
import groundUrl from './resources/ground.png'
import bearUrl from './resources/bear.png'
import leaves1Url from './resources/leaves1.png'
import leaves2Url from './resources/leaves2.png'
import code from './resources/code'
import './materials/layerMaterial'

const useStore = create((set) => ({
  count: 1,
  inc: () => set((state) => ({ count: state.count + 1 })),
}))

function Counter() {
  const { count, inc } = useStore()
  return (
    <div className="counter">
      <span>{count}</span>
      <button onClick={inc}>one up</button>
    </div>
  )
}

function Scene({ dof }) {
  const scaleN = useAspect('cover', 1600, 1000, 0.21)
  const scaleW = useAspect('cover', 2200, 1000, 0.21)
  const textures = useTextureLoader([bgUrl, starsUrl, groundUrl, bearUrl, leaves1Url, leaves2Url])
  const subject = useRef()
  const group = useRef()
  const layersRef = useRef([])
  const [movementVector] = useState(() => new THREE.Vector3())
  const [tempVector] = useState(() => new THREE.Vector3())
  const [focusVector] = useState(() => new THREE.Vector3())
  const layers = [
    { texture: textures[0], z: 0, factor: 0.005, scale: scaleW },
    { texture: textures[1], z: 10, factor: 0.005, scale: scaleW },
    { texture: textures[2], z: 20, scale: scaleW },
    { texture: textures[3], z: 30, ref: subject, scaleFactor: 0.83, scale: scaleN },
    { texture: textures[4], factor: 0.03, scaleFactor: 1, z: 40, wiggle: 0.24, scale: scaleW },
    { texture: textures[5], factor: 0.04, scaleFactor: 1.3, z: 49, wiggle: 0.3, scale: scaleW },
  ]

  useFrame((state, delta) => {
    dof.current.target = focusVector.lerp(subject.current.position, 0.05)
    movementVector.lerp(tempVector.set(state.mouse.x, state.mouse.y * 0.2, 0), 0.2)
    group.current.position.x = THREE.MathUtils.lerp(group.current.position.x, state.mouse.x * 20, 0.2)
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, state.mouse.y / 10, 0.2)
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, -state.mouse.x / 2, 0.2)
    layersRef.current[4].uniforms.time.value = layersRef.current[5].uniforms.time.value += delta
  }, 1)

  return (
    <group ref={group}>
      <Fireflies count={10} radius={80} colors={['orange']} />
      {layers.map(({ scale, texture, ref, factor = 0, scaleFactor = 1, wiggle = 0, z }, i) => (
        <Plane scale={scale} args={[1, 1, wiggle ? 10 : 1, wiggle ? 10 : 1]} position-z={z} key={i} ref={ref}>
          <layerMaterial
            attach="material"
            movementVector={movementVector}
            textr={texture}
            factor={factor}
            ref={(el) => (layersRef.current[i] = el)}
            wiggle={wiggle}
            scaleFactor={scaleFactor}
          />
        </Plane>
      ))}
    </group>
  )
}

const Effects = React.forwardRef((props, ref) => {
  const {
    viewport: { width, height },
  } = useThree()
  return (
    <EffectComposer multisampling={0}>
      <DepthOfField ref={ref} bokehScale={4} focalLength={0.1} width={width / 2} height={height / 2} />
      <Vignette />
    </EffectComposer>
  )
})

export default function App() {
  const dof = useRef()
  return (
    <>
      <Canvas
        className="canvas-container"
        orthographic
        gl={{ powerPreference: 'high-performance', antialias: false, stencil: false, alpha: false, depth: false }}
        camera={{ zoom: 5, position: [0, 0, 200], far: 300, near: 0 }}>
        <Suspense fallback={null}>
          <Scene dof={dof} />
        </Suspense>
        <Effects ref={dof} />
      </Canvas>
      <div className="main">
        <div className="code">
          <div className="code-container">
            <PrismCode className="language-jsx" children={code} />
            <Counter />
          </div>
        </div>

        <a href="https://github.com/drcmda/zustand" className="top-right" children="Github" />
        <div className="bottom">
          <a href="https://codesandbox.io/s/xgjtc" className="bottom-right" children="<Source />" />
          <a
            href="https://www.instagram.com/tina.henschel/"
            className="bottom-left"
            children="Illustrations @ Tina Henschel"
          />
        </div>
        <span className="header-left">Zustand</span>
      </div>
    </>
  )
}
