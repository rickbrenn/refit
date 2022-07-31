import path from 'path';

const updateDependencies = async (config) => {
	const {
		rootDir,
		usePackages,
		packageDirs,
		monorepo,
		hoisted,
		dependencyTypes,
		showAll,
		sortAlphabetical,
	} = config;
	/*
		{
			name: '@babel/core',
			type: 'devDependencies',
			apps: [ 'refit' ],
			hoisted: false,
			version: { installed: '7.18.2', wanted: '7.18.9', latest: '7.18.9' },
			versionRange: { target: '^7.18.2', wanted: '^7.18.9', latest: '^7.18.9' },
			internal: false,
			missing: false,
			installNeeded: false,
			upgradable: true,
			upgradableToWanted: true,
			upgradableToLatest: true,
			color: 'green',
			updateType: 'patch',
			upgradeParts: {
			wildcard: '^',
			midDot: '.',
			uncoloredText: '7.18',
			coloredText: '9'
			}
		},
	*/

	// get list of packages to update
	// maybe do this stuff in an init function for the whole refit app?

	// root path of the package
	const rootPath = path.resolve(rootDir);

	// get the info for the package or all monorepo packages
	const packages = await getPackages(rootPath, monorepo && packageDirs);

	// get deps for packages

	// get installed hoisted modules at the root of the repo
	const hoistedModules = hoisted ? await getHoistedModules(rootPath) : [];

	// only use the selected package if the argument is provided
	const selectedPackages = usePackages.length
		? packages.filter((pkg) => usePackages.includes(pkg.name))
		: packages;

	// get list of dependencies for each package with basic information
	let dependencies = await getDependencyList(
		selectedPackages,
		dependencyTypes,
		hoistedModules,
		packages
	);

	// TODO: concurrency to config
	// update dependencies with information from the npm registry
	dependencies = await processDependencies(
		dependencies,
		onDepenencyProcessed,
		{
			concurrency: 8,
		}
	);

	// update package.json file for each pacakage
};

export default updateDependencies;
