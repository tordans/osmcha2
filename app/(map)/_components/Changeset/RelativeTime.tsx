import moment from 'moment'

export const relativeTime = (input: string) => {
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

type Props = { createdAt: string } // TODO TYPES

export const RelativeTime = ({ createdAt }: Props) => {
  return (
    <time title={createdAt} className="cursor-help">
      {relativeTime(createdAt)}
    </time>
  )
}
