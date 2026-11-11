import { useEffect, useMemo } from "react";

/**
 * Browsers block opening data: URLs in a new tab, so turn a stored proof (data URL)
 * into a temporary blob: URL that a normal link can open.
 */
export function useProofUrl(document?: string): string | undefined {
  const url = useMemo(() => {
    if (!document || !document.startsWith("data:")) return document;
    try {
      const [head, body] = document.split(",", 2);
      const mime = head.slice(5).split(";")[0] || "application/octet-stream";
      const isBase64 = head.includes(";base64");
      const raw = isBase64 ? atob(body) : decodeURIComponent(body);
      const bytes = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
      return URL.createObjectURL(new Blob([bytes], { type: mime }));
    } catch {
      return undefined;
    }
  }, [document]);
  useEffect(() => () => { if (url?.startsWith("blob:")) URL.revokeObjectURL(url); }, [url]);
  return url;
}
