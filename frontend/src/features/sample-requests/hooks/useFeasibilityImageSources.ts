import { useEffect, useState } from "react";
import { fetchFeasibilityImageObjectUrl } from "@/infrastructure/api";

const isProtectedFeasibilityImage = (url: string) =>
  url.startsWith("/api/v1/feasibility-requests/") && url.includes("/images/");

/** Fetch private image bytes with the session bearer token and release blob URLs on cleanup. */
export function useFeasibilityImageSources(urls: Array<string | undefined>) {
  const requestKey = Array.from(new Set(urls.filter((url): url is string => Boolean(url)))).join("\n");
  const [sources, setSources] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    const objectUrls: string[] = [];
    const requestUrls = requestKey ? requestKey.split("\n") : [];

    setSources({});
    void Promise.all(requestUrls.filter(isProtectedFeasibilityImage).map(async (url) => {
      try {
        const objectUrl = await fetchFeasibilityImageObjectUrl(url);
        if (!active) {
          URL.revokeObjectURL(objectUrl);
          return [url, ""] as const;
        }
        objectUrls.push(objectUrl);
        return [url, objectUrl] as const;
      } catch {
        return [url, ""] as const;
      }
    })).then((loaded) => {
      if (active) setSources(Object.fromEntries(loaded));
    });

    return () => {
      active = false;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [requestKey]);

  return (url?: string) => {
    if (!url) return undefined;
    if (!isProtectedFeasibilityImage(url)) return url;
    return sources[url] || undefined;
  };
}
