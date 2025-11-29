export default function Details() {
  return (
    <>
      <nav className="nav">
        <a href="https://zustand.docs.pmnd.rs/">Documentation</a>
        <a href="https://github.com/pmndrs/zustand">Github</a>
      </nav>
      <div className="bottom">
        <a
          href="https://github.com/pmndrs/zustand/tree/main/examples/demo"
          className="bottom-right"
        >
          {'<Source />'}
        </a>
        <a
          href="https://stackblitz.com/github/pmndrs/zustand/tree/main/examples/starter?file=src%2Findex.tsx"
          className="bottom-right"
        >
          {'<Playground />'}
        </a>
        <a
          href="https://www.instagram.com/tina.henschel/"
          className="bottom-left"
        >
          Illustrations @ Tina Henschel
        </a>
      </div>
      <span className="header-left">Zustand</span>
    </>
  )
}
