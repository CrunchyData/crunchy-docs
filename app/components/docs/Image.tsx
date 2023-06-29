import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/20/solid'
import { Fragment, useState, type ComponentPropsWithoutRef } from 'react'

function Base({ src, width, alt, ...props }: ComponentPropsWithoutRef<'img'>) {
	return (
		<img
			src={`${src}.webp`}
			srcSet={`${src}@2x.webp 2x, ${src}.webp 1x`}
			alt={alt}
			className="mx-auto w-full"
			{...(width ? { style: { maxWidth: `${width}px` } } : {})}
			{...props}
		/>
	)
}

export default function Image({
	src,
	alt,
	width,
	lightbox = true,
	...props
}: ComponentPropsWithoutRef<'img'> & { lightbox?: boolean }) {
	const [isOpen, setIsOpen] = useState(false)
	return lightbox ? (
		<>
			<button
				onClick={() => setIsOpen(true)}
				className="not-prose inline-block w-full"
			>
				<Base {...props} src={src} alt={alt} width={width} />
			</button>
			<Transition appear show={isOpen} as={Fragment}>
				<Dialog
					as="div"
					className="relative z-50"
					open={isOpen}
					onClose={() => setIsOpen(false)}
				>
					<Transition.Child
						as={Fragment}
						enter="ease-out duration-300"
						enterFrom="opacity-0"
						enterTo="opacity-100"
						leave="ease-in duration-200"
						leaveFrom="opacity-100"
						leaveTo="opacity-0"
					>
						<div className="fixed inset-0 bg-gray-1100/50 backdrop-blur" />
					</Transition.Child>
					<div className="fixed inset-0 overflow-y-auto">
						<div className="flex min-h-full items-center justify-center p-4 text-center">
							<Transition.Child
								as={Fragment}
								enter="ease-out duration-300"
								enterFrom="opacity-0 scale-95"
								enterTo="opacity-100 scale-100"
								leave="ease-in duration-200"
								leaveFrom="opacity-100 scale-100"
								leaveTo="opacity-0 scale-95"
							>
								<Dialog.Panel className="relative w-full max-w-7xl transform transition-all">
									<img src={`${src}@2x.webp`} alt={alt} className="w-full" />
									<p className="pt-4 font-display text-lg font-bold text-white">
										{alt}
									</p>
									<button
										className="absolute bottom-full right-0 z-10 p-2 hover:bg-white/25"
										onClick={() => setIsOpen(false)}
									>
										<XMarkIcon className="h-7 w-7 text-white" />
									</button>
								</Dialog.Panel>
							</Transition.Child>
						</div>
					</div>
				</Dialog>
			</Transition>
		</>
	) : (
		<Base {...props} src={src} alt={alt} width={width} />
	)
}
