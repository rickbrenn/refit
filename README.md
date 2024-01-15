# 📦 Refit - Dependency Manager

[![npm version](https://img.shields.io/npm/v/refit.svg)](https://www.npmjs.com/package/refit)
[![npm downloads](https://img.shields.io/npm/dm/refit.svg)](https://www.npmjs.com/package/refit)

A CLI tool for reviewing, adding, updating, and viewing the changelog for NPM dependencies.

**🚀 Package Managers:** Works with `npm`, `yarn`, and `pnpm`.

**🔥 Monorepos:** Supports managing dependencies across the entire monorepo or individual workspaces.

**🪄 Wizard:** Provides a step by step interactive wizard for full control over managing your dependencies in your project and monorepo workspaces.

**🛠️ Changelogs:** View the changelog for dependencies before you update them so you never have to leave the terminal.

## Installation

Install globally:

```bash
npm install -g refit
```

Or run with npx:

```bash
npx refit
```

> **Note:** Requires Node.js 18+

## Commands

### List

```bash
refit [options]

```

### Update

```bash
refit update [...dependencies] [options]

```

### Wizard

```bash
refit wizard [options]

```

### Changelogs

```bash
refit changes [options]

```
