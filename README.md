# Crunchy Documentation

This repository contains the source for the [Crunchy's public documentation](https://docs.crunchybridge.com/). It is built with [Remix](https://remix.run/).

| If you do not have any experience working with node and the npm package manager please refer to the instructions found here: [Setup from scratch](#setup-from-scratch)

## Install Dependencies:

```bash
# Setup correct versions
asdf install

# Install node dependencies
npm i

# Copy environment variables
cp .env.example .env
```

## Start development server

This will allow you to preview the docs real-time on your local machine.

```bash
npm run dev
```

Open: [https://localhost:3000](https://localhost:3000)

### Editor Recommendations

It's recommended to use the [vscode](https://code.visualstudio.com/) code editor (or similar) in order to install plugins that make code contribution to this codebase a much smoother process.

Currently, the following plugins are recommended for improving the development experience:

| Plugin | Description |
| --- | --- |
| [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) | Read our `.prettierrc` and format or save files to match |
| [MDX](https://marketplace.visualstudio.com/items?itemName=unifiedjs.vscode-mdx) | Allows better highlighting and formatting for `.mdx` files. |
| [Code Spell Checker](https://marketplace.visualstudio.com/items?itemName=streetsidesoftware.code-spell-checker) | A basic spell checker that works well with camelCase code |
| [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) | Integrates ESLint into VS Code |
| [Pretty TS Errors](https://marketplace.visualstudio.com/items?itemName=yoavbls.pretty-ts-errors) | This takes the error output from Typescript and makes them more human readable |

## Adding Content

Content is currently managed in separate repos for each product. This site is only used to serve the documentation from all of our product repos.

Once you have cloned this repo and the product docs repo you would like to edit you will set the env variable outlined in the docs repo to point to the location on your local file to find that products documentation.

## Setup from scratch

Okay if you have never worked with node or npm then let's walkthrough how to get setup. Thankfully it is so much easier than it used to be.

The first thing you will need to do is go get [asdf](https://asdf-vm.com/guide/getting-started.html#_1-install-dependencies) installed.

1. Install language plugins

Once you have asdf installed you will need to install a `plugin` to add node to available languages to manage in asdf. We also will be installing Java because of the tooling that is used to generate the API library we use to make requests to Platform for the changelog.

```bash
asdf plugin-add nodejs

# For updating the Platform API client SDK
asdf plugin-add java
```

2. Install correct versions

The asdf ecosystem allow project-by-project version management using the `.tool-versions` file. We have one setup already so all you will need to do is run the install command to get everything synced up.

```bash
asdf install
```
