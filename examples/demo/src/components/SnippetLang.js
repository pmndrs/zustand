export default function SnippetLang({ lang, setLang }) {
  return (
    <select className="snippet-lang" value={lang} onChange={(e) => setLang(e.currentTarget.value)}>
      <option value="javascript">JavaScript</option>
      <option value="typescript">TypeScript</option>
    </select>
  )
}
