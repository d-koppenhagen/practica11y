import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: [
      '**/dist',
      '**/out-tsc',
      '**/vitest.config.*.timestamp*',
      '**/public/assets/**/*.min.js',
      '**/public/content/challenges/**/starter.js',
      '**/public/content/challenges/**/solution.js',
      '**/node_modules',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            {
              sourceTag: 'scope:app',
              onlyDependOnLibsWithTags: [
                'scope:features',
                'scope:shared',
                'scope:challenge',
              ],
            },
            {
              sourceTag: 'scope:features',
              onlyDependOnLibsWithTags: [
                'scope:features',
                'scope:challenge',
                'scope:editor',
                'scope:preview',
                'scope:accessibility',
                'scope:shared',
              ],
            },
            {
              sourceTag: 'scope:challenge',
              onlyDependOnLibsWithTags: ['scope:challenge', 'scope:shared'],
            },
            {
              sourceTag: 'scope:editor',
              onlyDependOnLibsWithTags: ['scope:editor', 'scope:shared'],
            },
            {
              sourceTag: 'scope:preview',
              onlyDependOnLibsWithTags: ['scope:preview', 'scope:shared'],
            },
            {
              sourceTag: 'scope:accessibility',
              onlyDependOnLibsWithTags: ['scope:accessibility', 'scope:shared'],
            },
            {
              sourceTag: 'scope:shared',
              onlyDependOnLibsWithTags: ['scope:shared'],
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.ts'],
    rules: {
      '@angular-eslint/component-class-suffix': 'off',
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    // Override or add rules here
    rules: {},
  },
];
