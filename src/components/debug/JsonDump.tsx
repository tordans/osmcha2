export function JsonDump({ data }: { data: unknown }) {
  let text: string
  try {
    text = JSON.stringify(data, null, 2) ?? 'undefined'
  } catch (error) {
    text = `Unable to serialize: ${error instanceof Error ? error.message : String(error)}`
  }

  return (
    <pre className="max-h-[60vh] overflow-auto rounded bg-zinc-950 p-2 text-left text-[11px] leading-snug break-all whitespace-pre-wrap text-zinc-100">
      {text}
    </pre>
  )
}
