import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  useGetTrackedWallet, 
  useGetEvents, 
  useGetStats, 
  useSetTrackedWallet,
  type WalletEvent,
  type GetEventsType
} from "@workspace/api-client-react";

// --- MOCK DATA FALLBACKS ---
const MOCK_STATS = {
  totalFeesClaimed: 142.5,
  totalDexBoosts: 12,
  totalBoostSpend: 6.0,
  totalTransfers: 45,
  lastActivity: new Date().toISOString(),
  walletBalance: 245.1
};

const MOCK_EVENTS: WalletEvent[] = [
  { id: 105, type: 'fee_claim', txHash: '5Kx8YpL9...', amount: 15.5, amountUsd: 2325, description: 'Claimed PumpFun creator fees', category: 'Revenue', timestamp: new Date().toISOString(), walletAddress: 'Dev1...' },
  { id: 104, type: 'dex_boost', txHash: '2AbC9zX1...', amount: 0.5, amountUsd: 75, description: 'Paid DexScreener for token boost', category: 'Marketing', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), walletAddress: 'Dev1...' },
  { id: 103, type: 'transfer', txHash: '8xYt2mN...', amount: 50.0, amountUsd: 7500, description: 'Transfer to external wallet', category: 'Operations', timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), walletAddress: 'Dev1...' },
  { id: 102, type: 'fee_claim', txHash: '1aB2c3d...', amount: 42.1, amountUsd: 6315, description: 'Claimed PumpFun creator fees', category: 'Revenue', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), walletAddress: 'Dev1...' },
  { id: 101, type: 'dex_boost', txHash: '9zYx8wV...', amount: 1.0, amountUsd: 150, description: 'Paid DexScreener for 2x token boost', category: 'Marketing', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), walletAddress: 'Dev1...' },
];

const POLLING_INTERVAL = 10000; // 10 seconds

export function useTrackerData(filterType: GetEventsType = 'all') {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const lastSeenEventIdRef = useRef<number>(0);

  // 1. Get Wallet
  const { 
    data: walletData, 
    isLoading: isLoadingWallet 
  } = useGetTrackedWallet({
    query: { refetchInterval: POLLING_INTERVAL }
  });

  const isTracking = walletData?.isTracking ?? false;
  const isDemoMode = !isTracking; // Use demo data if not tracking anything

  // 2. Get Stats
  const { 
    data: statsData, 
    isLoading: isLoadingStats 
  } = useGetStats({
    query: { 
      refetchInterval: isTracking ? POLLING_INTERVAL : false,
      enabled: isTracking 
    }
  });

  // 3. Get Events
  const { 
    data: eventsData, 
    isLoading: isLoadingEvents 
  } = useGetEvents(
    { limit: 50, type: filterType },
    {
      query: { 
        refetchInterval: isTracking ? POLLING_INTERVAL : false,
        enabled: isTracking
      }
    }
  );

  // Set Tracking Mutation
  const setWalletMutation = useSetTrackedWallet({
    mutation: {
      onSuccess: () => {
        toast({
          title: "SYSTEM OVERRIDE SUCCESS",
          description: "New target locked. Recalibrating sensors...",
          variant: "default",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/tracker/wallet"] });
        queryClient.invalidateQueries({ queryKey: ["/api/tracker/stats"] });
        queryClient.invalidateQueries({ queryKey: ["/api/tracker/events"] });
      },
      onError: (err) => {
        toast({
          title: "TARGET LOCK FAILED",
          description: err instanceof Error ? err.message : "Unknown error",
          variant: "destructive",
        });
      }
    }
  });

  // Detect new events and show toasts
  useEffect(() => {
    if (!eventsData?.events || eventsData.events.length === 0) return;

    const currentLatestId = eventsData.events[0].id;
    
    // Initialize ref on first load without toasting
    if (lastSeenEventIdRef.current === 0) {
      lastSeenEventIdRef.current = currentLatestId;
      return;
    }

    // Find new events
    if (currentLatestId > lastSeenEventIdRef.current) {
      const newEvents = eventsData.events.filter(e => e.id > lastSeenEventIdRef.current);
      
      // Show toasts for specific high-value events
      newEvents.forEach(event => {
        if (event.type === 'fee_claim') {
          toast({
            title: `🚨 REVENUE DETECTED: ${event.amount} SOL`,
            description: "Dev claimed PumpFun fees! Funds diverted to operations.",
            className: "border-primary bg-primary/10 text-primary",
            duration: 8000,
          });
        } else if (event.type === 'dex_boost') {
          toast({
            title: `⚡ MARKETING DEPLOYED: ${event.amount} SOL`,
            description: "Dev purchased DexScreener boost! Visibility increased.",
            className: "border-accent bg-accent/10 text-accent",
            duration: 8000,
          });
        }
      });

      lastSeenEventIdRef.current = currentLatestId;
    }
  }, [eventsData, toast]);

  return {
    wallet: walletData || { address: null, label: null, isTracking: false, lastChecked: null },
    stats: isDemoMode ? MOCK_STATS : (statsData || MOCK_STATS),
    events: isDemoMode ? MOCK_EVENTS.filter(e => filterType === 'all' || e.type === filterType) : (eventsData?.events || []),
    isLoading: isLoadingWallet || (isTracking && (isLoadingStats || isLoadingEvents)),
    isDemoMode,
    setWallet: setWalletMutation.mutate,
    isSettingWallet: setWalletMutation.isPending
  };
}
