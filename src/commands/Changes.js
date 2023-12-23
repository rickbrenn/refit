import React, { useEffect, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
// eslint-disable-next-line import/no-unresolved, node/no-missing-import
import { useApp, Text } from 'ink';
import semver from 'semver';
import useDependencyLoader from '../ui/useDependencyLoader';
import LoaderBoundary from '../ui/LoaderBoundary';
import { getChangelog } from '../common/changelog';
import getDependencies from '../common/getDependencies';
import ChangelogViewer from '../ui/ChangelogViewer';

const Changes = ({ config }) => {
	const {
		loading,
		updateLoading,
		loaderText,
		updateLoaderText,
		showLoaderError,
	} = useDependencyLoader();
	const [changelog, setChangelog] = useState({ data: [], url: '' });
	const { exit } = useApp();

	const [argsName, argsVersion] = config.dependency.split('@');

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

				const oldestVerisonDep = dependencies.sort((a, b) =>
					semver.compare(a.version.installed, b.version.installed)
				)[0];

				version = oldestVerisonDep.version.installed;
				url = oldestVerisonDep.url;
			}

			updateLoaderText('fetching changelog');
			const res = await getChangelog({
				name: argsName,
				version,
				url,
			});
			setChangelog(res);
		} catch (err) {
			// TODO: test error handling
			showLoaderError();
			throw err;
		} finally {
			updateLoading(false);
		}
	}, [
		config,
		updateLoading,
		showLoaderError,
		updateLoaderText,
		argsName,
		argsVersion,
	]);

	useEffect(() => {
		startLoader();
	}, [startLoader, config]);

	if (!loading && !changelog?.data?.length) {
		return <Text color="blue">No changelog data to display</Text>;
	}

	return (
		<LoaderBoundary loading={loading} text={loaderText}>
			<ChangelogViewer
				name={argsName}
				url={changelog?.url}
				data={changelog?.data}
				height={30}
				width={80}
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
