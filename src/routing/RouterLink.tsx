import { useLinkProps, type LinkComponent, type LinkComponentProps } from '@tanstack/react-router'

type RouterLinkProps = LinkComponentProps<'a'> & {
  ref?: React.Ref<HTMLAnchorElement>
}

/** Typed router `<a>` without `forwardRef` (React 19 takes `ref` as a prop). */
function RouterLink({ ref, children, ...options }: RouterLinkProps) {
  const { type: _type, ...anchorProps } = useLinkProps(options, ref)
  const { disabled: _disabled, children: _children, ...rest } = anchorProps
  const content =
    typeof children === 'function'
      ? children({
          isActive: (rest as { 'data-status'?: string })['data-status'] === 'active',
        })
      : children

  return <a {...rest}>{content}</a>
}

const TypedRouterLink = RouterLink as LinkComponent<'a'>

export { TypedRouterLink as RouterLink }
