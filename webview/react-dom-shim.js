// ReactDOM Shim for esbuild
// Maps ReactDOM imports to the CDN-loaded global

export default window.ReactDOM;
export const { render, unmountComponentAtNode, findDOMNode, createPortal, flushSync } = window.ReactDOM;
