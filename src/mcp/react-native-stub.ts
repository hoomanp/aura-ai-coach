/**
 * Node.js stand-in for the `react-native` module.
 *
 * The MCP stdio server (`src/mcp/server-cli.ts`) runs headless inside Claude
 * Desktop / Cursor / any MCP client — there is no React Native runtime.
 * Its only transitive React Native dependency is `Platform.OS` (via
 * `HealthPlatformService`), so this stub provides exactly that surface.
 *
 * Wired up ONLY for the CLI process through `tsconfig.mcp.json` →
 * `compilerOptions.paths`, via `tsx --tsconfig tsconfig.mcp.json`.
 * The app bundle and `npm run typecheck` are unaffected: Metro and `tsc`
 * resolve the real `react-native` package.
 */
export const Platform = {
  /** MCP server runs as the phone-side companion; iOS is the primary target. */
  OS: 'ios' as 'ios' | 'android' | 'windows' | 'macos' | 'web',
  select<T>(specific: { ios?: T; android?: T; web?: T }, fallback?: T): T | undefined {
    return specific[Platform.OS as 'ios' | 'android' | 'web'] ?? fallback;
  },
};

export default Platform;
