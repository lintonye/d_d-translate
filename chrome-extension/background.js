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

  async function translate(id, lang, text) {
    const response = await fetch(
      "https://d_d-tranlate.vercel.app/api/translate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, lang, text }),
      }
    );
    const data = await response.json();
    return data.translatedText;
  }

  walkDOM(document.body, async (node, parent) => {
    if (node.nodeType === Node.TEXT_NODE) {
      let text = node.textContent;
      let hashBuffer = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(text)
      );
      let id = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16))
        .join("");
      node.textContent = await translate(id, "zh-HANS", text);
      if (!parent.id) parent.id = id;
    }
  });
}

chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: translatePage,
  });
});
