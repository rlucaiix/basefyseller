import { renderHook, act } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useDebounced } from "./use-debounced";

afterEach(() => vi.useRealTimers());
it("saves the latest edit when leaving before the save delay", () => {
  vi.useFakeTimers();
  const save = vi.fn();
  const hook = renderHook(({ value }) => useDebounced(() => save(value), [value]), { initialProps: { value: "initial" } });
  hook.rerender({ value: "latest" });
  hook.unmount();
  expect(save).toHaveBeenCalledExactlyOnceWith("latest");
  act(() => vi.runAllTimers());
  expect(save).toHaveBeenCalledTimes(1);
});
it("does not rewrite an untouched field or duplicate an already saved edit", () => {
  vi.useFakeTimers();
  const save = vi.fn();
  const hook = renderHook(({ value }) => useDebounced(() => save(value), [value]), { initialProps: { value: "initial" } });
  expect(save).not.toHaveBeenCalled();
  hook.rerender({ value: "edited" });
  act(() => vi.advanceTimersByTime(700));
  hook.unmount();
  expect(save).toHaveBeenCalledExactlyOnceWith("edited");
});