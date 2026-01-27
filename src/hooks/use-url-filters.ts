import * as React from "react";

export type UrlFilterField<T> = {
  param: string;
  default: T;
  parse?: (value: string) => T;
  serialize?: (value: T) => string | null;
};

export type UrlFilterSchema<T extends Record<string, unknown>> = {
  [K in keyof T]: UrlFilterField<T[K]>;
};

const getDefaults = <T extends Record<string, unknown>>(
  schema: UrlFilterSchema<T>,
) => {
  const defaults = {} as T;
  (Object.keys(schema) as Array<keyof T>).forEach((key) => {
    defaults[key] = schema[key].default;
  });
  return defaults;
};

const parseFilters = <T extends Record<string, unknown>>(
  schema: UrlFilterSchema<T>,
  searchParams: URLSearchParams,
) => {
  const next = getDefaults(schema);
  (Object.keys(schema) as Array<keyof T>).forEach((key) => {
    const { param, parse } = schema[key];
    const raw = searchParams.get(param);
    if (raw === null) return;
    next[key] = parse ? parse(raw) : (raw as unknown as T[typeof key]);
  });
  return next;
};

const buildSearchParams = <T extends Record<string, unknown>>(
  schema: UrlFilterSchema<T>,
  filters: T,
) => {
  const params = new URLSearchParams();
  (Object.keys(schema) as Array<keyof T>).forEach((key) => {
    const { param, default: defaultValue, serialize } = schema[key];
    const value = filters[key];
    if (value === defaultValue) return;
    const serialized = serialize ? serialize(value) : String(value);
    if (serialized === null || serialized === "") return;
    params.set(param, serialized);
  });
  return params;
};

export function useUrlFilters<T extends Record<string, unknown>>(
  schema: UrlFilterSchema<T>,
) {
  const skipUrlSyncRef = React.useRef(true);
  const [filters, setFilters] = React.useState<T>(() => getDefaults(schema));

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const apply = (searchParams: URLSearchParams) => {
      setFilters(parseFilters(schema, searchParams));
    };

    apply(new URLSearchParams(window.location.search));
    skipUrlSyncRef.current = true;

    const handlePopState = () => {
      apply(new URLSearchParams(window.location.search));
      skipUrlSyncRef.current = true;
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [schema]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (skipUrlSyncRef.current) {
      skipUrlSyncRef.current = false;
      return;
    }

    const params = buildSearchParams(schema, filters);
    const nextSearch = params.toString();
    const nextUrl = nextSearch
      ? `${window.location.pathname}?${nextSearch}`
      : window.location.pathname;
    const currentUrl = `${window.location.pathname}${window.location.search}`;

    if (nextUrl !== currentUrl) {
      window.history.replaceState(null, "", nextUrl);
    }
  }, [filters, schema]);

  const resetFilters = () => setFilters(getDefaults(schema));

  return { filters, setFilters, resetFilters };
}
