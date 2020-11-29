## Quick Start

1. `npm i`
2. `npm link`
3. `refit`

## Notes

-   What problem am I trying to solve?

It takes a long time to lookup release notes for breaking changes or
useful updates when going through node modules to update.

-   How do I solve this problem?

Lookup the release notes on github for each node module and show the
release notes for the versions since the version that's currently installed.

-   What are ways to implement this solution?

1. Website where you can upload/link/paste a package.json file and it shows
   all the release notes for each package. Maybe you can select which versions
   you want and it outputs an npm install command to use. - A website isnt as accessible as having it in the cli or a vscode extension - A website can't extend to a replacement for npm outdated or ncu

2. CLI interface that replaces ncu and lerna-update but also shows release
   notes in the terminal + link to the github page. - It's a lot more work to create a complete ncu replacement - The most accessible - Not the best way to view and read patch notes. There should be another component to display the notes

3. VSCode extension

    - probably the best option being able to put buttons and text right in the package.json
    - only accessible to vscode users
    - maybe ties into the cli like eslint and prettier extensions do

4. Desktop app
    - getting people to install a desktop app may be hard
    - best potential for a ui to manage node modules + notifications on node module updates

## TODO

-   [x] list currently installed packages and their versions (check if installed differs from package json based on ^ or whatever).
-   [x] get the available versions of a package on the npm registry
-	[x] add dependency type column
-	[x] add update to wanted and update to latest values
-	[ ] color update to values
- 	[x] color columns
-	[x] make list, update commands and flags
-	[x] add a clean install option that removes package-lock file and node_modules folder
-	[x] make config file
-	[ ] make interactive updater
-	[ ] make http request throttle function
-   [ ] fetch release notes for all version between current and latest
-   [ ] create a command that lists packages with the wanted, latest, release link, (to be installed version column for the below feature)
-   [ ] make packages in the list command selectable which shows release notes and allows you to select version you want to upgrade to
-   [ ] make function to install packages selected

extension:

-   [ ] display button/icon/text on package.json
-   [ ] explorer panel that lists the node modules
-   [ ] decide how to display the information

monorepo:

-   [ ] check for 'packages' key in package.json and search from package.json files in sub folders
-   [ ] get list of hoisted and local node modules and their versions
-   [ ] install/hoist modules

name ideas:
- refit
- refitly
- drippy

### Interactive Plan

- list packages: user selects a package
- list options to: update or remove
- list package versions: select a version

- show patch notes for version: confirm or go back
- show options to: confirm, view notes, or go back

- list repos: select repo

- list changes: select to change more or finish