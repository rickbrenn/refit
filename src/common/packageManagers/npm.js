import Arborist from '@npmcli/arborist';

const getInstalledDeps = async (pkgPath) => {
	const arb = new Arborist({ path: pkgPath });
	const { children: arbInstalledDeps } = await arb.loadActual();

	const installedDeps = {};
	for (const [name, data] of arbInstalledDeps) {
		installedDeps[name] = data.version;
	}

	return installedDeps;
};

// eslint-disable-next-line import/prefer-default-export
export { getInstalledDeps };
