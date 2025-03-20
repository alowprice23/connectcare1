import {
  AddToConversationHistoryData,
  AddToConversationHistoryError,
  ChatMessageContent,
  ChatRequest,
  ChatWithBruceData,
  ChatWithBruceError,
  ChatWithBruceStreamData,
  ChatWithBruceStreamError,
  CheckHealthData,
  CheckHealthResult,
  ClearConversationHistoryData,
  GetConversationHistoryEndpointData,
  GetPasswordHintData,
  LoginData,
  LoginError,
  LoginRequest,
  VerifyTokenData,
} from "./data-contracts";
import { ContentType, HttpClient, RequestParams } from "./http-client";

export class Brain<SecurityDataType = unknown> extends HttpClient<SecurityDataType> {
  /**
   * @description Check health of application. Returns 200 when OK, 500 when not.
   *
   * @name check_health
   * @summary Check Health
   * @request GET:/_healthz
   */
  check_health = (params: RequestParams = {}) =>
    this.request<CheckHealthData, any>({
      path: `/_healthz`,
      method: "GET",
      ...params,
    });

  /**
   * @description Health check endpoint to verify API is running
   *
   * @tags dbtn/module:health
   * @name check_health
   * @summary Check Health
   * @request GET:/routes/health
   */
  check_health = (params: RequestParams = {}) =>
    this.request<CheckHealthResult, any>({
      path: `/routes/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Authenticate user with dynamic password system. Password is 'banana' + year from 42 years ago.
   *
   * @tags dbtn/module:auth
   * @name login
   * @summary Login
   * @request POST:/routes/api/auth/login
   */
  login = (data: LoginRequest, params: RequestParams = {}) =>
    this.request<LoginData, LoginError>({
      path: `/routes/api/auth/login`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Provides a hint about the password format without revealing it.
   *
   * @tags dbtn/module:auth
   * @name get_password_hint
   * @summary Get Password Hint
   * @request GET:/routes/api/auth/password-hint
   */
  get_password_hint = (params: RequestParams = {}) =>
    this.request<GetPasswordHintData, any>({
      path: `/routes/api/auth/password-hint`,
      method: "GET",
      ...params,
    });

  /**
   * @description Verify if the provided token is valid
   *
   * @tags dbtn/module:auth
   * @name verify_token
   * @summary Verify Token
   * @request GET:/routes/api/auth/verify-token
   * @secure
   */
  verify_token = (params: RequestParams = {}) =>
    this.request<VerifyTokenData, any>({
      path: `/routes/api/auth/verify-token`,
      method: "GET",
      secure: true,
      ...params,
    });

  /**
   * @description Chat with Bruce (non-streaming version)
   *
   * @tags dbtn/module:bruce
   * @name chat_with_bruce
   * @summary Chat With Bruce
   * @request POST:/routes/api/bruce/chat
   */
  chat_with_bruce = (data: ChatRequest, params: RequestParams = {}) =>
    this.request<ChatWithBruceData, ChatWithBruceError>({
      path: `/routes/api/bruce/chat`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Chat with Bruce (streaming version)
   *
   * @tags stream, dbtn/module:bruce
   * @name chat_with_bruce_stream
   * @summary Chat With Bruce Stream
   * @request POST:/routes/api/bruce/chat/stream
   */
  chat_with_bruce_stream = (data: ChatRequest, params: RequestParams = {}) =>
    this.requestStream<ChatWithBruceStreamData, ChatWithBruceStreamError>({
      path: `/routes/api/bruce/chat/stream`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get the conversation history
   *
   * @tags dbtn/module:bruce
   * @name get_conversation_history_endpoint
   * @summary Get Conversation History Endpoint
   * @request GET:/routes/api/bruce/history
   */
  get_conversation_history_endpoint = (params: RequestParams = {}) =>
    this.request<GetConversationHistoryEndpointData, any>({
      path: `/routes/api/bruce/history`,
      method: "GET",
      ...params,
    });

  /**
   * @description Add a message to the conversation history
   *
   * @tags dbtn/module:bruce
   * @name add_to_conversation_history
   * @summary Add To Conversation History
   * @request POST:/routes/api/bruce/history/add
   */
  add_to_conversation_history = (data: ChatMessageContent, params: RequestParams = {}) =>
    this.request<AddToConversationHistoryData, AddToConversationHistoryError>({
      path: `/routes/api/bruce/history/add`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Clear the conversation history
   *
   * @tags dbtn/module:bruce
   * @name clear_conversation_history
   * @summary Clear Conversation History
   * @request POST:/routes/api/bruce/history/clear
   */
  clear_conversation_history = (params: RequestParams = {}) =>
    this.request<ClearConversationHistoryData, any>({
      path: `/routes/api/bruce/history/clear`,
      method: "POST",
      ...params,
    });
}
