/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accounts_d from "../accounts/d.js";
import type * as accounts_m from "../accounts/m.js";
import type * as accounts_q from "../accounts/q.js";
import type * as admin_d from "../admin/d.js";
import type * as admin_q from "../admin/q.js";
import type * as contact_wallet_addresses_d from "../contact_wallet_addresses/d.js";
import type * as contacts_d from "../contacts/d.js";
import type * as history_d from "../history/d.js";
import type * as history_m from "../history/m.js";
import type * as history_q from "../history/q.js";
import type * as orders_d from "../orders/d.js";
import type * as orders_m from "../orders/m.js";
import type * as orders_q from "../orders/q.js";
import type * as stakes_d from "../stakes/d.js";
import type * as stakes_q from "../stakes/q.js";
import type * as transactions_d from "../transactions/d.js";
import type * as txns_d from "../txns/d.js";
import type * as txns_m from "../txns/m.js";
import type * as txns_q from "../txns/q.js";
import type * as user_crypto_wallets_d from "../user_crypto_wallets/d.js";
import type * as users_d from "../users/d.js";
import type * as users_m from "../users/m.js";
import type * as users_q from "../users/q.js";
import type * as utils from "../utils.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "accounts/d": typeof accounts_d;
  "accounts/m": typeof accounts_m;
  "accounts/q": typeof accounts_q;
  "admin/d": typeof admin_d;
  "admin/q": typeof admin_q;
  "contact_wallet_addresses/d": typeof contact_wallet_addresses_d;
  "contacts/d": typeof contacts_d;
  "history/d": typeof history_d;
  "history/m": typeof history_m;
  "history/q": typeof history_q;
  "orders/d": typeof orders_d;
  "orders/m": typeof orders_m;
  "orders/q": typeof orders_q;
  "stakes/d": typeof stakes_d;
  "stakes/q": typeof stakes_q;
  "transactions/d": typeof transactions_d;
  "txns/d": typeof txns_d;
  "txns/m": typeof txns_m;
  "txns/q": typeof txns_q;
  "user_crypto_wallets/d": typeof user_crypto_wallets_d;
  "users/d": typeof users_d;
  "users/m": typeof users_m;
  "users/q": typeof users_q;
  utils: typeof utils;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
