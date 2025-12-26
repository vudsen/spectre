const Icon = {
  VERTICAL_DOTS: 'ic-vertical-dots',
  HOME: 'fc-home',
  DATASOURCE: 'fc-datasource',
  SETTINGS: 'fc-gear',
  RIGHT: 'fc-chevron-right',
  SEARCH: 'fc-magnifying-glass',
  NOTE: 'circle-exclamation',
  QUESTION: 'fc-question',
  PLUG: 'fc-plug',
  COFFEE: 'fc-mug-hot',
  REFRESH: 'fc-rotate',
  LOGO: 'fc-ghost',
  VIEW: 'fc-eye',
  GRIP: 'fc-grip',
  FILTER: 'fc-filter',
  BUG: 'fc-bug',
  USER: 'fc-users-gear',
  TRASH: 'fc-trash',
  SAVE: 'fc-save',
  EDIT: 'fc-pen-to-square',
  DISCONNECT: 'fc-link-slash',
  FIELD: 'jb-field',
  AUDIT: 'note-sticky',
  SECRET_KEY: 'fc-key',
  SHIELD: 'fc-shield-halved',
  WRENCH: 'fc-screwdriver-wrench',
  RIGHT_ARROW: 'fc-angle-right'
} as const

export type Icons = (typeof Icon)[keyof typeof Icon]

export default Icon
