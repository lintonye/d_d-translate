import { useEffect, useState } from "react";

export function useUrl() {
  // let [url, setUrl] = useState<string | null>(null);
  // useEffect(() => {
  //   setUrl(window.location.href);
  // }, []);
  // return url;
  return window.location.href;
}
