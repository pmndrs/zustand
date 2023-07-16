export default function Details() {
  return (
    <>
      <nav className="nav">
        <a href="https://docs.pmnd.rs/zustand" children="Documentation" />
        <a href="https://github.com/pmndrs/zustand" children="Github" />
      </nav>
      <div className="bottom">
        <a href="https://github.com/pmndrs/zustand/tree/main/examples/demo" className="bottom-right" children="<Source />" />
        <a href="https://www.instagram.com/tina.henschel/" className="bottom-left" children="Illustrations @ Tina Henschel" />
      </div>
      <span className="header-left">Zustand</span>
    </>
  )
}
