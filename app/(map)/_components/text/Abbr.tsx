import clsx from 'clsx'

type Props = { title: string; children: React.ReactNode }

export const abbrClasses = clsx(
  'cursor-help no-underline decoration-blue-300 decoration-dotted underline-offset-2 hover:underline',
)

export const Abbr = ({ title, children }: Props) => {
  return (
    <abbr title={title} className={abbrClasses}>
      {children}
    </abbr>
  )
}
