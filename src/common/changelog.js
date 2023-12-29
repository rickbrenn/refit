import { Marked } from 'marked';
import { markedTerminal } from 'marked-terminal';
import semver from 'semver';
import { Octokit } from '@octokit/core';
import { getRegistryData, parseGitHubUrl } from './dependencies';

const validChangelogFiles = ['changelog.md', 'history.md'];

const semverRegex =
	/(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?/;

const marked = new Marked(markedTerminal());
const octokit = new Octokit({ userAgent: 'refit' });

const parsePaginationHeader = (header) => {
	const links = header.split(', ');
	const linkObj = {};

	for (const link of links) {
		const linkParts = link.split('; ');
		const url = linkParts[0].slice(1, -1);
		const rel = linkParts[1].split('=')[1].slice(1, -1);
		const urlObj = new URL(url);
		const page = urlObj.searchParams.get('page');

		linkObj[rel] = page;
	}

	return linkObj;
};

const getGitHubChangelog = async ({ user, project, version }) => {
	const versions = [];

	const contentRes = await octokit.request({
		method: 'GET',
		url: '/repos/{user}/{project}/contents',
		user,
		project,
	});

	const changelogFile = contentRes.data.find((file) =>
		validChangelogFiles.includes(file.name.toLowerCase())
	);

	if (!changelogFile) {
		return versions;
	}

	const fileRes = await octokit.request({
		method: 'GET',
		url: '/repos/{user}/{project}/contents/{file}',
		user,
		project,
		file: changelogFile.path,
	});

	const { data } = fileRes;

	if (data.message === 'Not Found' || !data.content) {
		return versions;
	}
	const changelog = Buffer.from(data.content, 'base64').toString('utf8');

	const tokens = marked.lexer(changelog);

	const isVersionToken = (t) =>
		t.type === 'heading' && semverRegex.test(t.text);

	let atMinVersion = false;
	for (const [currIndex, token] of tokens.entries()) {
		if (isVersionToken(token)) {
			const currVersion = token.text.match(semverRegex)[0];

			if (currVersion) {
				if (version && semver.gte(version, currVersion)) {
					atMinVersion = true;
				}

				if (!atMinVersion) {
					const nextVersionIndex = tokens.findIndex(
						(t, index) => index > currIndex && isVersionToken(t)
					);
					const versionTokens = tokens.slice(
						currIndex + 1,
						nextVersionIndex > -1 ? nextVersionIndex : undefined
					);

					const markdown = marked.parser(versionTokens);

					if (markdown) {
						versions.push({
							version: currVersion,
							changes: markdown,
						});
					}
				}
			}
		}
	}

	return versions;
};

const getGitHubReleases = async ({ user, project, version }) => {
	let page = '1';
	let atMinVersion = false;

	const versions = [];

	while (page && !atMinVersion) {
		const response = await octokit.request({
			method: 'GET',
			url: '/repos/{user}/{project}/releases',
			user,
			project,
			per_page: 100,
			page,
		});

		if (response.status >= 400) {
			throw new Error('Error fetching releases');
		}

		for (const release of response.data) {
			const stringsToTest = [release.tag_name, release.name];
			const semverString = stringsToTest.find((s) => semverRegex.test(s));
			const currVersion = semverString.match(semverRegex)[0];

			if (version && semver.gte(version, currVersion)) {
				atMinVersion = true;
			}

			if (!atMinVersion && release.body) {
				versions.push({
					version: currVersion,
					changes: marked.parse(release.body),
				});
			}
		}

		const nextLink = response.headers.link;
		const nextPage = parsePaginationHeader(nextLink).next;
		page = nextPage || null;
	}

	return versions;
};

const getGitHubUrl = async (name) => {
	const registryData = await getRegistryData(name, {
		fullMetadata: true,
	});

	const repoUrl = registryData?.repository?.url;

	if (!repoUrl) {
		throw new Error('Repository not found');
	}

	return repoUrl;
};

const sourceConfigs = [
	{
		name: 'changelog',
		fetch: getGitHubChangelog,
	},

	{
		name: 'releases',
		fetch: getGitHubReleases,
	},
];

const getChangelog = async ({ name, version, url }) => {
	const repoUrl = url || (await getGitHubUrl(name));

	const { user, project } = parseGitHubUrl(repoUrl);

	const combined = [];
	for (const sourceConfig of sourceConfigs) {
		const changes = await sourceConfig.fetch({ user, project, version });

		for (const changeVersion of changes) {
			const existingVersion = combined.find(
				(v) => v.version === changeVersion.version
			);

			if (existingVersion) {
				existingVersion[sourceConfig.name] = changeVersion.changes;
			} else {
				combined.push({
					version: changeVersion.version,
					[sourceConfig.name]: changeVersion.changes,
				});
			}
		}
	}

	return {
		url: `https://github.com/${user}/${project}`,
		data: combined.toSorted((a, b) => semver.compare(b.version, a.version)),
	};
};

export {
	getChangelog,
	getGitHubChangelog,
	getGitHubReleases,
	semverRegex,
	sourceConfigs,
};
