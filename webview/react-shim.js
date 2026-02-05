// React Shim for esbuild
// Maps React imports to the CDN-loaded global

export default window.React;
export const { 
    Component, 
    PureComponent, 
    createElement, 
    createContext,
    createRef,
    forwardRef,
    Fragment,
    useCallback,
    useContext,
    useEffect,
    useImperativeHandle,
    useLayoutEffect,
    useMemo,
    useReducer,
    useRef,
    useState 
} = window.React;
