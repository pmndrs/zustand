import { useState, useCallback, useRef } from 'react'
import { copyToClipboard } from '../utils/copy-to-clipboard'

/*
Isolated logic for the entire copy functionality instead
of a separate button component and with the added utility
*/
export default function CopyButton({ code, ...props }) {
  const [isCopied, setIsCopied] = useState(false)
  const timer = useRef()

  const handleCopy = useCallback(() => {
    clearTimeout(timer.current)
    copyToClipboard(code).then(() => {
      setIsCopied(true)
      timer.current = setTimeout(() => setIsCopied(false), 3000)
    })
  }, [code])

  return (
    <>
      <button className="copy-button" onClick={handleCopy} {...props}>
        {isCopied ? (
          'Copied!'
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={16}
              height={16}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              {...props}
            >
              <rect x={9} y={9} width={13} height={13} rx={2} ry={2} />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
          </>
        )}
      </button>
    </>
  )
}
