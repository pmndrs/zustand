import {BrowserRouter, Link, Routes, Route }from 'react-router-dom'
import { CounterPage } from './counter'

const Home = () => {
  return <div style={{
    display:"flex",
    gap: 24,
    alignItems:'center',
    justifyContent:'center',
    minHeight:'100vh'
  }}>
    <Link to={'/counter'}>
      Counter
    </Link>
    <Link to={'/context-counter'}>
      Context Counter
    </Link>
    <Link to={'/tabs'}>
      Tabs
    </Link>
  </div>
}

export const Pages = () => {
  return <BrowserRouter>
    <Routes>
      <Route path={"/"} element={<Home/>} />
      <Route path={"/counter"} element={<CounterPage/>} />
    </Routes>
  </BrowserRouter>
}