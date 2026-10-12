/** @type {import('stylelint').Config} */
export default {
  ignoreFiles: [
    'build/**/*',
    'dist/**/*',
    'coverage/**/*',
    '**/icon.fonts.css',
  ],

  extends: ['stylelint-config-standard-scss'],

  rules: {
    'font-family-no-missing-generic-family-keyword': [
      true,
      {
        ignoreFontFamilies: ['Cortal-Icons'],
      },
    ],

    'property-no-unknown': [
      true,
      {
        ignoreProperties: ['composes'],
      },
    ],

    'selector-pseudo-class-no-unknown': [
      true,
      {
        ignorePseudoClasses: ['global'],
      },
    ],

    // CSS Modules / legacy naming
    'custom-property-pattern': null,
    'selector-class-pattern': null,
    'selector-id-pattern': null,

    // Legacy/project compatibility
    'no-descending-specificity': null,
    'no-duplicate-selectors': null,

    // Project convention
    'color-hex-length': 'long',

    // Prettier
    'rule-empty-line-before': null,
    'comment-empty-line-before': null,
    'declaration-empty-line-before': null,
    'custom-property-empty-line-before': null,
    'at-rule-empty-line-before': null,
    'scss/operator-no-newline-after': null,

    // Tailwind v4
    'at-rule-no-unknown': null,
    'scss/at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: ['theme', 'custom-variant'],
      },
    ],
    'import-notation': null,

    // Tailwind/shadcn generated colors
    'lightness-notation': null,
    'hue-degree-notation': null,

    // TODO: address later: Modern CSS migrations
    'media-feature-range-notation': null,
    'selector-not-notation': null,
    'declaration-block-no-redundant-longhand-properties': null,
    'property-no-deprecated': null,
    'declaration-property-value-keyword-no-deprecated': null,

    // TODO: address later: Sass migration
    'scss/load-partial-extension': null,
    'scss/at-mixin-argumentless-call-parentheses': null,
  },
};
