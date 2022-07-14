import { forwardRef } from 'react'
import { useThree } from '@react-three/fiber'
import { EffectComposer, DepthOfField, Vignette } from '@react-three/postprocessing'

const Effects = forwardRef((props, ref) => {
  const {
    viewport: { width, height },
  } = useThree()
  return (
    <EffectComposer multisampling={0}>
      <DepthOfField ref={ref} bokehScale={4} focalLength={0.1} resolutionX={width / 2} resolutionY={height / 2} />
      <Vignette />
    </EffectComposer>
  )
})

export default Effects
