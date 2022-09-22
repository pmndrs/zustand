import * as THREE from 'three'
import { createRoot } from 'react-dom/client'
import { createRoot as createCanvasRoot, events, extend } from '@react-three/fiber'
import './styles.css'
import App from './App'
import Backdrop from './components/Backdrop'

const root = createRoot(document.getElementById('root'))

root.render(<App />)

// https://docs.pmnd.rs/react-three-fiber/api/canvas#custom-canvas
extend(THREE)

const backdrop = createCanvasRoot(document.getElementById('backdrop'))

backdrop
  .configure({
    events,
    orthographic: true,
    gl: { powerPreference: 'high-performance', antialias: false, stencil: false, alpha: false, depth: false },
    camera: { zoom: 5, position: [0, 0, 200], far: 300, near: 0 },
  })
  .render(<Backdrop />)

window.addEventListener('resize', () => {
  backdrop.configure({ width: window.innerWidth, height: window.innerHeight })
})
