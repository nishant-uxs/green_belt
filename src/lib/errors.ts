// Custom error types for Stellar wallet and contract interactions

export class WalletNotFoundError extends Error {
  constructor(walletName: string) {
    super(
      `${walletName} wallet extension not found. Please install it from the official website.`
    );
    this.name = "WalletNotFoundError";
  }
}

export class TransactionRejectedError extends Error {
  constructor() {
    super("Transaction was rejected by the user in their wallet.");
    this.name = "TransactionRejectedError";
  }
}

export class InsufficientBalanceError extends Error {
  public required: string;
  public available: string;

  constructor(required: string, available: string) {
    super(
      `Insufficient balance. Required: ${required} XLM, Available: ${available} XLM`
    );
    this.name = "InsufficientBalanceError";
    this.required = required;
    this.available = available;
  }
}

export class NetworkError extends Error {
  public statusCode?: number;
  
  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = "NetworkError";
    this.statusCode = statusCode;
  }
}

export class ContractError extends Error {
  public contractId?: string;
  
  constructor(message: string, contractId?: string) {
    super(message);
    this.name = "ContractError";
    this.contractId = contractId;
  }
}

export function classifyError(error: unknown): Error {
  const message =
    error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  // Wallet errors
  if (
    lower.includes("not found") ||
    lower.includes("not installed") ||
    lower.includes("no extension") ||
    lower.includes("unable to find")
  ) {
    return new WalletNotFoundError("Wallet");
  }

  // Transaction rejection
  if (
    lower.includes("user declined") ||
    lower.includes("rejected") ||
    lower.includes("cancelled") ||
    lower.includes("denied") ||
    lower.includes("user refused")
  ) {
    return new TransactionRejectedError();
  }

  // Balance errors
  if (
    lower.includes("insufficient") ||
    lower.includes("underfunded") ||
    lower.includes("not enough")
  ) {
    return new InsufficientBalanceError("unknown", "unknown");
  }

  // Network errors
  if (
    lower.includes("network") ||
    lower.includes("timeout") ||
    lower.includes("connection") ||
    lower.includes("fetch failed")
  ) {
    return new NetworkError(message);
  }

  // Contract errors
  if (
    lower.includes("contract") ||
    lower.includes("invoke") ||
    lower.includes("execution failed")
  ) {
    return new ContractError(message);
  }

  return error instanceof Error ? error : new Error(message);
}

// Log errors with context for debugging
export function logError(error: Error, context?: string): void {
  console.error(`[Error${context ? ` - ${context}` : ''}]:`, {
    name: error.name,
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  });
}
