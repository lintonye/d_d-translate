import { useEffect, useState } from "react";
import { useLockedElements, useTranslate } from "./useTranslate";
import { useUrl } from "./useUrl";

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
        boxShadow: "0 0 0 1px rgba(0,0,0,.1), 0 2px 3px rgba(0,0,0,.2)",
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
      <button>Save</button>
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
        <button
          onClick={() => {
            setInEditMode(true);
            typeof onEdit === "function" && onEdit();
          }}
        >
          Edit
        </button>
      )}
      {inEditMode && (
        <>
          <Editor
            elementId={id}
            onSave={(newText) => {
              setInEditMode(false);
              setEditButtonVisible(false);
              typeof onSave === "function" && onSave(newText);
              typeof onClose === "function" && onClose();
            }}
          />
          <button
            onClick={() => {
              setInEditMode(false);
              typeof onClose === "function" && onClose();
            }}
          >
            Cancel
          </button>
        </>
      )}
    </div>
  ) : null;
}

export default function TranslateOverlay() {
  let { elementIds, saveTranslation } = useTranslate();
  let { lockedElementIds, lock, unlock } = useLockedElements();
  let url = useUrl();
  return (
    <div style={{ height: "100%" }}>
      <div
        style={{
          background: "#000",
          color: "#fff",
          padding: 5,
          fontSize: 10,
        }}
      >
        D_D Translate
      </div>
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
