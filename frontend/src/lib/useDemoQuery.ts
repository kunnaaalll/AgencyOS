import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { DEMO_MODE } from '../config/demo';

export function useDemoQuery<TQueryFnData, TError = unknown, TData = TQueryFnData>(
  options: UseQueryOptions<TQueryFnData, TError, TData>,
  mockData: any
): UseQueryResult<TData, TError> {
  const queryResult = useQuery(options);

  if (DEMO_MODE) {
    return {
      ...queryResult,
      data: mockData as unknown as TData,
      isLoading: false,
      isFetching: false,
      isPending: false,
      isSuccess: true,
      error: null,
      refetch: async () => ({} as any),
    } as UseQueryResult<TData, TError>;
  }

  return queryResult;
}
