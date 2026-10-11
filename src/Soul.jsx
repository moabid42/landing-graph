import Markdown from './markdown.jsx'
import body from '../content/soul.md?raw'

export default function Soul() {
  return <Markdown src={body.replace(/<!--[\s\S]*?-->/g, '')} />
}
