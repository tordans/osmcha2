import pkg from '../../package.json'

export const isLocal = import.meta.env.DEV
export const appVersion = pkg.version

export { API_URL } from './constants.ts'
