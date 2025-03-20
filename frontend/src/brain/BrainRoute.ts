import {
  AddToConversationHistoryData,
  ChatMessageContent,
  ChatRequest,
  ChatWithBruceData,
  ChatWithBruceStreamData,
  CheckHealthData,
  CheckHealthResult,
  ClearConversationHistoryData,
  GetConversationHistoryEndpointData,
  GetPasswordHintData,
  LoginData,
  LoginRequest,
  VerifyTokenData,
} from "./data-contracts";

export namespace Brain {
  /**
   * @description Check health of application. Returns 200 when OK, 500 when not.
   * @name check_health
   * @summary Check Health
   * @request GET:/_healthz
   */
  export namespace check_health {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckHealthData;
  }

  /**
   * @description Health check endpoint to verify API is running
   * @tags dbtn/module:health
   * @name check_health
   * @summary Check Health
   * @request GET:/routes/health
   */
  export namespace check_health {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckHealthResult;
  }

  /**
   * @description Authenticate user with dynamic password system. Password is 'banana' + year from 42 years ago.
   * @tags dbtn/module:auth
   * @name login
   * @summary Login
   * @request POST:/routes/api/auth/login
   */
  export namespace login {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = LoginRequest;
    export type RequestHeaders = {};
    export type ResponseBody = LoginData;
  }

  /**
   * @description Provides a hint about the password format without revealing it.
   * @tags dbtn/module:auth
   * @name get_password_hint
   * @summary Get Password Hint
   * @request GET:/routes/api/auth/password-hint
   */
  export namespace get_password_hint {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetPasswordHintData;
  }

  /**
   * @description Verify if the provided token is valid
   * @tags dbtn/module:auth
   * @name verify_token
   * @summary Verify Token
   * @request GET:/routes/api/auth/verify-token
   * @secure
   */
  export namespace verify_token {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = VerifyTokenData;
  }

  /**
   * @description Chat with Bruce (non-streaming version)
   * @tags dbtn/module:bruce
   * @name chat_with_bruce
   * @summary Chat With Bruce
   * @request POST:/routes/api/bruce/chat
   */
  export namespace chat_with_bruce {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ChatRequest;
    export type RequestHeaders = {};
    export type ResponseBody = ChatWithBruceData;
  }

  /**
   * @description Chat with Bruce (streaming version)
   * @tags stream, dbtn/module:bruce
   * @name chat_with_bruce_stream
   * @summary Chat With Bruce Stream
   * @request POST:/routes/api/bruce/chat/stream
   */
  export namespace chat_with_bruce_stream {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ChatRequest;
    export type RequestHeaders = {};
    export type ResponseBody = ChatWithBruceStreamData;
  }

  /**
   * @description Get the conversation history
   * @tags dbtn/module:bruce
   * @name get_conversation_history_endpoint
   * @summary Get Conversation History Endpoint
   * @request GET:/routes/api/bruce/history
   */
  export namespace get_conversation_history_endpoint {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetConversationHistoryEndpointData;
  }

  /**
   * @description Add a message to the conversation history
   * @tags dbtn/module:bruce
   * @name add_to_conversation_history
   * @summary Add To Conversation History
   * @request POST:/routes/api/bruce/history/add
   */
  export namespace add_to_conversation_history {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ChatMessageContent;
    export type RequestHeaders = {};
    export type ResponseBody = AddToConversationHistoryData;
  }

  /**
   * @description Clear the conversation history
   * @tags dbtn/module:bruce
   * @name clear_conversation_history
   * @summary Clear Conversation History
   * @request POST:/routes/api/bruce/history/clear
   */
  export namespace clear_conversation_history {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ClearConversationHistoryData;
  }
}
