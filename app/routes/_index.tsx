import { Link } from '@remix-run/react'

export default function Index() {
	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="w-full max-w-md rounded-xl border p-8">
				<h1 className="font-display text-2xl font-bold text-primary md:text-3xl">
					Crunchy Documentation
				</h1>
				<ul className="ml-4 mt-6 list-disc">
					<li className="pl-2">
						<Link
							className="underline hover:text-primary"
							to="/documentation/postgres-operator/latest"
						>
							Crunchy Postgres for Kubernetes
						</Link>
					</li>
				</ul>
			</div>
		</div>
	)
}
