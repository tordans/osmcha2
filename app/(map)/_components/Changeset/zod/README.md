# Zod conventions

## Always use `strictObject`

… or `Foo.strict()`. `strictObject` is an [undocumented](https://github.com/colinhacks/zod/issues/2629#issuecomment-1664832198) version of `z.Object().strict()` but makes the code easier to format and read.

We should always use [the strict option](https://github.com/colinhacks/zod?tab=readme-ov-file#strict), so properties that do not parse throw an error.
The default is, that properties are silently ignored.
Another option would be [to `.passtrought()`](https://github.com/colinhacks/zod?tab=readme-ov-file#passthrough) the non-parsed properties which removes all the safety we want.

Note, that we cannot add `.strict()` to the top level Object, because it needs to be defined on every object. Which is unfortunate, because we could make this conditional otherwise so it only is strict for our debugging helper.

## Use `discriminatedUnion`

```
const myUnion = z.discriminatedUnion("status", [
  z.object({ status: z.literal("success"), data: z.string() }),
  z.object({ status: z.literal("failed"), error: z.instanceof(Error) }),
]);
```

https://github.com/colinhacks/zod?tab=readme-ov-file#discriminated-unions
