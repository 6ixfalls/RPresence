module.exports = {
    env: {
        browser: true,
        es2021: true,
        node: true
    },
    extends: "eslint:recommended",
    parserOptions: {
        ecmaVersion: 12,
        sourceType: "module"
    },
    rules: {
        indent: [
            "error",
            4
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        quotes: [
            "error",
            "double"
        ],
        "no-constant-condition": [
            "off"
        ],
        "no-empty": ["error", { allowEmptyCatch: true }],
        "no-var": ["warn"],
        "require-atomic-updates": 0,
        "no-compare-neg-zero": "error",
        "no-extra-parens": ["warn", "all", { nestedBinaryExpressions: false }],
        "no-template-curly-in-string": "error",
        "no-unsafe-negation": "error",
        "accessor-pairs": "warn",
        curly: ["error", "multi-line", "consistent"],
        "dot-location": ["error", "property"],
        "dot-notation": "error",
        "no-empty-function": "error",
        "no-floating-decimal": "error",
        "no-implied-eval": "error",
        "no-invalid-this": "error",
        "no-lone-blocks": "error",
        "no-multi-spaces": "error",
        "no-new-func": "error",
        "no-new-wrappers": "error",
        "no-new": "error",
        "no-octal-escape": "error",
        "no-return-assign": "error",
        "no-return-await": "error",
        "no-self-compare": "error",
        "no-sequences": "error",
        "no-throw-literal": "error",
        "no-unmodified-loop-condition": "error",
        "no-useless-call": "error",
        "no-useless-concat": "error",
        "no-useless-escape": "error",
        "no-useless-return": "error",
        "no-void": "error",
        "no-warning-comments": "warn",
        "prefer-promise-reject-errors": "error",
        "wrap-iife": "error",
        yoda: "error",
        "no-label-var": "error",
        "no-shadow": "error",
        "no-undef-init": "error",
        "callback-return": "error",
        "handle-callback-err": "error",
        "no-mixed-requires": "error",
        "no-new-require": "error",
        "no-path-concat": "error",
        "array-bracket-spacing": "error",
        "block-spacing": "error",
        "brace-style": ["error", "1tbs", { allowSingleLine: true }],
        "comma-dangle": ["error", "never"],
        "comma-spacing": "error",
        "comma-style": "error",
        "computed-property-spacing": "error",
        "consistent-this": ["error", "$this"],
        "func-names": ["error", "as-needed"],
        "func-name-matching": "error",
        "func-style": ["error", "declaration", { allowArrowFunctions: true }],
        "key-spacing": "error",
        "keyword-spacing": "error",
        "max-depth": ["error", 8],
        "max-nested-callbacks": ["error", { max: 4 }],
        "max-statements-per-line": ["error", { max: 2 }],
        "new-cap": "off",
        "newline-per-chained-call": ["error", { ignoreChainWithDepth: 3 }],
        "no-array-constructor": "error",
        "no-lonely-if": "error",
        "no-mixed-operators": "error",
        "no-new-object": "error",
        "no-spaced-func": "error",
        "no-trailing-spaces": "error",
        "no-unneeded-ternary": "error",
        "no-whitespace-before-property": "error",
        "nonblock-statement-body-position": "error",
        "object-curly-spacing": ["error", "always"],
        "operator-assignment": "error",
        "operator-linebreak": ["error", "after"],
        "padded-blocks": ["error", "never"],
        "quote-props": ["error", "as-needed"],
        "semi-spacing": "error",
        semi: "error",
        "space-before-blocks": "error",
        "space-before-function-paren": "never",
        "space-in-parens": "error",
        "space-infix-ops": "error",
        "space-unary-ops": "error",
        "spaced-comment": "error",
        "template-tag-spacing": "error",
        "unicode-bom": "error",
        "arrow-body-style": "error",
        "arrow-parens": "error",
        "arrow-spacing": "error",
        "no-duplicate-imports": "error",
        "no-useless-computed-key": "error",
        "no-useless-constructor": "error",
        "prefer-arrow-callback": "error",
        "prefer-numeric-literals": "error",
        "prefer-rest-params": "error",
        "prefer-spread": "error",
        "rest-spread-spacing": "error",
        "template-curly-spacing": "error",
        "no-console": "off",
        "no-irregular-whitespace": ["error", { skipStrings: true, skipComments: true, skipTemplates: true }],
        "no-unused-vars": "off"
    }
};
