export type InputSource
  = | { type: 'stdin' }
    | { type: 'file', path: string }
