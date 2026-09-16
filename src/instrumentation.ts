export async function register() {
  // `instrumentation.ts` también corre en Edge (proxy). node:dns solo existe en Node.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation.node");
  }
}
