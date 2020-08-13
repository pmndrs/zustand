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

import { Plane, shaderMaterial, Stats, useAspect, useTextureLoader } from 'drei'

import { Controls, useControl } from 'react-three-gui'
import {
  EffectComposer,
  RenderPass,
  DepthPass,
  EffectPass,
  DepthOfFieldEffect,
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

const Img = forwardRef(function Img(
  {
    url,
    factor = 0,
    offset = 1,
    scaleFactor,
    movementVector,
    texture,
    ...props
  },
  forwardRef
) {
  const mat = useRef()
  const scale = useAspect('cover', 1600, 1000, 0.2)

  useEffect(() => {
    mat.current.uniforms.textr.value = texture
  }, [texture])

  return (
    <group position={props.transformedPosition}>
      <Plane scale={scale} {...props} ref={forwardRef}>
        <layerMaterial
          attach="material"
          movementVector={movementVector.current}
          ref={mat}
          factor={factor}
          scaleFactor={scaleFactor}
        />
      </Plane>
    </group>
  )
})

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
      bokehScale: 4,
      focalLength: 0.1,
      focusDistance: 0.1,
    })

    // 3. compose effect pass
    const effectsPass = new EffectPass(
      camera,
      depthOfFieldEffect

      // I use this effect to overlay my generated texture for debugging purposes
      // new TextureEffect({
      //   texture: renderTarget.texture,
      //   blendFunction: BlendFunction.SOFT_LIGHT,
      // })
    )

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

  const vec = useRef(new THREE.Vector3(0))
  const vec2 = useRef(new THREE.Vector3(0))

  useFrame(state => {
    if (vec.current) {
      vec.current.lerp(
        vec2.current.set(state.mouse.x * 1, state.mouse.y * 0.2, 0),
        1
      )

      depth.current.uniforms.movementVector.value = vec.current
    }
  })

  return (
    <Suspense fallback={null}>
      <Img movementVector={vec} texture={bg} factor={0.01} position-z={0} />
      <Img movementVector={vec} texture={stars} factor={0.01} position-z={10} />
      <Img movementVector={vec} texture={ground} factor={0} position-z={20} />
      <Img movementVector={vec} texture={bear} ref={subject} position-z={30} />
      <Img
        movementVector={vec}
        texture={leaves1}
        factor={0.1}
        position-z={40}
      />
      <Img
        movementVector={vec}
        texture={leaves2}
        factor={0.12}
        position-z={49}
        offset={1}
      />

      {createPortal(
        <Plane position={[0, 0, 20]} args={[1, 1]} scale={scale}>
          <depthBufferMaterial
            attach="material"
            bg={bg}
            stars={stars}
            ground={ground}
            bear={bear}
            leaves1={leaves1}
            leaves2={leaves2}
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
      </Canvas>
    </>
  )
}
