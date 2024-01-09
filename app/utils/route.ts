import type { UIMatch } from '@remix-run/react'
import { useRouteLoaderData } from '@remix-run/react'
import type {
	SerializeFrom,
	ServerRuntimeMetaArgs,
} from '@remix-run/server-runtime'
import { invariant } from './tinier-invariant.ts'

interface RouteExports {
	handle?: object
	loader?: Function
}

export type RouteID<TExports extends RouteExports> = string & TExports

export type AnyRouteID = RouteID<RouteExports>

type RouteIDMatch<TRouteID extends AnyRouteID> = Omit<
	UIMatch,
	'data' | 'handle'
> & {
	data: SerializeFrom<TRouteID['loader']>
	handle: TRouteID['handle']
}

export function matchHasId<TRouteID extends AnyRouteID>(routeId: TRouteID) {
	return (match: UIMatch): match is RouteIDMatch<TRouteID> =>
		match.id === routeId
}

export function findMatchOptional<TRouteID extends AnyRouteID>(
	matches: UIMatch[],
	routeId: TRouteID,
) {
	return matches.find(matchHasId(routeId))
}

export function findMatch<TRouteID extends AnyRouteID>(
	matches: UIMatch[],
	routeId: TRouteID,
) {
	const match = findMatchOptional(matches, routeId)
	invariant(match, `Unable to find route match with ID: ${routeId}`)
	return match
}

export function useRouteIdLoaderDataOptional<TRouteID extends AnyRouteID>(
	routeId: TRouteID,
) {
	return useRouteLoaderData<TRouteID['loader']>(routeId) as
		| SerializeFrom<TRouteID['loader']>
		| undefined
}

/**
 * @param routeId - Typed route ID
 * @param error - Error to throw if route loader data not found (useful for
 * error boundaries)
 */
export function useRouteIdLoaderData<TRouteID extends AnyRouteID>(
	routeId: TRouteID,
	error?: unknown,
) {
	const data = useRouteIdLoaderDataOptional(routeId)
	if (data === undefined) {
		throw (
			error ?? new Error(`Unable to get loader data for route ID: ${routeId}`)
		)
	}
	return data
}

export function findMetaMatchOptional<TRouteID extends AnyRouteID>(
	matches: ServerRuntimeMetaArgs['matches'],
	routeId: TRouteID,
): RouteIDMatch<TRouteID> | undefined {
	const match = matches.find(match => match.id === routeId)
	if (match) return match as RouteIDMatch<TRouteID>
	return undefined
}
