import { DOMElement, useEffect, useState } from "react";
import { useUrl } from "./useUrl";

function walkDOM(
  node: Element,
  parent: Element | null,
  callback: (node: Element, parent: Element | null) => void
) {
  callback(node, parent);
  for (let c of node.childNodes) {
    walkDOM(c, node, callback);
  }
}

let translated = 0;

async function translate(url: string, id: string, lang: string, text: string) {
  // console.log({ translated });
  if (translated > 30) {
    return text;
  }
  translated++;

  const response = await fetch(
    "http://localhost:3000/api/translate", //"https://d-d-translate.vercel.app/api/translate",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url, id, lang, text }),
    }
  );
  const data = await response.json();
  return data.translatedText;
  // return text;
}

const textEncoder = new TextEncoder();

function useTranslatedElementIds() {
  let [translatableElements, setTranslatableElements] = useState<string[]>([]);
  let url = useUrl();
  useEffect(() => {
    let translatableElements: Element[] = [];
    walkDOM(document.body, null, async (node, parent) => {
      // console.log({ translated });
      if (node.nodeType === Node.TEXT_NODE) {
        let text = node.textContent;
        if (
          !!!parent?.getAttribute("data-original-text") &&
          parent &&
          text &&
          text.trim().length > 2
        ) {
          translatableElements.push(parent);
        }
      }
    });
    async function doTranslate(element: Element) {
      let text = element.textContent;
      if (text) {
        let hashBuffer = await crypto.subtle.digest(
          "SHA-256",
          textEncoder.encode(text)
        );
        let id =
          element.id ||
          Array.from(new Uint8Array(hashBuffer))
            .map((b) => b.toString(16))
            .join("");
        console.log({ id, elementId: element.id });
        element.textContent = await translate(url, id, "ZH", text);
        element.setAttribute("data-original-text", text);
        if (!element.id) element.id = id;
      }
    }
    Promise.all(translatableElements.map(doTranslate)).then(() => {
      setTranslatableElements(translatableElements.map((e) => e.id));
    });
  }, []);
  return translatableElements;
}

export function useTranslate() {
  let elementIds = useTranslatedElementIds();
  return {
    elementIds,
    saveTranslation: (url: string, id: string, translatedText: string) => {},
  };
}
