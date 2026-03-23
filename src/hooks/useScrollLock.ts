import { useEffect } from "react";

export function useScrollLock() {
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);
}

/** Render inside any inline modal to lock body scroll while it is mounted. */
export function ScrollLock() {
  useScrollLock();
  return null;
}
