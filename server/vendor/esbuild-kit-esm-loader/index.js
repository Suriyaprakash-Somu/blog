// Stub replacement for @esbuild-kit/esm-loader.
//
// This project invokes drizzle-kit via its CJS entrypoint (bin.cjs) under tsx,
// and does not rely on Node ESM loader hooks from @esbuild-kit/esm-loader.
//
// Keeping a minimal implementation avoids pulling vulnerable esbuild@0.18.x.

export async function resolve(specifier, context, nextResolve) {
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  return nextLoad(url, context);
}
