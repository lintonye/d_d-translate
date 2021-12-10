function translatePage() {
  // let menubar = document.createElement("div");
  // menubar.appendChild(document.createTextNode("Menu"));
  // document.body.insertAdjacentElement("afterbegin", menubar);

  function walkDOM(node, callback) {
    for (let c of node.childNodes) {
      callback(c, node);
      walkDOM(c, callback);
    }
  }

  async function translate(url, id, lang, text) {
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
  }

  let url = chrome.runtime.getURL("/");

  let translated = 0;

  walkDOM(document.body, async (node, parent) => {
    if (node.nodeType === Node.TEXT_NODE && translated < 10) {
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
        translated++;
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
