import { APP_BASE_PATH, mode, Mode } from "app";

// API path constants
export const API_PATH = mode === Mode.DEV
  ? "/_projects/51de87ff-d5fb-40cd-9740-f8b8192443ae/dbtn/devx/app/routes"
  : "/_projects/51de87ff-d5fb-40cd-9740-f8b8192443ae/dbtn/prodx/app/routes";

// Auth API paths
export const AUTH_API = {
  LOGIN: `${API_PATH}/api/auth/login`,
  PASSWORD_HINT: `${API_PATH}/api/auth/password-hint`,
};

// Auth constants
export const TOKEN_KEY = "care_connect_token";
export const TOKEN_EXPIRY_KEY = "care_connect_token_expiry";
