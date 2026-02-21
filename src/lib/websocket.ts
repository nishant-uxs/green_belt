import { ContractEvent } from "./contract";

export interface WebSocketMessage {
  type: 'event' | 'error' | 'connected' | 'disconnected';
  data?: any;
  error?: string;
}

export class StellarWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private eventCallback: ((events: ContractEvent[]) => void) | null = null;
  private statusCallback: ((status: 'connecting' | 'connected' | 'disconnected' | 'error') => void) | null = null;

  constructor(
    private rpcUrl: string,
    private contractId: string
  ) {}

  onEvents(callback: (events: ContractEvent[]) => void) {
    this.eventCallback = callback;
  }

  onStatus(callback: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void) {
    this.statusCallback = callback;
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.statusCallback?.('connecting');

    try {
      // Create WebSocket connection (using Stellar RPC WebSocket endpoint)
      const wsUrl = this.rpcUrl.replace('https://', 'wss://').replace('http://', 'ws://') + '/stream';
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.statusCallback?.('connected');
        this.subscribeToEvents();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.statusCallback?.('disconnected');
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.statusCallback?.('error');
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.statusCallback?.('error');
      this.attemptReconnect();
    }
  }

  private subscribeToEvents() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    // Subscribe to contract events
    const subscription = {
      jsonrpc: "2.0",
      id: 1,
      method: "subscribe",
      params: {
        events: [
          {
            type: "contract",
            contractIds: [this.contractId],
          }
        ]
      }
    };

    this.ws.send(JSON.stringify(subscription));
  }

  private handleMessage(message: WebSocketMessage) {
    switch (message.type) {
      case 'event':
        if (message.data && this.eventCallback) {
          const events = this.parseContractEvents(message.data);
          this.eventCallback(events);
        }
        break;
      case 'error':
        console.error('WebSocket error:', message.error);
        break;
      case 'connected':
        console.log('WebSocket subscription confirmed');
        break;
      case 'disconnected':
        console.log('WebSocket subscription ended');
        break;
    }
  }

  private parseContractEvents(data: any): ContractEvent[] {
    // Parse Stellar event data and convert to ContractEvent format
    if (data.events && Array.isArray(data.events)) {
      return data.events.map((event: any) => ({
        type: event.topic?.[0] || 'unknown',
        data: event.value || {},
        timestamp: Date.now(),
        ledger: event.ledger || 0,
      }));
    }
    return [];
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
      this.statusCallback?.('error');
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.reconnectAttempts = 0;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getConnectionStatus(): 'connecting' | 'connected' | 'disconnected' | 'error' {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
      case WebSocket.CLOSED:
        return 'disconnected';
      default:
        return 'disconnected';
    }
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
