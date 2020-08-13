import { shaderMaterial } from 'drei'
import { extend } from 'react-three-fiber'

import { offsetUVs } from './common'

const LayerMaterial = shaderMaterial(
  {
    textr: null,
    movementVector: [0, 0, 0],
    scaleFactor: 1,
    factor: 0, // how much the movement vector is multiplied by, 0 means no movement,
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
    uniform float factor;

    uniform float scaleFactor;
    uniform vec3 movementVector;
    

    uniform sampler2D textr;

    varying vec2 vUv;

    #define TWO_PI 6.28318530718

    ${offsetUVs}

    void main()	{

        vec2 uv = offsetUv(vUv / scaleFactor, movementVector, factor);

        vec4 color = texture2D(textr, uv);

        float alpha = color.a;

        if (alpha < 0.1) {
            discard;
        }

        gl_FragColor = vec4(color.rgb, .1);
    
    }

`
)

extend({ LayerMaterial })
