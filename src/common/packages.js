import mapWorkspaces from '@npmcli/map-workspaces';
import PackageJson from '@npmcli/package-json';
import getName from '@npmcli/name-from-folder';
import { getDependenciesFromPackageJson } from './dependencies';

const getPackageData = async ({ path: pkgPath, isMonorepoRoot = false }) => {
	const pkgJson = await PackageJson.load(pkgPath);

	return {
		name: pkgJson.content.name || getName(pkgPath),
		path: pkgPath,
		isMonorepoRoot,
		dependencies: getDependenciesFromPackageJson({
			pkgJsonData: pkgJson.content,
		}),
		pkgJsonInstance: pkgJson,
	};
};

const getPackages = async ({ rootPath, isMonorepo, packageDirs }) => {
	const pkgsArgs = [{ path: rootPath, isMonorepoRoot: isMonorepo }];

	if (isMonorepo) {
		const subPkgs = await mapWorkspaces({
			cwd: rootPath,
			pkg: {
				workspaces: packageDirs,
			},
		});

		for (const pkgPath of subPkgs.values()) {
			pkgsArgs.push({ path: pkgPath });
		}
	}

	const allPackages = await Promise.all(pkgsArgs.map(getPackageData));
	return new Map(allPackages.map((pkg) => [pkg.name, pkg]));
};

export { getPackages, getPackageData };
