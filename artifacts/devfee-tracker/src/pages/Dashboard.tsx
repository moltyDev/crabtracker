import React, { useState } from "react";
import { format } from "date-fns";
import { 
  Activity, 
  Terminal, 
  Settings2, 
  Database, 
  Cpu, 
  Zap, 
  Send, 
  Target, 
  ShieldAlert,
  Search
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTrackerData } from "@/hooks/use-tracker";
import { CyberCard } from "@/components/ui/cyber-card";
import { CyberButton } from "@/components/ui/cyber-button";
import type { GetEventsType } from "@workspace/api-client-react";

// Import the crab logo user uploaded
import logoImg from "@assets/image_1774539769191.png";

export default function Dashboard() {
  const [filter, setFilter] = useState<GetEventsType>('all');
  const [targetWallet, setTargetWallet] = useState("");
  const [targetLabel, setTargetLabel] = useState("");
  
  const { 
    wallet, 
    stats, 
    events, 
    isLoading, 
    isDemoMode,
    setWallet,
    isSettingWallet
  } = useTrackerData(filter);

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetWallet.trim()) return;
    setWallet({ data: { address: targetWallet, label: targetLabel } });
    setTargetWallet("");
    setTargetLabel("");
  };

  return (
    <div className="min-h-screen matrix-bg text-foreground pb-20">
      <div className="scanline" />
      <div className="crt-flicker" />

      {/* HEADER */}
      <header className="border-b border-primary/20 bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-primary box-glow">
              <img src={logoImg} alt="Crab Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-black text-primary tracking-widest text-glow">CRAB_TRACKER</h1>
              <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Terminal className="w-3 h-3" />
                PumpFun Dev Fee Monitor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end">
              <span className="font-mono text-xs text-primary">SYS.STATUS: <span className={isDemoMode ? "text-destructive" : "text-primary text-glow"}>{isDemoMode ? 'OFFLINE (DEMO)' : 'ONLINE'}</span></span>
              <span className="font-mono text-xs text-muted-foreground">UPLINK: ACTIVE</span>
            </div>
            <div className="flex items-center justify-center w-8 h-8 rounded-full border border-primary/30">
              <div className={`w-3 h-3 rounded-full ${isDemoMode ? 'bg-destructive' : 'bg-primary animate-pulse-ring'}`} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8 space-y-6 relative z-10">
        
        {/* TARGET ACQUISITION & STATUS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <CyberCard className="p-6 lg:col-span-1" glow>
            <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
              <Target className="w-5 h-5 text-primary" />
              <h2 className="text-lg text-primary font-bold">TARGET CONFIG</h2>
            </div>

            {wallet.isTracking && !isDemoMode ? (
              <div className="space-y-4">
                <div className="bg-primary/5 border border-primary p-4 rounded-sm">
                  <p className="font-mono text-xs text-primary mb-1 uppercase">Active Target Locked</p>
                  <p className="font-mono text-sm break-all font-bold">{wallet.address}</p>
                  {wallet.label && (
                    <p className="font-display text-xs mt-2 bg-primary text-primary-foreground px-2 py-1 inline-block">
                      ID: {wallet.label}
                    </p>
                  )}
                </div>
                <CyberButton variant="outline" className="w-full" onClick={() => setWallet({ data: { address: '' } })}>
                  RELEASE TARGET
                </CyberButton>
              </div>
            ) : (
              <form onSubmit={handleTrackSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="font-mono text-xs text-muted-foreground block">SOLANA ADDRESS</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <input 
                      type="text" 
                      value={targetWallet}
                      onChange={(e) => setTargetWallet(e.target.value)}
                      placeholder="Enter wallet address..."
                      className="w-full bg-black/50 border border-primary/30 focus:border-primary focus:ring-1 focus:ring-primary/50 text-foreground font-mono text-sm py-2 pl-10 pr-4 outline-none transition-all placeholder:text-muted-foreground/50"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="font-mono text-xs text-muted-foreground block">ALIAS (OPTIONAL)</label>
                  <input 
                    type="text" 
                    value={targetLabel}
                    onChange={(e) => setTargetLabel(e.target.value)}
                    placeholder="e.g. Dev Main"
                    className="w-full bg-black/50 border border-primary/30 focus:border-primary focus:ring-1 focus:ring-primary/50 text-foreground font-mono text-sm py-2 px-4 outline-none transition-all placeholder:text-muted-foreground/50"
                  />
                </div>
                <CyberButton type="submit" className="w-full mt-2" isLoading={isSettingWallet}>
                  INITIALIZE TRACKING
                </CyberButton>
                {isDemoMode && (
                  <p className="text-destructive font-mono text-[10px] text-center uppercase flex items-center justify-center gap-1 mt-2">
                    <ShieldAlert className="w-3 h-3" /> System in demo mode
                  </p>
                )}
              </form>
            )}
          </CyberCard>

          {/* TELEMETRY DATA */}
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            <StatBox 
              title="FEES EXTRACTED" 
              value={`${stats.totalFeesClaimed.toFixed(2)} SOL`}
              icon={<Database className="w-4 h-4 text-primary" />}
              highlight
            />
            <StatBox 
              title="DEX BOOSTS" 
              value={stats.totalDexBoosts.toString()}
              icon={<Zap className="w-4 h-4 text-accent" />}
              variant="accent"
            />
            <StatBox 
              title="BOOST SPEND" 
              value={`${stats.totalBoostSpend.toFixed(2)} SOL`}
              icon={<Activity className="w-4 h-4 text-accent" />}
            />
            <StatBox 
              title="EXTERNAL TRANSFERS" 
              value={stats.totalTransfers.toString()}
              icon={<Send className="w-4 h-4 text-muted-foreground" />}
              variant="muted"
            />
          </div>
        </div>

        {/* EVENT MATRIX */}
        <CyberCard className="min-h-[500px] flex flex-col">
          <div className="p-4 border-b border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-black/40">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-primary animate-pulse" />
              <h2 className="text-lg text-primary font-bold">LIVE EVENT MATRIX</h2>
              {isLoading && <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin ml-2" />}
            </div>

            <div className="flex flex-wrap gap-2">
              {(['all', 'fee_claim', 'dex_boost', 'transfer'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`px-3 py-1 font-mono text-xs uppercase border transition-all ${
                    filter === type 
                      ? 'bg-primary/20 border-primary text-primary text-glow' 
                      : 'bg-transparent border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                  }`}
                >
                  {type.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 p-4 font-mono text-sm overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header */}
              <div className="grid grid-cols-12 gap-4 pb-2 border-b border-border text-muted-foreground text-xs font-bold mb-4 uppercase">
                <div className="col-span-2">TIMESTAMP</div>
                <div className="col-span-2">CLASSIFICATION</div>
                <div className="col-span-2 text-right">VOLUME (SOL)</div>
                <div className="col-span-4 pl-4">TELEMETRY DATA</div>
                <div className="col-span-2 text-right">HASH</div>
              </div>

              {/* Feed */}
              <div className="space-y-1">
                <AnimatePresence initial={false}>
                  {events.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="py-12 text-center text-muted-foreground flex flex-col items-center gap-3"
                    >
                      <Terminal className="w-8 h-8 opacity-50" />
                      <p>NO ANOMALIES DETECTED IN SECTOR</p>
                    </motion.div>
                  ) : (
                    events.map((event, index) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -20, backgroundColor: 'hsl(var(--primary)/0.2)' }}
                        animate={{ opacity: 1, x: 0, backgroundColor: 'transparent' }}
                        transition={{ duration: 0.5, delay: index * 0.05 }}
                        className={`grid grid-cols-12 gap-4 py-3 border-b border-border/50 items-center transition-colors hover:bg-white/5 ${
                          index === 0 ? 'bg-primary/5 border-l-2 border-l-primary pl-2 -ml-[10px]' : ''
                        }`}
                      >
                        <div className="col-span-2 text-muted-foreground text-xs">
                          {format(new Date(event.timestamp), 'HH:mm:ss.SSS')}
                        </div>
                        
                        <div className="col-span-2">
                          <EventBadge type={event.type} />
                        </div>
                        
                        <div className={`col-span-2 text-right font-bold ${
                          event.type === 'fee_claim' ? 'text-primary text-glow' : 
                          event.type === 'dex_boost' ? 'text-accent' : 'text-foreground'
                        }`}>
                          +{event.amount.toFixed(2)}
                        </div>
                        
                        <div className="col-span-4 pl-4 text-foreground/80 truncate pr-4">
                          {event.description}
                        </div>
                        
                        <div className="col-span-2 text-right">
                          <a 
                            href={`https://solscan.io/tx/${event.txHash}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-primary/70 hover:text-primary underline decoration-primary/30 underline-offset-4"
                          >
                            {event.txHash.substring(0, 8)}...
                          </a>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </CyberCard>

      </main>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function StatBox({ 
  title, 
  value, 
  icon, 
  highlight = false,
  variant = 'default' 
}: { 
  title: string, 
  value: string, 
  icon: React.ReactNode, 
  highlight?: boolean,
  variant?: 'default' | 'accent' | 'muted'
}) {
  const vColor = variant === 'accent' ? 'text-accent' : variant === 'muted' ? 'text-muted-foreground' : 'text-primary';
  const vBorder = variant === 'accent' ? 'border-accent/30' : variant === 'muted' ? 'border-border' : 'border-primary/30';
  
  return (
    <div className={`bg-card border ${vBorder} p-5 flex flex-col justify-between relative overflow-hidden group`}>
      {highlight && <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 blur-xl rounded-full" />}
      
      <div className="flex items-center gap-2 mb-4 text-muted-foreground z-10">
        {icon}
        <span className="font-mono text-xs uppercase tracking-wider">{title}</span>
      </div>
      <div className={`font-mono text-3xl font-bold ${vColor} ${highlight ? 'text-glow' : ''} z-10`}>
        {value}
      </div>
      
      <div className={`absolute bottom-0 left-0 h-[2px] bg-${variant === 'default' ? 'primary' : variant} w-0 group-hover:w-full transition-all duration-500`} />
    </div>
  );
}

function EventBadge({ type }: { type: string }) {
  switch (type) {
    case 'fee_claim':
      return <span className="inline-block px-2 py-1 bg-primary/10 border border-primary text-primary text-[10px] uppercase font-bold tracking-widest">FEE_CLAIM</span>;
    case 'dex_boost':
      return <span className="inline-block px-2 py-1 bg-accent/10 border border-accent text-accent text-[10px] uppercase font-bold tracking-widest">DEX_BOOST</span>;
    case 'transfer':
    default:
      return <span className="inline-block px-2 py-1 bg-muted/30 border border-muted-foreground/30 text-muted-foreground text-[10px] uppercase font-bold tracking-widest">TRANSFER</span>;
  }
}
