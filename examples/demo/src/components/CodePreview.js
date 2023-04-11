import { create } from 'zustand'
import Highlight, { defaultProps } from 'prism-react-renderer'
import CopyButton from './CopyButton'
import SnippetLang from './SnippetLang'
import 'prismjs/themes/prism-okaidia.css'
// eslint-disable-next-line import/no-webpack-loader-syntax
import javascriptCode from '!!raw-loader!../resources/javascript-code.jsx'
// eslint-disable-next-line import/no-webpack-loader-syntax
import typescriptCode from '!!raw-loader!../resources/typescript-code.tsx'

const useStore = create((set, get) => ({
  lang: 'javascript',
  setLang: (lang) => set(() => ({ lang })),
  getCode: () => (get().lang === 'javascript' ? javascriptCode : typescriptCode),
}))

export default function CodePreview() {
  const { lang, setLang, getCode } = useStore()
  const code = getCode()

  return (
    <Highlight {...defaultProps} code={code} language="tsx" theme={undefined}>
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
          <div className="snippet-container">
            <SnippetLang lang={lang} setLang={setLang} />
            <CopyButton code={code} />
          </div>
        </pre>
      )}
    </Highlight>
  )
}
