import type { ComponentPropsWithoutRef } from 'react'

export default function Table({
	columns,
	rows,
	footnotes,
	...props
}: ComponentPropsWithoutRef<'table'> & {
	columns: string[]
	rows: string[][]
	footnotes: string[]
}) {
	return (
		<>
			<table {...props}>
				<thead>
					<tr>
						{columns.map((column, i) => (
							<th key={i}>{column}</th>
						))}
					</tr>
				</thead>
				<tbody>
					{rows.map((row, i) => (
						<tr key={i}>
							{row.map((cell, j) => (
								<td key={j}>{cell}</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
			{footnotes.length > 0 && (
				<ol className="mt-2 list-none !pl-0 text-sm">
					{footnotes.map((footnote, i) => (
						<li key={i} className="flex gap-1">
							<sup>{i + 1}</sup>
							<span className="italic">{footnote}</span>
						</li>
					))}
				</ol>
			)}
		</>
	)
}
