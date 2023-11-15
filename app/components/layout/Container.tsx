import { Dialog, Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/20/solid'
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid'
import { Link, NavLink, useLocation } from '@remix-run/react'
import { clsx } from 'clsx'
import * as React from 'react'
import { SearchPalette } from '~/components/layout/Search.tsx'
import { type NavItem } from '~/lib/docs/menu.server.ts'
import { NavLink as TNavLink } from '~/types.ts'
import * as Zipper from '~/utils/zipper.ts'

type ContainerProps = {
	menu: NavItem[]
	product: TNavLink
	versions: Zipper.NonEmptyZipperObj<TNavLink> | null
	links: TNavLink[]
	basePath: string
	isPrivate?: boolean
}

export default function Container({
	children,
	menu,
	product,
	versions,
	links,
	basePath,
	isPrivate = false,
}: React.PropsWithChildren<ContainerProps>) {
	const [isSearching, setIsSearching] = React.useState(false)
	const [os, setOs] = React.useState<string | null>('macos')
	const base = product.to.replaceAll('/', '-').replace(/^-/, '')
	const pdfLink = `/documentation/pdfs/${base}-${
		isPrivate ? 'private' : 'public'
	}.pdf`

	React.useEffect(() => {
		setOs(getOS())
	}, [])

	/**
	 * Hotkey events
	 */
	React.useEffect(() => {
		function toggle(e: KeyboardEvent) {
			const isMac = getOS() === 'macos'
			const modKey = isMac ? e.metaKey : e.ctrlKey
			if (modKey && e.key === 'k') {
				setIsSearching(prev => !prev)
			}
		}

		addEventListener('keydown', toggle)
		return () => removeEventListener('keydown', toggle)
	}, [])

	return (
		<div>
			<header className="sticky top-0 z-50 flex flex-wrap items-center justify-between bg-crunchy px-4 py-2 sm:px-6 lg:px-8">
				<div className="mr-6 flex lg:hidden">
					<MobileNavigation menu={menu} basePath={basePath} />
				</div>
				<div className="relative flex flex-1 items-center gap-4">
					<Logo />
					<div className="flex flex-1 justify-end sm:block">
						<button
							className="flex items-center gap-2 rounded-md border border-white/75 px-4 py-2 text-sm text-white hover:bg-white/20"
							onClick={() => setIsSearching(!isSearching)}
						>
							<MagnifyingGlassIcon className="h-4 w-4" />
							<span className="flex-1 pr-6">Search docs...</span>
							<span className="hidden text-xs sm:inline">
								{os === 'macos' ? '⌘K' : 'Ctrl + K'}
							</span>
						</button>
					</div>
					{isSearching && (
						<SearchPalette
							open={isSearching}
							setOpen={setIsSearching}
							productPath={product.to}
							isPrivate={isPrivate}
						/>
					)}
				</div>
				{links?.length ? (
					<div className="hidden items-center gap-6 text-sm text-white sm:flex">
						{links.map(({ label, to }) => (
							<a
								key={to}
								className="font-display font-bold underline-offset-4  hover:underline"
								href={to}
							>
								{label}
							</a>
						))}
					</div>
				) : null}
			</header>
			<div className="relative flex bg-white">
				<div className="sticky top-16 hidden h-[calc(100vh-4rem)] flex-col overflow-y-auto border-r lg:flex lg:w-[230px] xl:w-[290px]">
					<div className="px-6 pt-8">
						<Link
							to={`${basePath}${product.to}`}
							className="text-xs font-bold uppercase text-primary hover:text-primary hover:underline"
						>
							{product.label}
						</Link>
						{versions ? (
							<Menu as="div" className="relative mt-2 block">
								<Menu.Button className="flex w-full items-center justify-between gap-4 rounded-md border px-4 py-2 font-medium hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-crunchy/50">
									{versions.current.label}
									<ChevronDownIcon className="h-4 w-4" />
								</Menu.Button>
								<Transition
									as={React.Fragment}
									enter="transition ease-out duration-100"
									enterFrom="transform opacity-0 scale-95"
									enterTo="transform opacity-100 scale-100"
									leave="transition ease-in duration-75"
									leaveFrom="transform opacity-100 scale-100"
									leaveTo="transform opacity-0 scale-95"
								>
									<Menu.Items className="absolute left-0 z-30 mt-2 flex max-h-[200px] w-full origin-top-left flex-col overflow-y-auto overflow-x-hidden rounded-md border bg-white py-1 shadow-lg focus:outline-none">
										{Zipper.toArray(versions).map(({ to, label }) => (
											<Menu.Item
												key={to}
												as={'a'}
												href={`${basePath}${to}`}
												className={clsx(
													versions.current.label === label
														? 'border-l-2 border-crunchy text-crunchy'
														: 'border-l-2 border-transparent hover:border-gray-300 hover:text-primary',
													'px-4 py-1',
												)}
											>
												{label}
											</Menu.Item>
										))}
									</Menu.Items>
								</Transition>
							</Menu>
						) : null}
					</div>
					<Navigation
						menu={menu}
						className="flex-1 px-6 pb-10"
						basePath={basePath}
					/>

					<div className="sticky bottom-0 bg-white">
						<div className="flex items-center justify-between border-t px-4 py-3">
							<p className="text-sm">Other formats:</p>
							<a
								href={pdfLink}
								className="rounded border px-2 py-1 text-sm hover:bg-gray-50 hover:text-primary"
							>
								PDF
							</a>
						</div>
					</div>
				</div>
				<div className="min-w-0 flex-1 py-8">{children}</div>
			</div>
		</div>
	)
}

function getOS() {
	let userAgent = window.navigator.userAgent.toLowerCase(),
		macosPlatforms = /(macintosh|macintel|macppc|mac68k|macos)/i,
		windowsPlatforms = /(win32|win64|windows|wince)/i,
		iosPlatforms = /(iphone|ipad|ipod)/i,
		os: string | null = null

	if (macosPlatforms.test(userAgent)) {
		os = 'macos'
	} else if (iosPlatforms.test(userAgent)) {
		os = 'ios'
	} else if (windowsPlatforms.test(userAgent)) {
		os = 'windows'
	} else if (/android/.test(userAgent)) {
		os = 'android'
	} else if (!os && /linux/.test(userAgent)) {
		os = 'linux'
	}

	return os
}

function Navigation({
	menu,
	className,
	basePath,
}: React.ComponentPropsWithoutRef<'nav'> & {
	menu: NavItem[]
	basePath: string
}) {
	let { pathname } = useLocation()
	// Remove home from nav
	const [_home, ...items] = menu
	return (
		<nav className={clsx('mt-8 text-sm', className)}>
			<ul className="flex flex-col gap-4">
				{items.map(item => (
					<Group
						{...item}
						pathname={pathname}
						key={item.slug}
						basePath={basePath}
					/>
				))}
			</ul>
		</nav>
	)
}

function Group({
	slug,
	title,
	children,
	pathname,
	basePath,
}: NavItem & { pathname: string; basePath: string }) {
	const [open, setOpen] = React.useState(pathname.includes(slug))

	React.useEffect(() => {
		setOpen(
			pathname.includes(`${basePath}${slug}/`) ||
				pathname === `${basePath}${slug}`,
		)
	}, [pathname, slug])

	return (
		<li>
			<p className="flex items-center justify-between gap-3">
				<NavLink
					to={`${basePath}${slug}`}
					end
					className={({ isActive }) =>
						clsx(
							isActive ? 'text-crunchy' : 'text-primary',
							'font-display font-bold hover:text-crunchy',
						)
					}
				>
					{title}
				</NavLink>
				{children?.length ? (
					<button
						className={clsx('p-1 transition', open && 'rotate-90')}
						onClick={() => setOpen(prev => !prev)}
					>
						<ChevronRightIcon className="h-4 w-4" />
					</button>
				) : null}
			</p>
			{children?.length && open ? (
				<ul className="mt-2 border-l">
					{children.map((item, i) => (
						<Subgroup
							key={item.slug}
							pathname={pathname}
							end={i == 0 ? true : false}
							basePath={basePath}
							{...item}
						/>
					))}
				</ul>
			) : null}
		</li>
	)
}

function Subgroup({
	slug,
	title,
	children,
	pathname,
	end,
	basePath,
}: NavItem & { pathname: string; end: boolean; basePath: string }) {
	const [open, setOpen] = React.useState(pathname.includes(slug))

	React.useEffect(() => {
		setOpen(
			pathname.includes(`${basePath}${slug}/`) ||
				pathname === `${basePath}${slug}`,
		)
	}, [pathname, slug])

	return (
		<li className="relative">
			{children?.length ? (
				<p className="flex items-center justify-between gap-3">
					<NavLink
						to={`${basePath}${slug}`}
						end
						className={({ isActive }) =>
							clsx(
								'-ml-px block border-l-2 py-1 pl-3',
								isActive
									? 'border-crunchy text-crunchy'
									: 'border-transparent hover:border-[rgb(var(--text-primary))] hover:text-primary',
							)
						}
					>
						{title}
					</NavLink>
					{children?.length ? (
						<button
							className={clsx('p-1 transition', open && 'rotate-90')}
							onClick={() => setOpen(prev => !prev)}
						>
							<ChevronRightIcon className="h-4 w-4" />
						</button>
					) : null}
				</p>
			) : (
				<NavLink
					to={`${basePath}${slug}`}
					end={end}
					className={({ isActive }) =>
						clsx(
							'-ml-px block border-l-2 py-1 pl-3',
							isActive
								? 'border-crunchy text-crunchy'
								: 'border-transparent hover:border-[rgb(var(--text-primary))] hover:text-primary',
						)
					}
				>
					{title}
				</NavLink>
			)}
			{children?.length && open ? (
				<ul className="ml-3 border-l py-2">
					{children.map((item, i) => (
						<li className="relative" key={item.slug}>
							<NavLink
								to={`${basePath}${item.slug}`}
								end={i == 0 ? true : false}
								className={({ isActive }) =>
									clsx(
										'-ml-px block border-l-2 py-1 pl-3',
										isActive
											? 'border-crunchy text-crunchy'
											: 'border-transparent hover:border-[rgb(var(--text-primary))] hover:text-primary',
									)
								}
							>
								{item.title}
							</NavLink>
						</li>
					))}
				</ul>
			) : null}
		</li>
	)
}

function MobileNavigation({
	menu,
	basePath,
}: {
	menu: NavItem[]
	basePath: string
}) {
	let location = useLocation()
	let [isOpen, setIsOpen] = React.useState(false)

	React.useEffect(() => {
		setIsOpen(false)
	}, [location])

	return (
		<>
			<button
				type="button"
				onClick={() => setIsOpen(true)}
				className="relative"
				aria-label="Open navigation"
			>
				<MenuIcon className="h-6 w-6 stroke-white" />
			</button>
			<Dialog
				open={isOpen}
				onClose={setIsOpen}
				className="fixed inset-0 z-50 flex items-start overflow-y-auto bg-slate-900/50 pr-10 backdrop-blur lg:hidden"
				aria-label="Navigation"
			>
				<Dialog.Panel className="min-h-full w-full max-w-xs bg-white px-4 pb-12 pt-5 dark:bg-slate-900 sm:px-6">
					<div className="flex items-center">
						<button
							type="button"
							onClick={() => setIsOpen(false)}
							aria-label="Close navigation"
						>
							<CloseIcon className="h-6 w-6 stroke-slate-500" />
						</button>
						<Link to="/" className="ml-6" aria-label="Home page">
							Docs
						</Link>
					</div>
					<Navigation menu={menu} className="mt-5 px-1" basePath={basePath} />
				</Dialog.Panel>
			</Dialog>
		</>
	)
}

function MenuIcon(props: React.ComponentProps<'svg'>) {
	return (
		<svg
			aria-hidden="true"
			viewBox="0 0 24 24"
			fill="none"
			strokeWidth="2"
			strokeLinecap="round"
			{...props}
		>
			<path d="M4 7h16M4 12h16M4 17h16" />
		</svg>
	)
}

function CloseIcon(props: React.ComponentProps<'svg'>) {
	return (
		<svg
			aria-hidden="true"
			viewBox="0 0 24 24"
			fill="none"
			strokeWidth="2"
			strokeLinecap="round"
			{...props}
		>
			<path d="M5 5l14 14M19 5l-14 14" />
		</svg>
	)
}

function Logo() {
	return (
		<a
			href="https://access.crunchydata.com/documentation"
			className="inline-block shrink-0 rounded-full focus:!ring-white/50 focus:!ring-offset-crunchy"
			aria-label="Home"
		>
			<svg
				version="1.1"
				className="h-auto w-12"
				aria-label="Crunchy Data Logo"
				xmlns="http://www.w3.org/2000/svg"
				x="0px"
				y="0px"
				viewBox="0 0 213 207.3"
			>
				<g>
					<path
						className="fill-gray-900"
						d="M109.4,207.3C60.5,206.9,17.7,175.4,4.3,130C-12.2,74.1,20.1,17.6,77,3.7C120-6.8,156.9,5,186.1,37.6
		c33.8,37.7,35.4,90.5,6.6,128.6c-17.5,23.1-40.9,36.4-69.6,40.1c-3.5,0.5-7.1,0.7-10.6,1C111.4,207.3,110.4,207.3,109.4,207.3z
		 M101.5,5.2c-2.9,0-5.9-0.1-8.8,0c-1,0-2.8,0.3-2.1,1.8c1.3,2.5,2.7,5.1,4.8,6.9c1.6,1.3,4.1,0,6.1-0.6l14.4-1.6h20.4
		c-6.7-3.5-13.9-4.7-21.1-5.2C110.6,6.9,106.2,4.6,101.5,5.2z M53.2,18.8c-11.6,5.9-20.8,14.8-28.5,25C11.6,61,5.5,80.9,5.9,102.5
		c0.4,20.9,6.8,39.9,19.5,56.7c3.4,4.5,6.9,9,11.5,12.6c0.8-1.2,0.5-2.3,0.5-3.2c-0.5-5.8,1.5-10.8,4.9-15.3
		c1.3-1.6,2.5-3.2,3.9-4.8c1.6-1.9,1.8-2.8-1.1-3.7c-11.6-3.7-20.9-10.6-26.8-21.6c-0.2-0.5-0.6-0.9-1.1-1.1
		c-5.3-2.3-6.6-6.7-6.1-12c1-10.3,4.1-20,6.8-29.9c0.6-2,1.8-3.8,3.5-5c2.9-2.1,4.6-4.9,5.8-8.3c1.6-4.6,4.8-6.7,9.7-6.7
		c2.4,0,4.8-0.1,7.2,0c3.8,0.1,7.2-0.6,9.9-3.6c2.4-0.3,3.4-2.5,5.2-3.6c5.1-2.9,7.2-7.3,7.3-13.2c0.1-5.5,2.3-10.1,7.8-12.7
		c3-1.5,5.7-3.4,8.2-5.6c1.8-1.6,2.9-3.4,2.6-6c-0.5-3,0.1-6.1,1.7-8.6C74.3,8.7,63.3,12.3,53.2,18.8L53.2,18.8z M97.2,82.6
		c5.7,0.1,9.9,2.6,13.7,5.9c7,6,8.8,22.6-1.5,28.2c-9.2,5-18.7,8.1-29.3,7.2c-4.9-0.4-9.8-0.9-14.7-1.4c-12.1-1.2-24.1-3.4-36.3-1.6
		c-2.8,0.4-3.6,1.1-1.7,3.4c7.5,9.3,17.1,14.5,29.3,13.8c12-0.6,24-2.4,36-0.2c13.6,2.5,24.1-1.7,31.5-13.5c0.9-1.5,2.1-3,4.1-1.8
		c2,1.2,1.3,2.8,0.2,4.4c-6.3,9.9-14,17.6-26.9,17.3c-2,0-4.1,0.4-6.2,0.6c-1.9,0.2-3.6,0.8-4.7,2.5c-2.4,3.6-5.1,7.1-6.7,11.2
		c-4.2,10.8-8.4,21.6-12.6,32.4c-0.9,2.3-0.5,3.7,2.1,4.6c11.2,3.9,22.9,6,34.8,6.1c22.6,0.1,42.9-6.6,61-20.1
		c1.1-0.8,1.7-1.6,1.2-2.8c-3-7.8-0.9-15.3,1.2-22.9c1.7-6.2,2.9-12.5,1.8-19c-1.1-6.5-1-6.5-6.3-3.1c-4.5,3-9.6,4.8-14.6,6.7
		c-1.9,0.7-4.6,1-5.3-0.7c-1-2.4,2.1-2.4,3.5-3.1c4.1-2,8.8-3,12.4-5.9c9.4-7.6,13.9-18,15.5-29.7c0.8-5.3,1-10.7,1.5-16.1
		c0.1-1,0.2-2.1,1.7-2.1s1.4,1.2,1.5,2.2c0.1,0.8-0.1,1.6,0,2.4c0.4,12.6-2.3,24.9-4.3,37.2c-2,12.9-0.6,25.6,2.2,38.2
		c0.4,1.6,1,3.5,2.3,3.9c1.8,0.6,2.5-1.6,3.4-2.8c9-11.6,14.7-24.7,17.7-39.1c2.3-11.1,2-21.7-3.8-32c-4.1-7.3-7.7-14.8-11.7-22.2
		c-8.2-15.3-19.9-28-30.8-41.2c-3.3-4-7-7.9-11.8-10.4c-0.7-0.3-1.4-1.1-2.2-0.7c-1.1,0.6-0.4,1.7-0.3,2.5c1.5,6-3.9,12.8-9.7,14.9
		c-1.3,0.5-2.9,1.1-3.7-0.4c-0.8-1.5,1-2,1.9-2.8c3.9-3.4,6.1-9,5.1-13.3c-2.9,1.4-5.3,3.1-6.7,6c-0.6,1.3-1.5,3.7-3.1,2.8
		c-1.9-1.1-0.9-3.3,0.2-4.9c0.9-1.5,2.1-2.7,3.6-3.7c1.5-1,3.4-1.1,4.9-2.7c-1.6-0.9-3.5-1.3-5.4-1.2c-10.8,0.1-21.6-0.1-32.3,2.1
		c-3.4,0.6-6.8,1.4-9.5,3.8c-3.8,3.5-8.1,6.5-12.6,8.8c-1.9,1-3.8,2.1-3.1,4.7c0.6,2.4,2.6,3.6,5,3.9c1,0.1,2.3-0.2,2.6,1.2
		c0.3,1.2-1,1.7-1.7,2.3c-6.9,5.4-13.6,10.9-20.2,16.6c-4.3,3.7-9.9,5.7-15.5,5.5c-2.3-0.1-4.6,0-6.9,0c-5.4,0-6.6,1.6-5.1,6.8
		c0.5,1.9,0.7,3.9-1,5.4c-1.7,1.5-3.5,1.4-5.3-0.1c-0.9-0.7-1.6-0.4-2.3,0.5c-1.6,1.9-1.3,3.4,1.2,4c4.4,1.2,7.7-1.1,10.8-3.9
		c0.6-0.6,1.4-1.6,2.3-0.9c1,0.7,0.4,1.7-0.1,2.5c-1.9,3.7-9.4,7.7-13.6,7.2c-1.1-0.1-1.7,0-2,1.2c-1.8,7.2-4.1,14.3-4.7,21.8
		c-0.6,7.6,1.2,9.1,8.7,7.4c12.4-2.9,24.6-3.7,37,0.2c6.7,2.1,13.8,2.3,20.9,1.5c8.2-0.9,16.4-2.3,23.2-7.5c2.7-1.9,4.3-4.8,4.6-8.1
		c0.5-4.9-1.8-8.4-5.1-11.5C103.4,88,100.5,85.5,97.2,82.6L97.2,82.6z M72.1,142v0.1c-1.1-0.1-2.3-0.2-3.4-0.2
		c-5.3-0.1-10.7-0.5-14.8,3.9c-5,5.4-8.9,11.4-10.2,18.7c-2.2,11.5-0.6,14.7,9.5,20.6l3.2,1.9c8.2,4.7,8.2,4.7,11.1-4.1
		c1.4-4.1,0.4-7-3.3-9.4c-0.9-0.6-1.8-0.9-2.7-1.4c-0.9-0.5-1.6-1.1-1.5-2.1c0.1-0.9,0.9-1.7,1.8-1.9c3.2-0.4,6.4-1.5,9.5-0.3
		c1.6,0.6,2.3,0.1,2.9-1.2c3.3-7.3,6.7-14.5,10.1-21.8c0.7-1.5,0.3-2-1.3-2.1C79.5,142.5,75.8,142.2,72.1,142L72.1,142z M158.7,23
		c17.3,17.7,31.8,37.8,43.2,59.8C203,66.7,174.5,27.2,158.7,23z"
					/>
					<path
						className="fill-white"
						d="M97.2,82.6c3.3,2.9,6.2,5.4,9.1,8.1c3.3,3.1,5.5,6.6,5.1,11.5c-0.2,3.2-1.9,6.2-4.6,8.1
		c-6.9,5.2-15,6.7-23.2,7.5c-7,0.7-14.2,0.6-20.9-1.5c-12.4-3.9-24.7-3.1-37-0.2c-7.6,1.8-9.3,0.3-8.7-7.4
		c0.6-7.5,2.9-14.6,4.7-21.8c0.3-1.2,0.9-1.3,2-1.2c4.2,0.5,11.6-3.4,13.6-7.2c0.4-0.8,1-1.8,0.1-2.5c-0.9-0.7-1.7,0.3-2.3,0.9
		c-3,2.8-6.3,5.1-10.8,3.9c-2.5-0.6-2.8-2.1-1.2-4c0.7-0.9,1.4-1.2,2.3-0.5c1.8,1.4,3.6,1.6,5.3,0.1c1.7-1.5,1.6-3.5,1-5.4
		c-1.4-5.2-0.3-6.8,5.1-6.8c2.3,0,4.6-0.1,6.9,0c5.7,0.2,11.3-1.7,15.5-5.5c6.6-5.7,13.4-11.2,20.2-16.6c0.8-0.6,2-1.1,1.7-2.3
		c-0.3-1.3-1.6-1-2.6-1.2c-2.4-0.3-4.3-1.5-5-3.9c-0.7-2.6,1.2-3.7,3.1-4.7c4.6-2.4,8.8-5.4,12.6-8.8c2.7-2.4,6.1-3.1,9.5-3.8
		c10.6-2.1,21.5-1.9,32.3-2.1c1.9-0.1,3.7,0.3,5.4,1.2c-1.5,1.5-3.4,1.7-4.9,2.7c-1.4,1-2.6,2.2-3.6,3.7c-1,1.6-2.1,3.8-0.2,4.9
		c1.6,0.9,2.5-1.5,3.1-2.8c1.4-3,3.9-4.7,6.7-6c1,4.3-1.2,9.9-5.1,13.3c-0.9,0.8-2.7,1.3-1.9,2.8c0.8,1.5,2.4,0.8,3.7,0.4
		c5.8-2,11.2-8.8,9.7-14.9c-0.2-0.8-0.9-1.9,0.3-2.5c0.8-0.4,1.5,0.4,2.2,0.7c4.8,2.5,8.4,6.4,11.8,10.4
		c10.9,13.3,22.6,26,30.8,41.2c4,7.4,7.6,14.9,11.7,22.2c5.8,10.3,6.1,20.9,3.8,32c-3,14.4-8.7,27.5-17.7,39.1
		c-0.9,1.2-1.6,3.4-3.4,2.8c-1.3-0.4-2-2.3-2.3-3.9c-2.8-12.6-4.2-25.3-2.2-38.2c1.9-12.3,4.7-24.6,4.3-37.2c0-0.8,0.1-1.6,0-2.4
		c-0.1-1,0-2.2-1.5-2.2c-1.6,0-1.6,1.1-1.7,2.1c-0.5,5.4-0.7,10.8-1.5,16.1c-1.7,11.7-6.1,22.1-15.5,29.7c-3.6,2.9-8.3,3.8-12.4,5.9
		c-1.5,0.7-4.5,0.7-3.5,3.1c0.7,1.8,3.5,1.4,5.3,0.7c5-1.9,10.1-3.7,14.6-6.7c5.3-3.5,5.2-3.5,6.3,3.1c1.1,6.5,0,12.8-1.8,19
		c-2.1,7.6-4.2,15.1-1.2,22.9c0.5,1.3-0.1,2-1.2,2.8c-18,13.5-38.3,20.2-60.9,20.1c-11.8-0.1-23.6-2.1-34.8-6.1
		c-2.6-0.9-3-2.2-2.1-4.6c4.2-10.8,8.3-21.6,12.6-32.4c1.6-4.1,4.3-7.6,6.7-11.2c1.1-1.6,2.8-2.3,4.7-2.5c2.1-0.2,4.1-0.6,6.2-0.6
		c12.9,0.3,20.6-7.4,26.9-17.3c1-1.6,1.7-3.2-0.2-4.4c-2-1.2-3.2,0.3-4.1,1.8c-7.4,11.8-18,16-31.5,13.5c-12-2.2-24-0.4-36,0.2
		c-12.1,0.6-21.7-4.6-29.3-13.8c-1.9-2.3-1.1-3,1.7-3.4c12.2-1.9,24.3,0.4,36.3,1.6c4.9,0.5,9.8,0.9,14.7,1.4
		c10.6,1,20.1-2.2,29.3-7.2c10.3-5.6,8.5-22.2,1.5-28.2C107.1,85.2,102.9,82.7,97.2,82.6z M111.8,40.4c-4.8-0.1-11,3-13.9,6.7
		c-0.7,0.9-1,1.9-0.4,2.8c0.6,1.1,1.6,0.5,2.4,0c1.2-0.9,1.5,0.3,2.1,0.8c4,3.6,9.2,2.6,11.4-2.1c0.8-1.7,0.3-4,3-4.8
		c0.7-0.2,0.4-1.6-0.6-2.1C114.5,40.9,113.2,40.5,111.8,40.4z M59.3,91.9c3-0.5,5.7-1.4,7.4-4c0.8-1.2,0.8-2.3-0.1-3.4
		c-1-1.1-1.8-1-3-0.4c-1.6,0.8-3.4,1.6-5.1,1.9c-4.4,0.5-8.9,1.2-12.2-3c-0.7-0.9-1.3-2.6-2.8-1.7c-1.4,0.9,0.1,2.3,0.3,3.4
		c0.1,0.7,0.9,1.3,1.4,1.9C48.9,91.1,54.5,90.5,59.3,91.9z M53.9,72.2c-2.2,0.3-4.5,0.4-4.8,3.3c-0.2,2.2,3.5,7.3,5.3,7.4
		c1.9,0.1,4.1-2.6,4-5.2C58.3,74.6,56.4,72.2,53.9,72.2L53.9,72.2z"
					/>
					<path
						className="fill-white"
						d="M72.1,142c3.7,0.3,7.3,0.6,11,0.8c1.6,0.1,2,0.6,1.3,2.1c-3.4,7.3-6.8,14.5-10.1,21.8
		c-0.6,1.3-1.3,1.8-2.9,1.2c-3.1-1.1-6.3-0.1-9.5,0.3c-0.9,0.2-1.7,0.9-1.8,1.9c-0.2,1,0.6,1.7,1.5,2.1c0.8,0.5,1.9,0.8,2.7,1.4
		c3.7,2.4,4.7,5.3,3.3,9.4c-3,8.8-3,8.8-11.1,4l-3.2-1.9c-10.1-6-11.7-9.2-9.5-20.6c1.4-7.3,5.3-13.4,10.2-18.7
		c4-4.4,9.5-4,14.8-3.9C69.9,141.8,71,142,72.1,142L72.1,142z"
					/>
					<path
						className="fill-white/50"
						d="M86.6,6.8c-1.6,2.6-2.2,5.6-1.7,8.6c0.3,2.6-0.7,4.4-2.6,6c-2.4,2.2-5.2,4.1-8.1,5.6
		c-5.5,2.6-7.6,7.3-7.8,12.7c-0.1,5.9-2.2,10.3-7.3,13.2c-1.9,1-2.9,3.3-5.2,3.6c-2.7,2.9-6.1,3.7-9.9,3.6c-2.4-0.1-4.8,0-7.2,0
		c-4.9,0-8.1,2.2-9.7,6.7c-1.2,3.3-2.9,6.1-5.8,8.3c-1.7,1.2-2.9,3-3.5,5c-2.6,9.9-5.8,19.7-6.8,29.9c-0.5,5.3,0.8,9.7,6.1,12
		c0.5,0.2,0.9,0.6,1.1,1.1c5.8,11,15.1,17.9,26.8,21.6c2.9,0.9,2.7,1.8,1.1,3.7c-1.3,1.6-2.6,3.2-3.9,4.8c-3.5,4.5-5.4,9.5-4.9,15.3
		c0.1,1,0.3,2-0.5,3.2c-4.6-3.7-8.1-8.2-11.5-12.7c-12.6-16.8-19-35.8-19.5-56.7C5.5,80.8,11.6,61,24.7,43.8
		c7.7-10.2,16.9-19.1,28.5-25C63.3,12.3,74.3,8.7,86.6,6.8z M158.7,23c17.3,17.7,31.8,37.8,43.2,59.8C203,66.7,174.5,27.2,158.7,23z
		 M101.5,5.2c-2.9,0-5.9-0.1-8.8,0c-1,0-2.8,0.3-2.1,1.8c1.3,2.5,2.7,5.1,4.8,6.9c1.6,1.3,4.1,0,6.1-0.6l14.4-1.6h20.4
		c-6.7-3.5-13.9-4.7-21.1-5.2C110.6,6.9,106.2,4.6,101.5,5.2L101.5,5.2z"
					/>
					<path
						className="fill-gray-900"
						d="M111.8,40.4c1.4,0.1,2.7,0.5,3.9,1.2c1.1,0.6,1.3,1.9,0.6,2.1c-2.6,0.7-2.2,3.1-3,4.8
		c-2.2,4.7-7.4,5.7-11.4,2.1c-0.6-0.5-0.9-1.7-2.1-0.8c-0.7,0.5-1.7,1.2-2.4,0c-0.6-0.9-0.3-1.9,0.4-2.8
		C100.8,43.3,107.1,40.3,111.8,40.4z"
					/>
					<path
						className="fill-gray-900"
						d="M59.3,91.9c-4.8-1.4-10.5-0.9-14.2-5.4c-0.5-0.6-1.3-1.2-1.4-1.9c-0.2-1.1-1.7-2.5-0.3-3.4
		c1.5-0.9,2.1,0.9,2.8,1.7c3.3,4.2,7.8,3.5,12.2,3c1.8-0.2,3.5-1.1,5.1-1.9c1.2-0.6,2.1-0.7,3,0.4c0.9,1.1,0.9,2.3,0.1,3.4
		C65,90.5,62.4,91.4,59.3,91.9z"
					/>
					<path
						className="fill-gray-900"
						d="M53.9,72.2c2.5,0,4.4,2.4,4.5,5.5c0,2.5-2.1,5.3-4,5.2c-1.8-0.1-5.5-5.2-5.3-7.4
		C49.4,72.6,51.7,72.5,53.9,72.2z"
					/>
				</g>
			</svg>
		</a>
	)
}
