/*global navigator */

export const copyToClipboard = (str) => {
  return navigator.clipboard.writeText(str)
}
