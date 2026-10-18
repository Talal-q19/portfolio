import next from 'eslint-config-next/core-web-vitals';

const config = [
  ...next,
  { ignores: ['.next/**', 'out/**', 'build/**'] },
  // Keep existing presentation code reviewable while migrating the removed
  // `next lint` command. New/changed contact code retains the full error rules.
  {
    files: [
      'app/components/homepage/experience/index.jsx',
      'app/components/homepage/hero-section/index.jsx',
      'app/components/homepage/projects/index.jsx',
    ],
    rules: { 'react-hooks/set-state-in-effect': 'warn' },
  },
  {
    files: ['app/components/homepage/hero-section/index.jsx'],
    rules: { 'react/no-unescaped-entities': 'warn' },
  },
  {
    files: ['app/components/homepage/skills/index.jsx'],
    rules: { 'react-hooks/purity': 'warn' },
  },
  {
    files: ['app/components/navbar.jsx'],
    rules: { 'react-hooks/immutability': 'warn' },
  },
];

export default config;
