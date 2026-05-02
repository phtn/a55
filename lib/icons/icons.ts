export const icons = {
  're-up.ph': {
    symbol:
      '<path d="M16 24H24V16.25C24.001 16.0416 23.9545 15.9991 23.75 16H16V24Z" fill="currentColor"/><path d="M24 24V30.4127C24 31.2894 24.7106 32 25.5873 32H32V25.5873C32 24.7106 31.2894 24 30.4127 24H24Z" fill="currentColor"/><path d="M32 14.4127V1.5873C32 0.710659 31.2894 0 30.4127 0H1.5873C0.710659 0 0 0.710659 0 1.5873V30.4127C0 31.2894 0.710659 32 1.5873 32H14.4127C15.2894 32 16 31.2894 16 30.4127V24H8V8H24V16H30.4127C31.2894 16 32 15.2894 32 14.4127Z" fill="currentColor"/>',
    viewBox: '0 0 32 32',
    set: 're-up.ph'
  },
  'arrow-right': {
    symbol:
      '<path fill="currentColor" d="m20 12l.707-.707l.707.707l-.707.707zM5 13a1 1 0 1 1 0-2zm9.707-7.707l6 6l-1.414 1.414l-6-6zm6 7.414l-6 6l-1.414-1.414l6-6zM20 13H5v-2h15z"/>',
    viewBox: '0 0 24 24',
    set: 'lets-icons'
  },
  'spinner-ring': {
    symbol: `<path fill="currentColor" d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z" opacity=".25"></path><path fill="currentColor" d="M10.14,1.16a11,11,0,0,0-9,8.92A1.59,1.59,0,0,0,2.46,12,1.52,1.52,0,0,0,4.11,10.7a8,8,0,0,1,6.66-6.61A1.42,1.42,0,0,0,12,2.69h0A1.57,1.57,0,0,0,10.14,1.16Z"><animateTransform attributeName="transform" dur="0.75s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12"></animateTransform></path>`,
    viewBox: `0 0 24 24`,
    set: `svg`
  },
  information: {
    symbol:
      '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4m.125-3.75H12m.25 0a.25.25 0 1 0-.5 0a.25.25 0 0 0 .5 0"/></g>',
    viewBox: '0 0 24 24',
    set: 'hugeicons'
  },
  theme: {
    symbol:
      '<g fill="none"><path fill="currentColor" d="M2.75 12A9.25 9.25 0 0 0 12 21.25V2.75A9.25 9.25 0 0 0 2.75 12"/><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 21.25a9.25 9.25 0 0 0 0-18.5m0 18.5a9.25 9.25 0 0 1 0-18.5m0 18.5V2.75"/></g>',
    viewBox: '0 0 24 24',
    set: 'proicons,'
  },
  'cf-pen': {
    symbol: `<path d="M5.99674 13.3202L6.27297 13.1723L14 5.46633V4.69736L12.8755 3.12349L11.3029 2H10.534L2.80805 9.70489L2.65797 9.9855L2 13.3626V14H2.64165L5.99674 13.3202ZM3.69331 10.3575L10.9179 3.15182L12 4L12.8461 5.08021L5.62045 12.2859L3.2224 12.772L3.69331 10.3575Z" fill="currentColor"/>`,
    viewBox: '0 0 16 16',
    set: 'cf'
  }
}
/*

*/

export type IconNameType = keyof typeof icons
