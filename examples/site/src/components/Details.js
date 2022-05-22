import React from 'react'

export default function () {
  return (
    <>
      <a href="https://github.com/pmndrs/zustand" className="top-right" children="Github" />
      <div className="bottom">
        <a href="https://github.com/pmndrs/zustand/tree/main/examples" className="bottom-right" children="<Source />" />
        <a
          href="https://www.instagram.com/tina.henschel/"
          className="bottom-left"
          children="Illustrations @ Tina Henschel"
        />
      </div>
      <span className="header-left">Zustand</span>
    </>
  )
}
