import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from "@firebase/firestore";
import { DOMElement, useEffect, useState } from "react";
import { db } from "./firebase";
import { useUrl } from "./useUrl";

function walkDOM(
  node: Element,
  parent: Element | null,
  callback: (node: Element, parent: Element | null) => void
) {
  if (!node.classList || !node.classList.contains("translate-overlay")) {
    callback(node, parent);
    for (let c of node.childNodes) {
      walkDOM(c as Element, node, callback); //TODO this casting is wrong
    }
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

function docId(url: string, elementId: string) {
  return `${url.replaceAll("/", "_")}-${elementId}`;
}

function updateElement(element: Element, translatedText: string) {
  element.setAttribute("data-original-text", element.textContent ?? "");
  element.textContent = translatedText;
}

function collectTranslatableElements() {
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
        // Assign the hash of the text as the id of the element
        let id = parent.id;
        if (!id) {
          let hashBuffer = await crypto.subtle.digest(
            "SHA-256",
            textEncoder.encode(text)
          );
          id = Array.from(new Uint8Array(hashBuffer))
            .map((b) => b.toString(16))
            .join("");
          // console.log({ id, elementId: parent.id });
          parent.id = id;
        }
        // parent.setAttribute("data-original-text", text);
      }
    }
  });
  return translatableElements;
}

async function translateAll(url: string, translatableElements: Element[]) {
  // query existing translations under the current url
  let q = query(collection(db, "translations"), where("url", "==", url));
  let docs = await getDocs(q);
  // update DOM as needed
  docs.forEach((doc) => {
    let data = doc.data();
    let element = document.getElementById(data.elementId);
    if (element && data.translatedText) {
      updateElement(element, data.translatedText);
    }
  });
  // create new translations as needed & save new translations to firestore
  let elementToTranslate = translatableElements.filter(
    (e) => !e.getAttribute("data-original-text")
  );
  await Promise.all(
    elementToTranslate.map(async (element) => {
      let text = element.textContent!;
      let translatedText = await translate(url, element.id, "ZH", text);
      updateElement(element, translatedText);
      // save to firestore
      let d = doc(db, "translations", docId(url, element.id));
      console.log({ d });
      await setDoc(d, {
        elementId: element.id,
        url,
        lang: "ZH",
        originalText: text,
        translatedText,
      });
    })
  );
}

function useTranslatedElementIds() {
  let [translatableElements, setTranslatableElements] = useState<string[]>([]);
  let url = useUrl();
  useEffect(() => {
    let translatableElements = collectTranslatableElements();
    let unsub: null | (() => void) = null;
    translateAll(url, translatableElements).then(() => {
      setTranslatableElements(translatableElements.map((e) => e.id));
      // Update DOM when db changes
      unsub = onSnapshot(
        query(collection(db, "translations"), where("url", "==", url)),
        (snapshot) => {
          snapshot.docs.forEach((d) => {
            let data = d.data();
            let element = document.getElementById(data.elementId);
            if (element && data.translatedText) {
              updateElement(element, data.translatedText);
            }
          });
        }
      );
    });
    return () => {
      typeof unsub === "function" && unsub();
    };
  }, [url]);
  return translatableElements;
}

export function useTranslate() {
  let elementIds = useTranslatedElementIds();
  return {
    elementIds,
    saveTranslation: async (
      url: string,
      id: string,
      translatedText: string
    ) => {
      let d = doc(db, "translations", docId(url, id));
      await updateDoc(d, {
        translatedText,
      });
    },
  };
}

export function useLockedElements() {
  let [lockedElementIds, setLockedElementIds] = useState(new Set<string>());
  let url = useUrl();
  useEffect(() => {
    let q = query(collection(db, "lockedElements"), where("url", "==", url));
    let unsub = onSnapshot(q, (snapshot) => {
      let ids = new Set<string>();
      snapshot.docs.forEach((d) => {
        let data = d.data();
        ids.add(data.elementId);
      });
      setLockedElementIds(ids);
    });
    return unsub;
  }, [url]);
  return {
    lock: async (url: string, elementId: string) => {
      let d = doc(db, "lockedElements", docId(url, elementId));
      await setDoc(d, {
        url,
        elementId,
        locked: true,
      });
    },
    unlock: async (url: string, elementId: string) => {
      let d = doc(db, "lockedElements", docId(url, elementId));
      await deleteDoc(d);
    },
    lockedElementIds,
  };
}
