export const copyToClipboard = (str) => {
  const el = document.createElement('textarea')
  el.value = str
  el.setAttribute('readonly', '')
  el.style.position = 'absolute'
  el.style.left = '-9999px'
  document.body.appendChild(el)
  el.select()
  // FIXME: might need to update this with the clipboard API in the future
  document.execCommand('copy')
  document.body.removeChild(el)
}
