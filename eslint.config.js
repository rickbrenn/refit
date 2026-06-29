import zeno, { defineZenoConfig } from 'zeno-config/eslint';
import globals from 'globals';
import eslintPluginPreferArrowFunctions from 'eslint-plugin-prefer-arrow-functions';

export default defineZenoConfig(
	{
		reactIncludes: ['src'],
		reactCompiler: 'warn',
		webpackConfig: './webpack.config.js',
		additionalDevDependencies: ['tests/**'],
	},
	[
		{ ignores: ['bin/**'] },

		// Jest test files configuration
		{
			files: [`tests/**/*{${zeno.extensions.nodeExtensionsString}}`],
			languageOptions: {
				globals: {
					...globals.jest,
				},
			},
			rules: {
				'import-x/extensions': [
					'error',
					'ignorePackages',
					{
						js: 'never',
					},
				],
			},
		},

		// Prefer arrow functions plugin
		{
			plugins: {
				'prefer-arrow-functions': eslintPluginPreferArrowFunctions,
			},
			rules: {
				'prefer-arrow-functions/prefer-arrow-functions': [
					'warn',
					{
						classPropertiesAllowed: false,
						disallowPrototype: false,
						returnStyle: 'unchanged',
						singleReturnOnly: false,
					},
				],
			},
		},

		// Project-specific rule overrides
		{
			rules: {
				'no-restricted-syntax': 'off',
				'no-await-in-loop': 'off',
				'no-console': 'off',
			},
		},

		// React-specific overrides
		{
			files: [
				`src/**/*{${zeno.extensions.reactExtensionsExtendedString}}`,
			],
			rules: {
				// Allow arrow function components
				'react/function-component-definition': [
					'error',
					{
						namedComponents: 'arrow-function',
						unnamedComponents: 'arrow-function',
					},
				],
				'react/destructuring-assignment': 'off',
				'jsx-a11y/no-autofocus': 'off',
			},
		},
	]
);
