import { ButtonHTMLAttributes, useEffect, useState } from "react";
import { useLockedElements, useTranslate } from "./useTranslate";
import { useUrl } from "./useUrl";
import { getPageData } from "../single-file";
import { uploadToKoii } from "./upload";

function useViewportBoundingBox(id: string): [DOMRect | undefined, number] {
  const [boundingBox, setBoundingBox] = useState<DOMRect>();
  const [stickyTop, setStickyTop] = useState(0);
  useEffect(() => {
    const element = document.getElementById(id);
    function updateBox() {
      const box = element?.getBoundingClientRect();
      if (element && box) {
        setBoundingBox(
          DOMRectReadOnly.fromRect({
            x: box.x, //+ window.scrollX,
            y: box.y, //+ window.scrollY,
            width: box.width,
            height: box.height,
          })
        );
        const style = window.getComputedStyle(element);
        if (style.position === "sticky") {
          // TODO 80=5rem*16 this should be corrected when a proper method for finding topThreshold is found
          setStickyTop(element.offsetTop - 80);
        }
      }
    }
    updateBox();
    if (element) {
      const observer = new ResizeObserver(updateBox);
      observer.observe(element);
      window.addEventListener("scroll", updateBox);
      return () => {
        window.removeEventListener("scroll", updateBox);
        observer.disconnect();
      };
    }
  }, [id]);
  return [boundingBox, stickyTop];
}

function Editor({
  elementId,
  onSave,
}: {
  elementId: string;
  onSave: (newText: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const [originalText, setOriginalText] = useState("");
  useEffect(() => {
    const element = document.getElementById(elementId);
    if (element) {
      setDraft(element.innerHTML);
      setOriginalText(element.getAttribute("data-original-text") || "");
    }
  }, [elementId]);
  return (
    <form
      style={{
        background: "#fff",
        padding: 5,
        minHeight: 100,
        pointerEvents: "all",
      }}
      onSubmit={(e) => {
        e.preventDefault();
        typeof onSave === "function" && onSave(draft);
      }}
    >
      <p>{originalText}</p>
      <textarea
        style={{ minHeight: 100 }}
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
      />
      <Button>Save</Button>
    </form>
  );
}

type EditableElementProps = {
  id: string;
  locked: boolean;
  onSave: (newText: string) => void;
  onEdit: () => void;
  onClose: () => void;
};

function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      style={{ background: "#fff", color: "#000", padding: 5, ...props.style }}
    />
  );
}

