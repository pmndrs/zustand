export default function CopyLang({ lang, setLang }) {
  return (
    <select className="copy-lang" value={lang} onChange={(e) => setLang(e.currentTarget.value)}>
      <option value="javascript">JavaScript</option>
      <option value="typescript">TypeScript</option>
    </select>
  )
}
