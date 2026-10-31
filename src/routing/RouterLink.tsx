import { useLinkProps, type LinkComponent, type LinkComponentProps } from '@tanstack/react-router'

type RouterLinkProps = LinkComponentProps<'a'> & {
  ref?: React.Ref<HTMLAnchorElement>
}

/** Typed router `<a>` without `forwardRef` (React 19 takes `ref` as a prop). */
function RouterLink({ ref, children, ...options }: RouterLinkProps) {
  // The hook types its ref as a plain `Element`; it hands it to the `<a>` below.
  const { type: _type, ...anchorProps } = useLinkProps(options, ref as React.Ref<Element>)
  // `disabled` comes along at runtime and is no attribute of an `<a>`.
  const {
    disabled: _disabled,
    children: _children,
    ...rest
  } = anchorProps as typeof anchorProps & { disabled?: boolean }
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
