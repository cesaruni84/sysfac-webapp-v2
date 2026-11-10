// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const boundaries = require('eslint-plugin-boundaries');

module.exports = defineConfig([
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
    },
  },
  {
    // 2.7 · Reglas de dependencia entre capas (ver "Arquitectura por capas" en MIGRATION.md).
    files: ['src/**/*.ts'],
    plugins: { boundaries },
    settings: {
      'import/resolver': { node: { extensions: ['.ts', '.js'] } },
      'boundaries/elements': [
        { type: 'core', pattern: 'src/app/core' },
        { type: 'shared-ui', pattern: 'src/app/shared/ui' },
        { type: 'layout', pattern: 'src/app/layout' },
        { type: 'feature', pattern: 'src/app/features/*', capture: ['modulo'] },
        { type: 'environments', pattern: 'src/environments' },
      ],
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'allow',
          policies: [
            {
              from: { element: { type: 'core' } },
              disallow: { to: { element: { types: ['shared-ui', 'layout', 'feature'] } } },
              message: 'core no puede importar de shared/ui, layout ni features.',
            },
            {
              from: { element: { type: 'shared-ui' } },
              disallow: { to: { element: { types: ['feature', 'layout'] } } },
              message: 'shared/ui no puede importar de features ni de layout.',
            },
            {
              from: { element: { type: 'layout' } },
              disallow: { to: { element: { types: ['feature'] } } },
              message: 'layout no puede importar de features.',
            },
            {
              from: { element: { type: 'feature' } },
              disallow: { to: { element: { types: ['feature'] } } },
              message:
                'La feature "{{ from.element.captured.modulo }}" no puede importar de otra feature.',
            },
            {
              // Una feature sí puede importar sus propios archivos.
              from: { element: { type: 'feature' } },
              allow: {
                to: {
                  element: { type: 'feature', captured: { modulo: '{{ from.element.captured.modulo }}' } },
                },
              },
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {},
  },
]);
