import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Text, Box } from 'ink';
import { Selector } from '../../ui/Selector';
import { depTypesList } from '../../common/dependencies';
import Header from './Header';

const DependencyTypeStep = ({ wizardState, setWizardState }) => {
	const [data, setData] = useState({
		currPackageIndex: 0,
	});

	const { currPackageIndex, ...depTypes } = data;
	const { packages } = wizardState;

	const packagesMissingType = packages.filter(({ type }) => !type);
	const currPackage = packagesMissingType[currPackageIndex].name;
	const currPackageState = packages.map((pkg) => {
		return {
			...pkg,
			type: pkg.type || depTypes[pkg.name],
		};
	});
	const isLastPackage = currPackageIndex === packagesMissingType.length - 1;

	const handleSelect = ({ typeKey }) => {
		if (isLastPackage) {
			setWizardState((prevState) => ({
				...prevState,
				step: prevState.step + 1,
				updates: [
					...prevState.updates,
					{
						dependency: prevState.dependency,
						version: prevState.version,
						wildcard: prevState.wildcard,
						packages: currPackageState.map((pkg) => {
							if (pkg.name === currPackage) {
								return {
									...pkg,
									type: typeKey,
								};
							}

							return pkg;
						}),
					},
				],
			}));
		} else {
			setData((prevState) => ({
				...prevState,
				currPackageIndex: prevState.currPackageIndex + 1,
				[currPackage]: typeKey,
			}));
		}
	};

	const options = Object.entries(depTypesList).map(([key, value]) => ({
		label: value,
		typeKey: key,
	}));

	return (
		<>
			<Header
				wizardState={{ ...wizardState, packages: currPackageState }}
			/>
			<Selector
				renderTitle={() => {
					return (
						<Box>
							<Text>Select a dependency type for </Text>
							<Text color="green">{currPackage}</Text>
						</Box>
					);
				}}
				items={options}
				onSelect={handleSelect}
			/>
		</>
	);
};

DependencyTypeStep.propTypes = {
	wizardState: PropTypes.shape({
		dependency: PropTypes.shape({ name: PropTypes.string }),
		packages: PropTypes.arrayOf(
			PropTypes.shape({
				name: PropTypes.string,
				type: PropTypes.string,
			})
		),
	}).isRequired,
	setWizardState: PropTypes.func.isRequired,
};

export default DependencyTypeStep;
