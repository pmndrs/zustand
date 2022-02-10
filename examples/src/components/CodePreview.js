import React from 'react'
import Highlight, { defaultProps } from 'prism-react-renderer'
import CopyButton from './CopyButton'
import 'prismjs'
import 'prismjs/components/prism-jsx.min'
import 'prismjs/themes/prism-okaidia.css'

export default function CodePreview({ code, ...props }) {
  return (
    <Highlight {...defaultProps} className="language-jsx" code={code} language="jsx" theme={undefined}>
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        // define how each line is to be rendered in the code block,
        // position is set to relative so the copy button can align to bottom right
        <pre className={className} style={{ ...style, position: 'relative' }}>
          {tokens.map((line, i) => (
            <div {...getLineProps({ line, key: i })}>
              {line.map((token, key) => (
                <span {...getTokenProps({ token, key })} />
              ))}
            </div>
          ))}
          <CopyButton code={code} />
        </pre>
      )}
    </Highlight>
  )
}
