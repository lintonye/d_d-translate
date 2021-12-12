function translatePage() {
  // let menubar = document.createElement("div");
  // menubar.appendChild(document.createTextNode("Menu"));
  // document.body.insertAdjacentElement("afterbegin", menubar);

  function walkDOM(node, parent, callback) {
    callback(node, parent);
    for (let c of node.childNodes) {
      walkDOM(c, node, callback);
    }
  }

  let translated = 0;

  async function translate(url, id, lang, text) {
    // console.log({ translated });
    if (translated > 30) {
      return text;
    }
    translated++;

    const response = await fetch(
      "http://localhost:3001/api/translate", //"https://d-d-translate.vercel.app/api/translate",
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

  let url = window.location.toString();

  walkDOM(document.body, null, async (node, parent) => {
    // console.log({ translated });
    if (node.nodeType === Node.TEXT_NODE) {
      let text = node.textContent;
      if (text.trim().length > 2) {
        let hashBuffer = await crypto.subtle.digest(
          "SHA-256",
          new TextEncoder().encode(text)
        );
        let id = Array.from(new Uint8Array(hashBuffer))
          .map((b) => b.toString(16))
          .join("");
        node.textContent = await translate(url, id, "ZH", text);
        if (!parent.id) parent.id = id;
      }
    }
  });
}

chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: translatePage,
  });
});
