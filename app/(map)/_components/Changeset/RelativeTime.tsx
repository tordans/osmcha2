import { localDateTime } from '@app/(map)/_layout/_utils/localDateTime'
import moment from 'moment'

export const relativeTime = (input: Date | string) => {
  moment.updateLocale('en', {
    relativeTime: {
      future: 'in %s',
      past: '%s ago',
      s: '%d seconds',
      ss: '%d seconds',
      m: '%d minute',
      mm: '%d minutes',
      h: '%d hour',
      hh: '%d hours',
      d: '%d day',
      dd: '%d days',
      w: '%d week',
      ww: '%d weeks',
      M: '%d month',
      MM: '%d months',
      y: '%d year',
      yy: '%d years',
    },
  })
  return moment(input).fromNow()
}

type Props = { date: Date }

export const RelativeTime = ({ date }: Props) => {
  return (
    <time title={`${localDateTime(date)}`} className="cursor-help">
      {relativeTime(date)}
    </time>
  )
}
