import { Vector3, CatmullRomCurve3 } from 'three'
import React, { useRef, useMemo } from 'react'
import { extend, useFrame } from '@react-three/fiber'
import * as meshline from 'meshline'

extend(meshline)

const r = () => Math.max(0.2, Math.random())

function Fatline({ curve, width, color }) {
  const material = useRef()
  useFrame((state, delta) => (material.current.uniforms.dashOffset.value -= delta / 100))
  return (
    <mesh>
      <meshLineGeometry points={curve} />
      <meshLineMaterial ref={material} transparent lineWidth={0.01} color={color} dashArray={0.1} dashRatio={0.99} />
    </mesh>
  )
}

export default function Fireflies({ count, colors, radius = 10 }) {
  const lines = useMemo(
    () =>
      new Array(count).fill().map((_, index) => {
        const pos = new Vector3(Math.sin(0) * radius * r(), Math.cos(0) * radius * r(), 0)
        const points = new Array(30).fill().map((_, index) => {
          const angle = (index / 20) * Math.PI * 2
          return pos.add(new Vector3(Math.sin(angle) * radius * r(), Math.cos(angle) * radius * r(), 0)).clone()
        })
        const curve = new CatmullRomCurve3(points).getPoints(100)
        return {
          color: colors[parseInt(colors.length * Math.random())],
          curve,
        }
      }),
    [count, radius, colors],
  )
  return (
    <group position={[-radius * 2, -radius, 0]}>
      {lines.map((props, index) => (
        <Fatline key={index} {...props} />
      ))}
    </group>
  )
}
