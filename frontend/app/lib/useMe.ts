"use client";

import { useEffect, useState } from "react";
import { useApi, type Me } from "./api";

export function useMe() {
  const api = useApi();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const m = await api.me();
        if (active) setMe(m);
      } catch {
        /* unauthenticated or transient — leave me null */
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [api]);

  return { me, loading, isAdmin: me?.role === "admin" };
}
