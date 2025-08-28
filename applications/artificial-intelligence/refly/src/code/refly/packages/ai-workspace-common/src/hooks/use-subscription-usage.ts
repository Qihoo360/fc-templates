import { useGetSubscriptionUsage } from '@refly-packages/ai-workspace-common/queries/queries';
import { useUserStoreShallow } from '@refly/stores';
import { subscriptionEnabled } from '@refly/ui-kit';
import { useGetCreditBalance } from '@refly-packages/ai-workspace-common/queries/queries';

export const useSubscriptionUsage = () => {
  const isLogin = useUserStoreShallow((state) => state.isLogin);
  const {
    data: balanceData,
    refetch: refetchBalance,
    isSuccess: isBalanceSuccess,
  } = useGetCreditBalance({
    query: {
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchOnReconnect: true,
      refetchInterval: 15 * 1000, // Refetch every 15 seconds
      staleTime: 15 * 1000,
      gcTime: 15 * 1000,
      enabled: subscriptionEnabled && isLogin,
    },
  });

  const {
    data,
    isLoading: isUsageLoading,
    refetch,
  } = useGetSubscriptionUsage({}, [], {
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchInterval: 15 * 1000, // Refetch every 15 seconds
    staleTime: 15 * 1000,
    gcTime: 15 * 1000,
    enabled: subscriptionEnabled && isLogin,
  });
  const { token, storage, fileParsing } = data?.data ?? {};

  const refetchUsage = () =>
    setTimeout(async () => {
      try {
        await refetch();
      } catch (error) {
        console.error('Failed to refetch usage:', error);
      }
      try {
        await refetchBalance();
      } catch (error) {
        console.error('Failed to refetch balance:', error);
      }
    }, 2000);

  return {
    tokenUsage: token,
    storageUsage: storage,
    fileParsingUsage: fileParsing,
    isUsageLoading,
    refetchUsage,
    creditBalance: balanceData?.data?.creditBalance ?? 0,
    isBalanceSuccess,
  };
};
