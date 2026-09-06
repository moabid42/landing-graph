import { Component } from 'react'

// A thrown render error would otherwise leave a blank page with the reason
// only in the console. Each boundary swaps its own subtree for a note, so a
// broken diagram or a broken timeline never takes the rest of the page down.
//
// Bad *content* does not come through here — content/*.md problems are
// collected into PROBLEMS and rendered as a banner above the graph.
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[landing-graph] render failed', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="err-boundary" role="alert">
        <strong>{this.props.label ?? 'This section'} failed to render.</strong>
        <p>
          The rest of the page still works. The details are in the browser
          console.
        </p>
        <code>{String(this.state.error.message || this.state.error)}</code>
      </div>
    )
  }
}
