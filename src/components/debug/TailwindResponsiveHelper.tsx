import { adminChipSegmentClassName } from './adminChip.ts'

export function TailwindResponsiveHelper() {
  return (
    <a
      className={`space-x-1 hover:underline ${adminChipSegmentClassName}`}
      href="https://tailwindcss.com/docs/responsive-design"
      target="_blank"
      rel="noreferrer"
    >
      <span className="font-bold underline" title="<40rem">
        📱
      </span>
      <span className="sm:font-bold sm:underline" title="40rem sm">
        sm
      </span>
      <span className="md:font-bold md:underline" title="48rem md">
        md
      </span>
      <span
        className="min-[56rem]:font-bold min-[56rem]:underline"
        title="56rem (896px): list + map split"
      >
        56
      </span>
      <span className="lg:font-bold lg:underline" title="64rem lg">
        lg
      </span>
      <span className="xl:font-bold xl:underline" title="80rem xl">
        xl
      </span>
      <span className="2xl:font-bold 2xl:underline" title="96rem 2xl">
        2xl
      </span>
    </a>
  )
}
