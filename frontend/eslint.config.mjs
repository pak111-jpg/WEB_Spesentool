import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';

// JavaScript im Browser (ES-Module). Die Regeln unten prüfen die Basisanforderungen aus dem Bewertungsraster.
export default [
  { ignores: ['dist'] },
  eslint.configs.recommended,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser },
    },
    rules: {
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
      // G4.4: keine Funktion länger als 40 Zeilen (Leerzeilen und Kommentare zählen mit)
      'max-lines-per-function': [
        'error',
        { max: 40, skipBlankLines: false, skipComments: false, IIFEs: true },
      ],
      // G4.3: nur === und !==
      eqeqeq: ['error', 'always'],
      // G4.2: nur const und let
      'no-var': 'error',
      'prefer-const': 'error',
      'no-unused-vars': [
        'error',
        { args: 'after-used', argsIgnorePattern: '^_' },
      ],
      'no-restricted-syntax': [
        'error',
        {
          // G4.5: Ausgabe nur mit textContent / createElement
          selector:
            'MemberExpression[property.name=/^(innerHTML|outerHTML|insertAdjacentHTML)$/]',
          message: 'Kein innerHTML: Texte mit textContent oder el() ausgeben.',
        },
        {
          // G4.2: Ereignisse mit addEventListener statt onclick, onchange usw.
          selector: 'AssignmentExpression[left.property.name=/^on[a-z]+$/]',
          message: 'addEventListener statt on…-Zuweisung verwenden.',
        },
      ],
    },
  },
];
