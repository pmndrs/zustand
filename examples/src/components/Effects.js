import React from 'react'
import { useThree } from 'react-three-fiber'
import { EffectComposer, DepthOfField, Vignette } from 'react-postprocessing'

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

export default Effects
