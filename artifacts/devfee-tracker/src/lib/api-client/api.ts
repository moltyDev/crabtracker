import { useMutation, useQuery } from "@tanstack/react-query";
import type {
  MutationFunction,
  QueryFunction,
  QueryKey,
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
} from "@tanstack/react-query";

import type {
  EventsResponse,
  GetEventsParams,
  SetWalletRequest,
  TrackedWallet,
  WalletStats,
} from "./api.schemas";

import { customFetch } from "./custom-fetch";
import type { ErrorType, BodyType } from "./custom-fetch";

type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

export const getGetTrackedWalletUrl = () => `/api/tracker/wallet`;

export const getTrackedWallet = async (options?: RequestInit): Promise<TrackedWallet> =>
  customFetch<TrackedWallet>(getGetTrackedWalletUrl(), { ...options, method: "GET" });

export const getGetTrackedWalletQueryKey = () => [`/api/tracker/wallet`] as const;

export const getGetTrackedWalletQueryOptions = <
  TData = Awaited<ReturnType<typeof getTrackedWallet>>,
  TError = ErrorType<unknown>,
>(options?: {
  query?: UseQueryOptions<Awaited<ReturnType<typeof getTrackedWallet>>, TError, TData>;
  request?: SecondParameter<typeof customFetch>;
}) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getGetTrackedWalletQueryKey();
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getTrackedWallet>>> = ({ signal }) =>
    getTrackedWallet({ signal, ...requestOptions });
  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
    Awaited<ReturnType<typeof getTrackedWallet>>, TError, TData
  > & { queryKey: QueryKey };
};

export function useGetTrackedWallet<
  TData = Awaited<ReturnType<typeof getTrackedWallet>>,
  TError = ErrorType<unknown>,
>(options?: {
  query?: UseQueryOptions<Awaited<ReturnType<typeof getTrackedWallet>>, TError, TData>;
  request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getGetTrackedWalletQueryOptions(options);
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & { queryKey: QueryKey };
  return { ...query, queryKey: queryOptions.queryKey };
}

export const getSetTrackedWalletUrl = () => `/api/tracker/wallet`;

export const setTrackedWallet = async (
  setWalletRequest: SetWalletRequest,
  options?: RequestInit,
): Promise<TrackedWallet> =>
  customFetch<TrackedWallet>(getSetTrackedWalletUrl(), {
    ...options,
    method: "POST",
    headers: { "Content-Type": "application/json", ...options?.headers },
    body: JSON.stringify(setWalletRequest),
  });

export const getSetTrackedWalletMutationOptions = <
  TError = ErrorType<unknown>,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof setTrackedWallet>>,
    TError,
    { data: BodyType<SetWalletRequest> },
    TContext
  >;
  request?: SecondParameter<typeof customFetch>;
}): UseMutationOptions<
  Awaited<ReturnType<typeof setTrackedWallet>>,
  TError,
  { data: BodyType<SetWalletRequest> },
  TContext
> => {
  const mutationKey = ["setTrackedWallet"];
  const { mutation: mutationOptions, request: requestOptions } = options
    ? options.mutation && "mutationKey" in options.mutation && options.mutation.mutationKey
      ? options
      : { ...options, mutation: { ...options.mutation, mutationKey } }
    : { mutation: { mutationKey }, request: undefined };

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof setTrackedWallet>>,
    { data: BodyType<SetWalletRequest> }
  > = (props) => {
    const { data } = props ?? {};
    return setTrackedWallet(data, requestOptions);
  };
  return { mutationFn, ...mutationOptions };
};

export const useSetTrackedWallet = <
  TError = ErrorType<unknown>,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof setTrackedWallet>>,
    TError,
    { data: BodyType<SetWalletRequest> },
    TContext
  >;
  request?: SecondParameter<typeof customFetch>;
}): UseMutationResult<
  Awaited<ReturnType<typeof setTrackedWallet>>,
  TError,
  { data: BodyType<SetWalletRequest> },
  TContext
> => useMutation(getSetTrackedWalletMutationOptions(options));

export const getGetEventsUrl = (params?: GetEventsParams) => {
  const normalizedParams = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined) normalizedParams.append(key, value === null ? "null" : value.toString());
  });
  const stringifiedParams = normalizedParams.toString();
  return stringifiedParams.length > 0 ? `/api/tracker/events?${stringifiedParams}` : `/api/tracker/events`;
};

export const getEvents = async (params?: GetEventsParams, options?: RequestInit): Promise<EventsResponse> =>
  customFetch<EventsResponse>(getGetEventsUrl(params), { ...options, method: "GET" });

export const getGetEventsQueryKey = (params?: GetEventsParams) =>
  [`/api/tracker/events`, ...(params ? [params] : [])] as const;

export const getGetEventsQueryOptions = <
  TData = Awaited<ReturnType<typeof getEvents>>,
  TError = ErrorType<unknown>,
>(
  params?: GetEventsParams,
  options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getEvents>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
  }
) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getGetEventsQueryKey(params);
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getEvents>>> = ({ signal }) =>
    getEvents(params, { signal, ...requestOptions });
  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
    Awaited<ReturnType<typeof getEvents>>, TError, TData
  > & { queryKey: QueryKey };
};

export function useGetEvents<
  TData = Awaited<ReturnType<typeof getEvents>>,
  TError = ErrorType<unknown>,
>(
  params?: GetEventsParams,
  options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getEvents>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
  }
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getGetEventsQueryOptions(params, options);
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & { queryKey: QueryKey };
  return { ...query, queryKey: queryOptions.queryKey };
}

export const getGetStatsUrl = () => `/api/tracker/stats`;

export const getStats = async (options?: RequestInit): Promise<WalletStats> =>
  customFetch<WalletStats>(getGetStatsUrl(), { ...options, method: "GET" });

export const getGetStatsQueryKey = () => [`/api/tracker/stats`] as const;

export const getGetStatsQueryOptions = <
  TData = Awaited<ReturnType<typeof getStats>>,
  TError = ErrorType<unknown>,
>(options?: {
  query?: UseQueryOptions<Awaited<ReturnType<typeof getStats>>, TError, TData>;
  request?: SecondParameter<typeof customFetch>;
}) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getGetStatsQueryKey();
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getStats>>> = ({ signal }) =>
    getStats({ signal, ...requestOptions });
  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
    Awaited<ReturnType<typeof getStats>>, TError, TData
  > & { queryKey: QueryKey };
};

export function useGetStats<
  TData = Awaited<ReturnType<typeof getStats>>,
  TError = ErrorType<unknown>,
>(options?: {
  query?: UseQueryOptions<Awaited<ReturnType<typeof getStats>>, TError, TData>;
  request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getGetStatsQueryOptions(options);
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & { queryKey: QueryKey };
  return { ...query, queryKey: queryOptions.queryKey };
}

export type { WalletEvent, WalletStats, TrackedWallet, EventsResponse, GetEventsParams, GetEventsType, SetWalletRequest } from "./api.schemas";
export { GetEventsType, WalletEventType } from "./api.schemas";
