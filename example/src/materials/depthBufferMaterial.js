/**
 *
 * This is the shader material used to build the depth map for the DepthOfField effect.
 *
 */
import { shaderMaterial } from 'drei'
import { extend } from 'react-three-fiber'

import { offsetUVs } from './common'

const DepthBufferMaterial = shaderMaterial(
  {
    time: 0,

    movementVector: [0, 0, 0],

    bg: null,
    stars: null,
    ground: null,
    bear: null,
    leaves1: null,
    leaves2: null,

    scaleFactors: [],
    movementFactors: [],
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
    
    uniform vec3 movementVector;
    
    uniform sampler2D bg;
    uniform sampler2D stars;
    uniform sampler2D ground;
    uniform sampler2D bear;
    uniform sampler2D leaves1;
    uniform sampler2D leaves2;

    uniform float scaleFactors[6];
    uniform float movementFactors[6];
  
    uniform vec2 mouse;
  
    varying vec2 vUv;
  
    #define TWO_PI 6.28318530718
  
    float getAlpha(sampler2D textr, vec2 uv) {
  
      return ceil(texture2D(textr, uv).a);
  
    }
  
    ${offsetUVs}
  
    void main()	{
  
      vec2 uv = vUv;

      float leaves2Alpha = getAlpha(leaves2, offsetUv(vUv / scaleFactors[5], movementVector, movementFactors[5]));
      float leaves1Alpha = getAlpha(leaves1, offsetUv(vUv / scaleFactors[4], movementVector, movementFactors[4])) * .9;
      
      // bear and ground don't move
      float bearAlpha = getAlpha(bear, vUv / scaleFactors[3]) * 0.41;
      float groundAlpha = getAlpha(ground, vUv / scaleFactors[2]) * 0.4;
      
      float starsAlpha = getAlpha(stars, offsetUv(vUv / scaleFactors[1], movementVector, movementFactors[1])) * 0.2;
  
      float bgAlpha = getAlpha(bg, offsetUv(vUv / scaleFactors[0], movementVector, movementFactors[0])) * 0.01;
  
      // make the actual depth map
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
