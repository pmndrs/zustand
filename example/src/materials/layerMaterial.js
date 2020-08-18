import { shaderMaterial } from 'drei'
import { extend } from 'react-three-fiber'

const LayerMaterial = shaderMaterial(
  { textr: null, movementVector: [0, 0, 0], scaleFactor: 1, factor: 0, wiggle: 0, time: 0 },
  ` uniform float time;
    uniform vec2 resolution;
    uniform float wiggle;
    varying vec2 vUv;
    varying vec3 vNormal;
    void main()	{
      vUv = uv;
      vec3 transformed = vec3(position);
      if (wiggle > 0.) {
        float theta = sin(time + position.y) / 2.0 * wiggle;
        float c = cos(theta);
        float s = sin(theta);
        mat3 m = mat3(c, 0, s, 0, 1, 0, -s, 0, c);
        transformed = transformed * m;
        vNormal = vNormal * m;
      }      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.);
    }`,
  ` uniform float time;
    uniform vec2 resolution;
    uniform float factor;
    uniform float scaleFactor;
    uniform vec3 movementVector;
    uniform sampler2D textr;
    varying vec2 vUv;
    void main()	{
      vec2 uv = vUv / scaleFactor + movementVector.xy * factor;
      vec4 color = texture2D(textr, uv);
      if (color.a < 0.1) discard;
      gl_FragColor = vec4(color.rgb, .1);
    }`
)

extend({ LayerMaterial })
