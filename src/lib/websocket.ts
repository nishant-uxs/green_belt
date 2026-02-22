import { ContractEvent } from "./contract";

export interface WebSocketMessage {
  type: "event" | "error" | "connected" | "disconnected";
  data?: any;
  error?: string;
}

export class StellarWebSocket {
  private eventCallback: ((events: ContractEvent[]) => void) | null = null;
  private statusCallback: ((status: "connecting" | "connected" | "disconnected" | "error") => void) | null = null;
  private pollingInterval: NodeJS.Timeout | null = null;

  constructor(
    private rpcUrl: string,
    private contractId: string
  ) {}

  onEvents(callback: (events: ContractEvent[]) => void) {
    this.eventCallback = callback;
  }

  onStatus(callback: (status: "connecting" | "connected" | "disconnected" | "error") => void) {
    this.statusCallback = callback;
  }

  connect() {
    console.log("Stellar WebSocket: Using polling fallback (Stellar RPC does not support WebSocket)");
    this.statusCallback?.("connecting");
    
    // Simulate connection delay
    setTimeout(() => {
      this.statusCallback?.("connected");
      this.startPolling();
    }, 1000);
  }

  private startPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    // Poll for events every 5 seconds
    this.pollingInterval = setInterval(() => {
      this.pollForEvents();
    }, 5000);
  }

  private async pollForEvents() {
    try {
      // This would normally fetch events from Stellar RPC
      // For now, we"ll simulate with empty events
      console.log("Polling for contract events...");
      
      // In a real implementation, you would:
      // 1. Call getLedgerEntries or getTransactions
      // 2. Parse events from transaction results
      // 3. Call the event callback with new events
      
    } catch (error) {
      console.error("Error polling for events:", error);
      this.statusCallback?.("error");
    }
  }

  disconnect() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.statusCallback?.("disconnected");
  }

  isConnected(): boolean {
    return this.pollingInterval !== null;
  }

  getConnectionStatus(): "connecting" | "connected" | "disconnected" | "error" {
    return this.pollingInterval ? "connected" : "disconnected";
  }
}

// Singleton instance for the application
let wsInstance: StellarWebSocket | null = null;

export function getWebSocketInstance(rpcUrl: string, contractId: string): StellarWebSocket {
  if (!wsInstance) {
    wsInstance = new StellarWebSocket(rpcUrl, contractId);
  }
  return wsInstance;
}

export function closeWebSocketInstance() {
  if (wsInstance) {
    wsInstance.disconnect();
    wsInstance = null;
  }
}
