import path from 'path';
import { fileURLToPath } from 'url';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import nodeExternals from 'webpack-node-externals';

const devMode = process.env.NODE_ENV !== 'production';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default {
	mode: devMode ? 'development' : 'production',
	watch: devMode,
	entry: path.resolve(dirname, 'src/index.js'),
	output: {
		filename: '[name].bundle.js',
		path: path.resolve(dirname, 'dist'),
		chunkFormat: 'module',
		library: {
			type: 'module',
		},
	},
	externalsPresets: { node: true },
	externals: [nodeExternals({ importType: 'module' })],
	experiments: {
		outputModule: true,
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: ['babel-loader'],
				resolve: {
					fullySpecified: false,
				},
			},
		],
	},
	plugins: [new CleanWebpackPlugin()],
};
