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

Add new content under the `content/` directory. Run `npm run new` to add a new page, e.g.:

    npm run new general/new_page.mdx

To create a new top-level section, create a new subdirectory that contains an `index.mdx`.

**NOTE: We currently only support a single level of nesting.**

Each content file needs the following front matter: `title`, `draft`, and `weight`. You can also optionally manage the SEO metadata that shows in Google results and in the tab title using the `meta` front matter, e.g.:

```yaml
----
  title: "Clusters"
  draft: false
  weight: 130
  meta:
    title: "Cluster API Reference"
    description: "A detailed breakdown of our Cluster APIs and how to use them."
----
```

Images are added under `images`. These will be optimized and processed for you in the background. To add an image to a doc, insert the following:

```tsx
<Image
  src="/images/create-fork"
  width={900}
  alt="Forking a cluster in Dashboard"
/>
```

**NOTE: The extension is left off and added during build.**

## Changelog from previous hugo site

Below we will be detailing all of the changes from how things were done in the Hugo docs from before, and how they are done now. Most changes stem from our use of [MDX](https://mdxjs.com/), without changing underlying functionality. If we missed anything just let us know!

### Links

relref -> Ref no relative paths no slash in the front

### Images

**Before:**

They were stored in `assets/images/`.

```
{{< imgsrcset "images/api-keys.png" 900 "API keys in account settings" >}}
```

**Now**

Stored in `images/`

```tsx
<Image src="/images/api-keys" width={900} alt="API keys in account settings" />
```

### Fixed `id` Headings

All headings are links. There are cases where we do not want the `id` that is used to generate the link to be based on the text content of the heading to provide a more stable link we can use in other locations.

**Before**

```md
## This is a heading {#this-is-static-id}
```

**Now**

As, with most of the changes it is now a component that closely resembles the expected HTML you would use.

```tsx
<h2 id="this-is-static-id">This is a heading</h2>
```

This is only necessary for headings that use the static id. If you do not need a static id you can just use standard markdown syntax for headings, e.g.:

```md
### Heading in the middle
```

### Callout

**Before**

```
{{< callout >}}
This is a callout
{{< /callout >}}
```

**Now**

```tsx
<Callout>This is a callout</Callout>
```

### Info

**Before**

```
{{< info >}}
This is good info
{{< /info >}}
```

**Now**

```tsx
<Info>This is good info</Info>
```

### Redirects

**Before** You would use an `aliases` key in the front matter to create redirects from a list of paths.

```
aliases:
  - networks
```

**Now**

Now all redirects are managed in `server/_redirects.txt` they follow the following pattern:

```
redirectFrom   redirectTo
```

So the example from before would look like:

```
/networks  /network
```

## Tips & Gotchas

### When working with any Components or HTML in the `.mdx` files. Content inside of the components is treated like markdown.

This means that new lines (even right after the opening tag) are treating like paragraphs. You can add headings, links, tables, whatever. So if the output looks like it has too much spacing go and check to see if you have a new line at the start or end of the content inside.

### Turn off line-wrap when editing tables

Tables get autoformatted to be aligned with the longest piece of text inside each column. So, when you don't have line-wrapping toggled on it looks awesome, but if you have line-wrap toggled on...it looks real gross.

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
