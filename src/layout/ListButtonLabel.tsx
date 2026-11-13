import { useSelectedList } from '../components/list/useSelectedList.ts'

/**
 * "List" plus the short name of the list it returns to, in a grey second line.
 * The name is cut with an ellipsis so the button grows taller, not wider.
 */
export function ListButtonLabel() {
  const { label } = useSelectedList()

  return (
    <span className="flex min-w-0 flex-col items-start text-left leading-none">
      <span>List</span>
      <span
        title={label}
        className="mt-0.5 block max-w-16 truncate text-xs/4 font-normal text-zinc-500"
      >
        {label}
      </span>
    </span>
  )
}
