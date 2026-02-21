"use client";

import { useEffect, useState } from "react";
import { ContractEvent, startEventPolling, getContractEvents } from "@/lib/contract";
import { getWebSocketInstance, closeWebSocketInstance } from "@/lib/websocket";
import { Activity, Zap, Wifi, WifiOff } from "lucide-react";
import { SOROBAN_RPC_URL, CONTRACT_ID } from "@/lib/constants";

export default function EventFeed() {
  const [events, setEvents] = useState<ContractEvent[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [useWebSocket, setUseWebSocket] = useState(true);

  useEffect(() => {
    if (useWebSocket) {
      // Use WebSocket for real-time events
      const ws = getWebSocketInstance(SOROBAN_RPC_URL, CONTRACT_ID);
      
      ws.onEvents((newEvents) => {
        setEvents((prev) => [...newEvents, ...prev].slice(0, 50));
      });

      ws.onStatus((status) => {
        setConnectionStatus(status);
      });

      ws.connect();

      // Load initial events
      getContractEvents().then(setEvents).catch(console.error);

      return () => {
        ws.disconnect();
      };
    } else {
      // Fallback to polling
      const stop = startEventPolling((newEvents) => {
        setEvents((prev) => [...newEvents, ...prev].slice(0, 50));
      }, 6000);

      return () => {
        stop();
      };
    }
  }, [useWebSocket]);

  return (
    <div className="glass p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Activity className="w-4 h-4 text-stellar-400" />
          Live Events
        </h3>
        <div className="flex items-center gap-1.5">
          {useWebSocket ? (
            <>
              {connectionStatus === 'connected' ? (
                <Wifi className="w-3 h-3 text-green-400" />
              ) : connectionStatus === 'connecting' ? (
                <Wifi className="w-3 h-3 text-yellow-400 animate-pulse" />
              ) : (
                <WifiOff className="w-3 h-3 text-red-400" />
              )}
              <span className="text-xs text-gray-400 capitalize">
                {connectionStatus === 'connected' ? 'WebSocket Live' : 
                 connectionStatus === 'connecting' ? 'Connecting...' : 
                 connectionStatus === 'error' ? 'Error' : 'Disconnected'}
              </span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-gray-400">Polling</span>
            </>
          )}
        </div>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {events.length === 0 ? (
          <div className="text-center py-6 text-gray-500 text-sm">
            <Zap className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>Waiting for contract events...</p>
            <p className="text-xs mt-1">
              Events will appear here in real-time
            </p>
          </div>
        ) : (
          events.map((event, i) => (
            <div
              key={`${event.ledger}-${i}`}
              className="p-2 rounded-lg bg-white/5 text-xs space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-stellar-300">
                  {event.type}
                </span>
                <span className="text-gray-500">
                  Ledger #{event.ledger}
                </span>
              </div>
              <p className="text-gray-400 truncate">
                {JSON.stringify(event.data, (_, v) =>
                  typeof v === "bigint" ? v.toString() : v
                )}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
