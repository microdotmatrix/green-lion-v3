---
name: post-react-compiler-react
description: Writes simple, compiler-friendly React (React 19+) for environments with React Compiler enabled. Avoids default useMemo/useCallback/memo/forwardRef defensive patterns; prefers derivation over stored state and hooks only for semantics. Use when generating or reviewing React components, hooks, or performance-related React code; when the user mentions React Compiler, automatic memoization, or post-2024 React patterns.
---

# Post–React Compiler React (for AI-generated code)

**Audience**: Code targeting **React 19+** with **React Compiler** (or equivalent automatic optimization).

**Goal**: **Simple, readable, declarative, compiler-friendly** code. Do not write “2022 performance React” by default.

Official context: [React Compiler](https://react.dev/learn/react-compiler), [React 19](https://react.dev/blog/2024/12/05/react-19), [Compiler 1.0 blog](https://react.dev/blog/2025/10/07/react-compiler-1). More links: [references.md](references.md).

---

## Mental model

| Legacy (pre-compiler) | Modern (with compiler) |
|----------------------|-------------------------|
| Manual re-render control | Compiler inserts memoization where appropriate |
| `useMemo` / `useCallback` / `memo` as default | Optimization is the compiler’s job |
| Structure around avoiding renders | Structure around **clarity and correctness** |

**Rule of thumb**: Write as if every render is cheap and memoization is automatic.

**Never rely on compilation for correctness**—code must be correct without the compiler.

---

## Core principles

### Prefer plain JavaScript

Use normal variables and expressions. Do not wrap logic in hooks unless the hook’s **semantics** are required.

```jsx
// Good
const total = items.reduce((sum, i) => sum + i.price, 0);

// Avoid (unless a real escape hatch applies)
const total = useMemo(() => items.reduce((sum, i) => sum + i.price, 0), [items]);
```

### Avoid manual memoization by default

Do **not** add `useMemo`, `useCallback`, or `React.memo` unless:

- Integrating with **non-React** APIs (listeners, subscriptions, imperative refs).
- **Referential stability is required for correctness** (not micro-optimization)—e.g. effect deps, external libraries.

Treat them as **escape hatches**. If used, **document why** and keep scope minimal.

### Components as pure functions

Derive UI from props, state, and context only. No hidden mutable render caches, no side effects during render.

```jsx
// Good
function Price({ value }) {
  return <span>{value.toFixed(2)}</span>;
}

// Avoid
let cached;
function Price({ value }) {
  cached ??= value.toFixed(2);
  return <span>{cached}</span>;
}
```

### React 19 conveniences (defaults for new code)

- Prefer **`ref` as a normal prop** on function components; avoid `forwardRef` unless supporting older React or library constraints. See [forwardRef](https://react.dev/reference/react/forwardRef).
- **Ref callbacks** may return **cleanup functions** where applicable. See [React 19 upgrade guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide).

---

## Hooks

### `useState`

True local UI state only. Prefer **several small states** over one large object when values are independent.

### `useEffect`

Only for **synchronizing with the outside world**, not for deriving data.

```jsx
// Good
useEffect(() => {
  document.title = title;
}, [title]);

// Avoid
const [derived, setDerived] = useState();
useEffect(() => {
  setDerived(a + b);
}, [a, b]);
```

Derive `a + b` (or filtered lists, etc.) **during render**.

### `useRef`

For imperative handles and mutable values that **must not** drive rendering. **Do not** use `useRef` as a general memoization cache.

---

## Props and data flow

- **Inline callbacks are fine**—do not default to `useCallback` for child props.
- **Lift state** only when multiple children must **coordinate**, not for imagined performance.

```jsx
// Good
<Dialog open={open} onClose={() => setOpen(false)} />

// Avoid unless an escape hatch applies
const onClose = useCallback(() => setOpen(false), []);
```

---

## Lists and keys

- Keys: **stable and semantic** (`item.id`). Avoid index keys when items reorder/add/remove.
- Do not “optimize” lists with `memo` by default.

---

## Derived data

**Derive, don’t store.** Never mirror props or other state in `useState` + effects.

```jsx
// Good
const visibleItems = items.filter((i) => i.visible);

// Avoid
const [visibleItems, setVisibleItems] = useState([]);
// + effect to sync from items
```

---

## Suspense and boundaries

Use `Suspense` as **control flow** for async UI, not as a generic performance split. Avoid gratuitous component splits for loading only.

---

## Compiler: modes, inference, directives

Assume **`compilationMode: "infer"`** unless the project states otherwise.

| Mode | Meaning for generated code |
|------|----------------------------|
| **`infer`** (default) | Heuristic: PascalCase + JSX ⇒ component; `use*` + hooks ⇒ hook |
| **`annotation`** | Only `"use memo"` annotated units compile—**do not assume** compilation elsewhere |
| **`syntax`** | Flow-specific; rare in TS |
| **`all`** | Broad compilation; unpredictable—**opt-outs matter** |

**Inference helpers for AI**: Use normal **PascalCase** components and **`useThing`** for hooks. Avoid helpers that look like components (PascalCase + JSX) if they are not components.

### Directives

- **`"use memo"`** — opt **into** compilation; required in `annotation` mode; rarely needed in `infer`.
- **`"use no memo"`** — opt **out**; last resort; **document why**.

**Do not** add or remove compiler directives unless the user or codebase explicitly requires it. **Respect** existing directives.

Directives define **trust boundaries**, not “make it faster” hints.

---

## When manual optimization is allowed

After **profiling** with the compiler on, or when:

- Correctness needs stable references (effects, subscriptions, non-React APIs).
- Legacy integration requires it.

Then: narrow scope, comment the reason.

---

## Style expectations

- Readability over cleverness.
- Minimize hooks; each hook should have a clear **semantic** role.
- Avoid comments that only explain renders or memoization unless documenting a real escape hatch.

---

## Checklist (before shipping React output)

- ❌ Default `useMemo` / `useCallback` / `React.memo`
- ❌ Derived data in state + `useEffect`
- ❌ Manual “render optimization” without evidence
- ❌ `useRef` as cache for render output
- ✅ Pure components; derive during render
- ✅ `useEffect` only for real external effects
- ✅ Stable list keys
- ✅ Naming that matches compiler inference when using `infer` mode
- ✅ Trust the compiler; document escape hatches

**Final principle**: *Performance is an implementation detail; semantics are the API.*
