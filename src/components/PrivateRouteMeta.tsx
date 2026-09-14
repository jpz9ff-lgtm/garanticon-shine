import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { enforceConsent, isExcludedPath } from "@/lib/consent";

/**
 * Marca las rutas privadas como no indexables y vuelve a aplicar el bloqueo de
 * medición en cada navegación interna. La etiqueta no sustituye a la autorización.
 */
export const PrivateRouteMeta = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    enforceConsent();

    const id = "robots-meta";
    let tag = document.head.querySelector<HTMLMetaElement>(`meta#${id}`);
    if (isExcludedPath(pathname)) {
      if (!tag) {
        tag = document.createElement("meta");
        tag.id = id;
        tag.name = "robots";
        document.head.appendChild(tag);
      }
      tag.content = "noindex, nofollow";
    } else if (tag) {
      tag.remove();
    }
  }, [pathname]);

  return null;
};
