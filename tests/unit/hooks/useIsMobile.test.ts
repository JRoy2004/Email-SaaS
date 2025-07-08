/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react-hooks";
import useIsMobile from "@/app/mail/hooks/useIsMobile"; // adjust path if needed

describe("useIsMobile", () => {
  const originalInnerWidth = window.innerWidth;

  beforeEach(() => {
    // Set initial screen width
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  afterEach(() => {
    // Restore original width after each test
    window.innerWidth = originalInnerWidth;
  });

  it("returns false if window width is above breakpoint", () => {
    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);
  });

  it("returns true if window width is below breakpoint", () => {
    window.innerWidth = 600;
    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(true);
  });

  it("updates value on window resize", () => {
    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);

    act(() => {
      window.innerWidth = 500;
      window.dispatchEvent(new Event("resize"));
    });

    expect(result.current).toBe(true);
  });

  it("uses custom breakpoint if provided", () => {
    window.innerWidth = 800;
    const { result } = renderHook(() => useIsMobile(900));

    expect(result.current).toBe(true);
  });
});