function EditableElement({
  id,
  locked,
  onSave,
  onEdit,
  onClose,
}: EditableElementProps) {
  let [editButtonVisible, setEditButtonVisible] = useState(false);
  let [boundingBox] = useViewportBoundingBox(id);
  let [inEditMode, setInEditMode] = useState(false);
  // console.log(boundingBox);
  let visible =
    boundingBox &&
    boundingBox.top + boundingBox.height > 0 &&
    boundingBox.top < window.innerHeight &&
    boundingBox.left + boundingBox.width > 0 &&
    boundingBox.left < window.innerWidth;
  return visible ? (
    <div
      style={{
        width: boundingBox?.width,
        height: boundingBox?.height,
        top: boundingBox?.y,
        left: boundingBox?.x,
        pointerEvents: "auto",
        position: "absolute",
        border: locked && !inEditMode ? "2px solid red" : "0px",
        // background: "rgba(255, 255, 255, 0.5)",
      }}
      onMouseEnter={() => setEditButtonVisible(true)}
      onMouseLeave={() => setEditButtonVisible(false)}
    >
      {editButtonVisible && !inEditMode && !locked && (
        <Button
          onClick={() => {
            setInEditMode(true);
            typeof onEdit === "function" && onEdit();
          }}
        >
          Edit
        </Button>
      )}
      {inEditMode && (
        <div
          style={{
            position: "relative",
            zIndex: 100,
            background: "#fff",
            boxShadow: "0 0 0 1px rgba(0,0,0,.1), 0 2px 3px rgba(0,0,0,.2)",
          }}
        >
          <Editor
            elementId={id}
            onSave={(newText) => {
              setInEditMode(false);
              setEditButtonVisible(false);
              typeof onSave === "function" && onSave(newText);
              typeof onClose === "function" && onClose();
            }}
          />
          <Button
            onClick={() => {
              setInEditMode(false);
              typeof onClose === "function" && onClose();
            }}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  ) : null;
}

function TranslationUI() {
  let { elementIds, saveTranslation } = useTranslate();
  let { lockedElementIds, lock, unlock } = useLockedElements();
  let url = useUrl();

  return (
    <div>
      {" "}
      {elementIds.map((id) => (
        <EditableElement
          id={id}
          key={id}
          locked={lockedElementIds.has(id)}
          onSave={async (newText) => {
            await saveTranslation(url, id, newText);
          }}
          onEdit={() => {
            lock(url, id);
          }}
          onClose={() => {
            unlock(url, id);
          }}
        />
      ))}
    </div>
  );
}

export default function TranslateOverlay() {
  let [translationOn, setTranslationOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const langs = [
    ["Simplified Chinese", "ZH"],
    ["German", "GE"],
    ["Spanish", "ES"],
    ["Korean", "KO"],
  ];
  // function download(filename: string, text: string) {
  //   var element = document.createElement("a");
  //   element.setAttribute(
  //     "href",
  //     "data:text/plain;charset=utf-8," + encodeURIComponent(text)
  //   );
  //   element.setAttribute("download", filename);

  //   element.style.display = "none";
  //   document.body.appendChild(element);

  //   element.click();

  //   document.body.removeChild(element);
  // }
  const onPublish = async () => {
    const pageData = await getPageData({}, null, document, window);
    // console.log("!!!!!!!publish!", { pageData });
    const encoder = new TextEncoder();
    const dataBuff = encoder.encode(pageData.content);
    // download("export.html", pageData.content);
    const extension = window.koiiWallet;
    if (extension) {
      const addressResult = await extension.getAddress();
      let walletAddress;
      if (addressResult.status === 200) {
        walletAddress = addressResult.data;
      } else {
        const result = await extension.connect();
        if (result.status === 200) {
          walletAddress = (await extension.getAddress()).data;
        }
      }
      if (walletAddress) {
        // console.log("!!! address", addressResult.data);
        try {
          setLoading(true);
          const { arTxId, koiiTxId } = await uploadToKoii(
            walletAddress,
            dataBuff
          );
          console.log("Finnie wallet done", { arTxId, koiiTxId });
          alert("Upload successfully!");
        } catch (error) {
          console.error("Upload failed!", error);
          alert("Upload failed");
        } finally {
          setLoading(false);
        }
      }
    } else {
      console.log("window", window);
      alert("Please install Finnie wallet!");
    }
  };
  return (
    <div
      style={{
        height: "100%",
        background: translationOn ? "rgba(100, 200, 100, 0.1)" : "transparent",
      }}
    >
      <div
        style={{
          background: "#000",
          padding: 5,
          fontSize: 14,
          display: "flex",
          alignItems: "center",
          pointerEvents: "auto",
          gap: 16,
        }}
      >
        <div style={{ color: "#fff" }}>D_D Translate</div>
        <select>
          {langs.map((lang) => (
            <option key={lang[1]} value={lang[1]}>
              {lang[0]}
            </option>
          ))}
        </select>
        <label style={{ color: "#fff" }}>
          <input
            type="checkbox"
            checked={translationOn}
            onChange={(e) => setTranslationOn(e.target.checked)}
          />
          Show translations
        </label>
        <div style={{ flex: 1 }} />
        <Button
          onClick={onPublish}
          disabled={loading}
          style={loading ? { color: "#999" } : {}}
        >
          {loading ? "Publishing..." : "Publish"}
        </Button>
      </div>
      {translationOn && <TranslationUI />}
    </div>
  );
}
