import * as THREE from 'three'
import { BasicDepthPacking, HalfFloatType } from 'three'
import React, { Suspense, useRef, useMemo, useEffect, forwardRef } from 'react'
import {
  Canvas,
  useFrame,
  extend,
  createPortal,
  useThree,
} from 'react-three-fiber'
import create from 'zustand'

import {
  OrbitControls,
  Plane,
  shaderMaterial,
  Stats,
  useAspect,
  useTextureLoader,
} from 'drei'

import { Controls, useControl } from 'react-three-gui'
import {
  EffectComposer,
  RenderPass,
  DepthPass,
  EffectPass,
  DepthOfFieldEffect,
  BloomEffect,
  TextureEffect,
  BlendFunction,
  NoiseEffect,
} from 'postprocessing'

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

import './materials/depthBufferMaterial'
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
  const depth = useRef()
  const subject = useRef()

  const scale = useAspect('cover', 1600, 1000, 0.2)

  const { gl, scene, size, camera } = useThree()

  const [targetScene, renderTarget] = useMemo(() => {
    const scene = new THREE.Scene()
    const target = new THREE.WebGLMultisampleRenderTarget(1600, 1000, {
      format: THREE.RGBFormat,
      stencilBuffer: false,
    })
    target.samples = 8
    return [scene, target]
  }, [])

  useFrame(state => {
    state.gl.setRenderTarget(renderTarget)
    state.gl.render(targetScene, camera)
    state.gl.setRenderTarget(null)
  })

  const [composer, depthOfFieldEffect] = useMemo(() => {
    const composer = new EffectComposer(gl, { frameBufferType: HalfFloatType })

    // 1. setup passes
    const renderPass = new RenderPass(scene, camera)
    const depthPass = new DepthPass(scene, camera)

    // 2. get a reference to the DoF effect for later
    const depthOfFieldEffect = new DepthOfFieldEffect(camera, {
      bokehScale: 5,
      focalLength: 0.1,
      focusDistance: 0.1,
    })

    // 3. compose effect pass
    const effectsPass = new EffectPass(
      camera,
      depthOfFieldEffect,
      new BloomEffect()
      // I use this effect to overlay my generated texture for debugging purposes
    )

    // effectPass.push(new TextureEffect({ texture: renderTarget.texture, }))

    // manually set depth texture
    effectsPass.setDepthTexture(renderTarget.texture, BasicDepthPacking)

    composer.addPass(renderPass)
    // composer.addPass(depthPass)
    composer.addPass(effectsPass)

    return [composer, depthOfFieldEffect]
  }, [camera, gl, scene, targetScene])

  useEffect(() => {
    composer.setSize(size.width, size.height)
  }, [composer, size])

  useFrame((_, delta) => {
    if (subject.current) {
      depthOfFieldEffect.target = subject.current.position
    }

    depth.current.uniforms.time.value += 0.1

    void composer.render(delta)
  }, 1)

  // holds mouse movement for parallax effect
  const movementVector = useRef(new THREE.Vector3(0))
  // this vector is only used for lerping
  const tempVector = useRef(new THREE.Vector3(0))

  useFrame(state => {
    if (movementVector.current) {
      movementVector.current.lerp(
        tempVector.current.set(state.mouse.x * 1, state.mouse.y * 0.2, 0),
        0.1
      )

      depth.current.uniforms.movementVector.value = movementVector.current
    }
  })

  const layers = [
    {
      texture: bg,
      z: 0,
      factor: 0.01,
    },
    {
      texture: stars,
      z: 10,
      factor: 0.02,
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
      factor: 0.1,
      scaleFactor: 1,
      z: 40,
    },
    {
      texture: leaves2,
      factor: 0.12,
      scaleFactor: 1.1,
      z: 49,
    },
  ]

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

      {createPortal(
        <Plane position={[0, 0, 20]} scale={scale}>
          <depthBufferMaterial
            attach="material"
            bg={bg}
            stars={stars}
            ground={ground}
            bear={bear}
            leaves1={leaves1}
            leaves2={leaves2}
            scaleFactors={layers.reduce((factors, layer) => {
              factors.push(layer.scaleFactor || 1)
              return factors
            }, [])}
            movementFactors={layers.reduce((factors, layer) => {
              factors.push(layer.factor || 1)
              return factors
            }, [])}
            ref={depth}
          />
        </Plane>,
        targetScene
      )}

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
