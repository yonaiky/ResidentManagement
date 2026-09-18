// Next.js resolves the "server-only" marker package to an empty module via the
// "react-server" export condition. Vitest doesn't set that condition, so the
// real package would throw on import. Aliased in vitest.config.ts.
export {};
