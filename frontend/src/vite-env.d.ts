/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Allow CSS module imports
declare module '*.css' {
  const styles: Record<string, string>
  export default styles
}

// Allow SVG imports
declare module '*.svg' {
  import React = require('react')
  const SVGComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>
  export default SVGComponent
}
