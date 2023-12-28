import React, { useEffect, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
// eslint-disable-next-line import/no-unresolved, node/no-missing-import
import { useApp } from 'ink';
import semver from 'semver';
import useDependencyLoader from '../ui/useDependencyLoader';
import getDependencies from '../common/getDependencies';
import Changelog from '../ui/Changelog/Changelog';
import LoaderBoundary from '../ui/LoaderBoundary';
import { useError } from '../ui/ErrorBoundary';

const Changes = ({ config }) => {
	const { loading, updateLoading, loaderText } = useDependencyLoader();
	const [argsName, argsVersion] = config.dependency.split('@');
	const [depData, setDepData] = useState({ version: null, url: null });
	const { exit } = useApp();
	const { setError } = useError();

	const startLoader = useCallback(async () => {
		try {
			let version = config.full ? null : argsVersion;
			let url;

			// try to determine oldest version in repo
			if (!version && !config.full) {
				const dependencies = await getDependencies({
					...config,
					dependencies: [argsName],
					all: true,
					verbose: true,
				});

				if (dependencies.length) {
					const oldestVerisonDep = dependencies.sort((a, b) =>
						semver.compare(
							a?.version?.installed,
							b?.version?.installed
						)
					)[0];

					version = oldestVerisonDep?.version?.installed;
					url = oldestVerisonDep?.url;
				}
			}

			setDepData({
				version,
				url,
			});
			updateLoading(false);
		} catch (error) {
			setError(error);
		}
	}, [config, updateLoading, argsName, argsVersion, setError]);

	useEffect(() => {
		startLoader();
	}, [startLoader]);

	return (
		<LoaderBoundary loading={loading} text={loaderText}>
			<Changelog
				name={argsName}
				version={depData.version}
				url={depData.url}
				full={config.full}
				onExit={exit}
			/>
		</LoaderBoundary>
	);
};

Changes.propTypes = {
	config: PropTypes.shape({
		dependency: PropTypes.string.isRequired,
		full: PropTypes.bool.isRequired,
	}).isRequired,
};

export default Changes;
