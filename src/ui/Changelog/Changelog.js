import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import ChangelogViewer from './ChangelogViewer';
import TestBoundary from '../TestBoundary';
import LoaderBoundary from '../LoaderBoundary';
import useDependencyLoader from '../useDependencyLoader';
import { getChangelog } from '../../common/changelog';
import { useError } from '../ErrorBoundary';

const Changelog = ({
	name,
	version = undefined,
	url = undefined,
	full = false,
	isFocused = true,
	onExit,
	exitKey = undefined,
	exitKeyLabel = undefined,
	exitText = undefined,
	showExitOnFallback = false,
}) => {
	const { loading, updateLoading, loaderText, updateLoaderText } =
		useDependencyLoader();
	const { setError } = useError();
	const [changelog, setChangelog] = useState({ data: [], url: '' });

	const startLoader = useCallback(async () => {
		try {
			updateLoaderText('fetching changelog');
			const res = await getChangelog({
				name,
				version: full ? null : version,
				url,
			});
			setChangelog(res);
			updateLoading(false);
		} catch (error) {
			setError(error);
		}
	}, [updateLoading, updateLoaderText, name, version, url, full, setError]);

	useEffect(() => {
		startLoader();
	}, [startLoader]);

	return (
		<TestBoundary shouldStop={!loading}>
			<LoaderBoundary loading={loading} text={loaderText}>
				<ChangelogViewer
					isFocused={isFocused}
					name={name}
					url={changelog?.url}
					data={changelog?.data}
					height={30}
					width={80}
					onExit={onExit}
					exitKey={exitKey}
					exitKeyLabel={exitKeyLabel}
					exitText={exitText}
					showExitOnFallback={showExitOnFallback}
				/>
			</LoaderBoundary>
		</TestBoundary>
	);
};

Changelog.propTypes = {
	name: PropTypes.string.isRequired,
	version: PropTypes.string,
	url: PropTypes.string,
	full: PropTypes.bool,
	isFocused: PropTypes.bool,
	onExit: PropTypes.func.isRequired,
	exitKey: PropTypes.func,
	exitKeyLabel: PropTypes.string,
	exitText: PropTypes.string,
	showExitOnFallback: PropTypes.bool,
};

export default Changelog;
