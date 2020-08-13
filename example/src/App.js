import * as THREE from 'three'
import { BasicDepthPacking, HalfFloatType, RGBADepthPacking } from 'three'
import React, { Suspense, useRef, useMemo, useEffect, forwardRef } from 'react'
import {
  Canvas,
  useLoader,
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
  SavePass,
  VignetteEffect,
  BloomEffect,
  DepthOfFieldEffect,
  TextureEffect,
  BlendFunction,
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
  { url, factor = 1, offset = 1, ...props },
  forwardRef
) {
  const ref = useRef()
  const scale = useAspect('cover', 1600, 1000, 0.2)
  const texture = useLoader(THREE.TextureLoader, url)

  const vec = new THREE.Vector3()

  // useFrame(state => {
  //   ref.current.position.lerp(
  //     vec.set(state.mouse.x * offset, state.mouse.y * offset, 0),
  //     0.1
  //   )
  // })

  return (
    <group ref={ref}>
      <Plane
        scale={scale}
        {...props}
        ref={forwardRef}
        material-map={texture}
        material-transparent
      />
    </group>
  )
})

const DepthBufferMaterial = shaderMaterial(
  {
    time: 0,
    bg: null,
    stars: null,
    ground: null,
    bear: null,
    leaves1: null,
    leaves2: null,
  },
  `
  
  uniform float time;
  uniform vec2 resolution;

  varying vec2 vUv;

  void main()	{
      vUv = uv;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
  }

`,
  `

  uniform float time;
  uniform vec2 resolution;
  
  uniform sampler2D bg;
  uniform sampler2D stars;
  uniform sampler2D ground;
  uniform sampler2D bear;
  uniform sampler2D leaves1;
  uniform sampler2D leaves2;

  uniform vec2 mouse;

  varying vec2 vUv;

  #define TWO_PI 6.28318530718

  float getAlpha(sampler2D textr, vec2 uv) {

    return texture2D(textr, uv).a;

  }

  void main()	{

    float leaves1Alpha = getAlpha(leaves1, vUv);
    float leaves2Alpha = getAlpha(leaves2, vUv) * 0.9;
    float bearAlpha = getAlpha(bear, vUv) * (0.41);
    float groundAlpha = getAlpha(ground, vUv) * 0.4;
    float starsAlpha = getAlpha(stars, vUv) * 0.2;
    float bgAlpha = getAlpha(bg, vUv) * 0.01;

    float aaa = 0.;

    aaa = max(leaves1Alpha, aaa);
    aaa = max(leaves2Alpha, aaa);
    aaa = max(bearAlpha, aaa);
    aaa = max(groundAlpha, aaa);
    aaa = max(starsAlpha, aaa);
    aaa = max(bgAlpha, aaa);

    gl_FragColor = vec4(vec3(aaa), 1.);
    
  }

`
)

extend({ DepthBufferMaterial })

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

  return (
    <Suspense fallback={null}>
      <Img url={bgUrl} factor={0.2} position-z={0} />
      <Img url={starsUrl} factor={0.2} position-z={10} />
      <Img url={groundUrl} factor={0.2} position-z={20} />
      <Img url={bearUrl} ref={subject} position-z={30} />
      <Img url={leaves1Url} factor={0.2} position-z={40} />
      <Img url={leaves2Url} factor={0.2} position-z={49} offset={1} />

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
        <OrbitControls />
      </Canvas>
    </>
  )
}
