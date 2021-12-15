import { useEffect, useState } from "react";

export function useUrl() {
  let [url, setUrl] = useState<string>("");
  useEffect(() => {
    setUrl(window.location.href);
  }, []);
  return url;
}
