// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Gleiche Grundlage wie im Backend, nur mit Browser- statt Node-Globals.
export default tseslint.config(
  {
    ignores: ['eslint.config.mjs', 'dist'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-floating-promises': 'warn',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
      // Basisanforderungen aus dem Bewertungsraster, automatisch geprüft mit «npm run lint»
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
      'no-restricted-syntax': [
        'error',
        {
          // G4.5: Ausgabe nur mit textContent / createElement
          selector:
            "MemberExpression[property.name=/^(innerHTML|outerHTML|insertAdjacentHTML)$/]",
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
);
