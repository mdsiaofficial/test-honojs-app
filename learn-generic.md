## Generic types, at the core

A generic is a **type-level parameter**. A function parameter is a placeholder for a *value* you supply later; a type parameter is a placeholder for a *type* you supply later. It lets one function/class/interface work correctly across many concrete types without you duplicating code for each type, and without falling back to `any` (which would compile but throw away all type-checking).

Every generic has two distinct moments:
1. **Declaration site** — where a placeholder is *introduced*.
2. **Use site** — where a concrete type is *plugged into* that placeholder.

Your two snippets both use `<...>`, but each one is a different moment. That's the difference you're sensing.

## `identity<T>(value: T): T` — declaration site

```typescript
function identity<T>(value: T): T {
  return value;
}
```

- `function identity` — the function's name.
- `<T>` — **this is where `T` is born.** Nothing called `T` existed before this token. You are creating a new type placeholder here, the exact same way `(value)` creates a new value placeholder. `T` is just a name — single capital letters are convention (`T`, `U`, `K`, `V`), not a rule; `<Value>` would work identically.
- `(value: T)` — the parameter `value` is typed as "whatever `T` turns out to be."
- `: T` — the return type is *also* "whatever `T` turned out to be" — same placeholder, reused.
- Nobody says what `T` *is* until someone calls the function:
  - `identity(5)` → TypeScript infers `T = number` from the argument.
  - `identity("hi")` → infers `T = string`.
  - `identity<string>("hi")` → you pin it explicitly instead of relying on inference.

`identity` genuinely **is** generic — it owns an open slot, and each call can fill it differently.

## `Hono<THonoEnv>` — use site

```typescript
function create_app(): Hono<THonoEnv> {
  const app = new Hono<THonoEnv>();
  return app;
}
```

- `Hono` — a generic class, but **you didn't declare this one.** It's declared inside the Hono library itself. `Hono` is itself a generic class defined by the framework, with three generic type parameters: one for the environment (bindings and variables), one for its route schema, and one for its base path. Someone else already did the "declaration site" work — you only ever consume it.
- `<THonoEnv>` — this is **not** introducing a new placeholder. You're taking a type you already defined elsewhere (presumably `type THonoEnv = { Bindings: {...}; Variables: {...} }`, matching Hono's expected shape) and plugging it into the environment slot `Hono` left open for you. This is a **type argument** — the type-level equivalent of a function *argument*, as opposed to a function *parameter*.
- `Hono<THonoEnv>` as a whole — now a fully concrete type: "a Hono app whose environment is THonoEnv." No unresolved placeholders remain in it.
- `function create_app(): Hono<THonoEnv>` — the return annotation. Every call to `create_app()` returns exactly this one concrete type.
- `new Hono<THonoEnv>()` — constructing an instance, explicitly supplying the type argument at the constructor call. Same move as `identity<string>("hi")`, just spelled with `new`.

## The actual thing you're noticing

`create_app` itself has **no `<...>` of its own** — it declares no type parameter. It's an ordinary, non-generic function that happens to *mention* a generic type in its signature:

```typescript
function create_app(): Hono<THonoEnv>     // NOT generic — always returns one fixed concrete type
function identity<T>(value: T): T         // IS generic — T is identity's own open slot
```

If you wanted `create_app` to be generic the way `identity` is — able to build a `Hono` app for *any* env its caller picks — you'd give `create_app` its own type parameter too:

```typescript
function create_app<E extends Env>(): Hono<E> {
  const app = new Hono<E>();
  return app;
}
// caller decides E:
const app = create_app<THonoEnv>();
```

Now `create_app` has declared its own `E`, and the caller supplies the type argument — same pattern as `identity`, just applied one layer up.

## The one-line rule

`<T>` right after a name being **declared** (a function/class/interface name) = new placeholder, empty slot.
`<SomeType>` right after a name that's already a **type** = filling somebody else's slot with something concrete.

Same brackets, opposite direction — like `function f(x)` vs. `f(5)`, just one level up: parameters vs. arguments, but for types instead of values.