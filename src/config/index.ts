import pkg from '../../package.json'

const isLocal = import.meta.env.DEV
const appVersion = pkg.version
export const appVersionLabel = `v${appVersion}${isLocal ? ' Local' : ''}`

export const githubContributingUrl =
  'https://github.com/osmcha/osmcha-frontend/blob/master/CONTRIBUTING.md'
export const donateUrl = 'https://openstreetmap.app.neoncrm.com/forms/osmcha'

export { API_URL } from './constants.ts'
