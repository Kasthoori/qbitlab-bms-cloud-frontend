import { useEffect, useRef, useState } from "react";
import { keycloak } from "@/keycloak";

type UseProtectedImageUrlResult = {
  resolvedImageUrl: string | null;
  imageLoadError: string | null;
  imageLoading: boolean;
};

export function useProtectedImageUrl(imageUrl: string): UseProtectedImageUrlResult {
  const [resolvedImageUrl, setResolvedImageUrl] = useState<string | null>(null);
  const [imageLoadError, setImageLoadError] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  const activeObjectUrlRef = useRef<string | null>(null);
  const lastRequestedUrlRef = useRef<string | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const requestId = ++requestIdRef.current;

    async function loadProtectedImage() {
      if (!imageUrl) {
        lastRequestedUrlRef.current = null;
        setImageLoadError(null);
        setImageLoading(false);

        if (activeObjectUrlRef.current) {
          URL.revokeObjectURL(activeObjectUrlRef.current);
          activeObjectUrlRef.current = null;
        }

        setResolvedImageUrl(null);
        return;
      }

      if (lastRequestedUrlRef.current === imageUrl && activeObjectUrlRef.current) {
        return;
      }

      setImageLoadError(null);
      setImageLoading(true);

      try {
        if (!keycloak) {
          throw new Error("Keycloak is not available.");
        }

        await keycloak.updateToken(30);

        if (!keycloak.token) {
          throw new Error("No Keycloak access token available.");
        }

        const res = await fetch(imageUrl, {
          headers: {
            Authorization: `Bearer ${keycloak.token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Failed to load floor plan (${res.status})`);
        }

        const blob = await res.blob();

        if (!blob || blob.size === 0) {
          throw new Error("Floor plan file is empty.");
        }

        const newObjectUrl = URL.createObjectURL(blob);

        if (cancelled || requestId !== requestIdRef.current) {
          URL.revokeObjectURL(newObjectUrl);
          return;
        }

        if (activeObjectUrlRef.current) {
          URL.revokeObjectURL(activeObjectUrlRef.current);
        }

        activeObjectUrlRef.current = newObjectUrl;
        lastRequestedUrlRef.current = imageUrl;
        setResolvedImageUrl(newObjectUrl);
        setImageLoadError(null);
      } catch (err) {
        if (cancelled || requestId !== requestIdRef.current) return;

        setImageLoadError(
          err instanceof Error ? err.message : "Failed to load floor plan"
        );
      } finally {
        if (!cancelled && requestId === requestIdRef.current) {
          setImageLoading(false);
        }
      }
    }

    loadProtectedImage();

    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  useEffect(() => {
    return () => {
      if (activeObjectUrlRef.current) {
        URL.revokeObjectURL(activeObjectUrlRef.current);
        activeObjectUrlRef.current = null;
      }
    };
  }, []);

  return {
    resolvedImageUrl,
    imageLoadError,
    imageLoading,
  };
}