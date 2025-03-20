/** ChatMessageContent */
export interface ChatMessageContent {
  /**
   * Role
   * Role
   */
  role: string;
  /**
   * Content
   * Content
   */
  content: string;
  /**
   * Timestamp
   * Timestamp
   */
  timestamp?: string | null;
}

/** ChatRequest */
export interface ChatRequest {
  /**
   * Messages
   * Messages
   */
  messages: ChatMessageContent[];
  /**
   * Stream
   * Whether to stream the response
   * @default false
   */
  stream?: boolean | null;
}

/** ConversationHistoryResponse */
export interface ConversationHistoryResponse {
  /** History */
  history: ChatMessageContent[];
}

/** HTTPValidationError */
export interface HTTPValidationError {
  /** Detail */
  detail?: ValidationError[];
}

/** LoginRequest */
export interface LoginRequest {
  /** Password */
  password: string;
}

/** LoginResponse */
export interface LoginResponse {
  /** Access Token */
  access_token: string;
  /**
   * Token Type
   * @default "bearer"
   */
  token_type?: string;
  /** Expires At */
  expires_at: number;
}

/** ValidationError */
export interface ValidationError {
  /** Location */
  loc: (string | number)[];
  /** Message */
  msg: string;
  /** Error Type */
  type: string;
}

/** HealthResponse */
export interface AppApisHealthHealthResponse {
  /** Status */
  status: string;
  /** Version */
  version: string;
}

/** HealthResponse */
export interface DatabuttonAppMainHealthResponse {
  /** Status */
  status: string;
}

export type CheckHealthData = DatabuttonAppMainHealthResponse;

export type CheckHealthResult = AppApisHealthHealthResponse;

export type LoginData = LoginResponse;

export type LoginError = HTTPValidationError;

export type GetPasswordHintData = any;

export type VerifyTokenData = any;

/** Response Chat With Bruce */
export type ChatWithBruceData = object;

export type ChatWithBruceError = HTTPValidationError;

export type ChatWithBruceStreamData = any;

export type ChatWithBruceStreamError = HTTPValidationError;

export type GetConversationHistoryEndpointData = ConversationHistoryResponse;

/** Response Add To Conversation History */
export type AddToConversationHistoryData = object;

export type AddToConversationHistoryError = HTTPValidationError;

/** Response Clear Conversation History */
export type ClearConversationHistoryData = object;
