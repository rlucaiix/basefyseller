import { expect, it } from "vitest";
import { shouldClearIdentityCache } from "./auth-identity";

it("keeps the first route validation alive during INITIAL_SESSION", () => {
  expect(shouldClearIdentityCache(undefined, "account-a")).toBe(false);
});
it("clears account data on an actual identity change", () => {
  expect(shouldClearIdentityCache("account-a", "account-b")).toBe(true);
});
it("clears account data on sign-out", () => {
  expect(shouldClearIdentityCache("account-a", null)).toBe(true);
});
it("retains the same account cache during token refresh", () => {
  expect(shouldClearIdentityCache("account-a", "account-a")).toBe(false);
});