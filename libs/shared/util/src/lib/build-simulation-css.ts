export type ReducedMotionPreference = 'no-preference' | 'reduce';
export type ColorSchemePreference = 'light' | 'dark';
export type ContrastPreference = 'no-preference' | 'more' | 'less' | 'custom';

export interface SimulationPreferences {
  reducedMotion: ReducedMotionPreference;
  colorScheme: ColorSchemePreference;
  contrast: ContrastPreference;
}

export function buildSimulationCss(prefs: SimulationPreferences): string {
  const blocks: string[] = [];

  if (prefs.reducedMotion === 'reduce') {
    blocks.push(`/* prefers-reduced-motion: reduce simulation */
*, *::before, *::after {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
  scroll-behavior: auto !important;
}`);
  }

  if (prefs.colorScheme === 'dark') {
    blocks.push(`/* prefers-color-scheme: dark simulation */
:root { color-scheme: dark; background-color: #1a1a2e; color: #e0e0e0; }`);
  } else {
    // 'light' is the default — only inject if other overrides are active
    // to set an explicit light context
    if (blocks.length > 0) {
      blocks.push(`:root { color-scheme: light; }`);
    }
  }

  return blocks.join('\n');
}
