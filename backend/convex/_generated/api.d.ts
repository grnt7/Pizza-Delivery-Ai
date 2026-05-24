/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin_menu from "../admin/menu.js";
import type * as helpers_authHelpers from "../helpers/authHelpers.js";
import type * as helpers_orderCheckoutPayload from "../helpers/orderCheckoutPayload.js";
import type * as helpers_pricingOrders from "../helpers/pricingOrders.js";
import type * as http from "../http.js";
import type * as menu from "../menu.js";
import type * as orders from "../orders.js";
import type * as storeSettings from "../storeSettings.js";
import type * as stripeCheckout from "../stripeCheckout.js";
import type * as stripeInternal from "../stripeInternal.js";
import type * as stripeRefundActions from "../stripeRefundActions.js";
import type * as stripeWebhook from "../stripeWebhook.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "admin/menu": typeof admin_menu;
  "helpers/authHelpers": typeof helpers_authHelpers;
  "helpers/orderCheckoutPayload": typeof helpers_orderCheckoutPayload;
  "helpers/pricingOrders": typeof helpers_pricingOrders;
  http: typeof http;
  menu: typeof menu;
  orders: typeof orders;
  storeSettings: typeof storeSettings;
  stripeCheckout: typeof stripeCheckout;
  stripeInternal: typeof stripeInternal;
  stripeRefundActions: typeof stripeRefundActions;
  stripeWebhook: typeof stripeWebhook;
  users: typeof users;
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
