import React, { useEffect, useState } from 'react'
import Highlight, { defaultProps } from 'prism-react-renderer'
import { CopyButton } from './CopyButton'
import 'prismjs'
import 'prismjs/components/prism-jsx.min'
import 'prismjs/themes/prism-okaidia.css'

function CodePreview({ code, ...props }) {
  // There's an issue with preview mount with the current `prism-react-renderer`
  // Fixes https://github.com/pmndrs/zustand/pull/503#issuecomment-884536093
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => {
      setMounted(false)
    }
  }, [])

  if (!mounted) {
    return <></>
  }

  return (
    <Highlight {...defaultProps} className="language-jsx" code={code} language="jsx" theme={undefined}>
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        // define how each line is to be rendered in the code block,
        // position is set to relative so the copy button can align to bottom right
        <code className={className} style={{ ...style, position: 'relative' }}>
          {tokens.map((line, i) => (
            <div {...getLineProps({ line, key: i })}>
              {line.map((token, key) => (
                <span {...getTokenProps({ token, key })} />
              ))}
            </div>
          ))}
          <CopyButton code={code} />
        </code>
      )}
    </Highlight>
  )
}
export default CodePreview
