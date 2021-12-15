import React from "react";
import ReactDOM from "react-dom";
import TranslateOverlay from "../components/TranslateOverlay";

let translateOverlay = document.createElement("div");
translateOverlay.classList.add("translate-overlay");

document.body.insertBefore(translateOverlay, document.body.firstChild);

ReactDOM.render(<TranslateOverlay />, translateOverlay);
