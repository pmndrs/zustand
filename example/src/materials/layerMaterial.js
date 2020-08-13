import { shaderMaterial } from 'drei'
import { extend } from 'react-three-fiber'

const LayerMaterial = shaderMaterial(
  {
    textr: null,
    movementVector: [0, 0, 0],
    scaleFactor: 1,
    factor: 0, // how much the movement vector is multiplied by, 0 means no movement,
    wiggle: 0,
    time: 0,
  },
  `
    uniform float time;
    uniform vec2 resolution;
    uniform float wiggle;
    varying vec2 vUv;
    varying vec3 vNormal;

    void main()	{
      vUv = uv;
      float theta = sin( time + position.y ) / 2.0 * wiggle;
      float c = cos( theta );
      float s = sin( theta );
      mat3 m = mat3( c, 0, s, 0, 1, 0, -s, 0, c );
      vec3 transformed = vec3( position ) * m;
      vNormal = vNormal * m;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.);
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

    vec2 offsetUv(vec2 uv, vec3 movement, float factor) {
      return uv + movement.xy * factor;
    }

    void main()	{
      vec2 uv = offsetUv(vUv / scaleFactor, movementVector, factor);
      vec4 color = texture2D(textr, uv);
      float alpha = color.a;
      if (alpha < 0.1) discard;
      gl_FragColor = vec4(color.rgb, .1);
    }
`
)

extend({ LayerMaterial })
