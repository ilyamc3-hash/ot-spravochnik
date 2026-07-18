import { useState } from "react";

const CONTENT_JSON_PATH = "src/data/content.json";

const btnStyle = (variant = "default") => ({
  padding: "8px 14px",
  borderRadius: 8,
  border: variant === "primary" ? "none" : "1px solid #D0D5E0",
  background: variant === "primary" ? "#2563EB" : variant === "danger" ? "#FEF2F2" : "#FFFFFF",
  color: variant === "primary" ? "#FFFFFF" : variant === "danger" ? "#DC2626" : "#0F1117",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
});

const inputStyle = {
  padding: "7px 10px",
  borderRadius: 6,
  border: "1px solid #D0D5E0",
  fontSize: 13,
  width: "100%",
  boxSizing: "border-box",
};

const labelStyle = { fontSize: 11, fontWeight: 700, color: "#4B5468", textTransform: "uppercase", letterSpacing: 0.4, display: "block", marginBottom: 4 };

const cardStyle = { background: "#FFFFFF", border: "1px solid #E8EAF0", borderRadius: 10, padding: 14, marginBottom: 12 };

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <span style={labelStyle}>{label}</span>
      {children}
    </div>
  );
}

// ─── Item editor (single requirement line inside a detail group) ───
function ItemEditor({ item, onChange, onDelete }) {
  return (
    <div style={{ ...cardStyle, marginBottom: 8, background: "#F7F8FA" }}>
      <Field label="Текст пункта">
        <textarea
          value={item.label}
          onChange={e => onChange({ ...item, label: e.target.value })}
          rows={2}
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </Field>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <Field label="Ссылка на пункт СТО (текст)">
            <input value={item.ref} onChange={e => onChange({ ...item, ref: e.target.value })} style={inputStyle} />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Приложение (код, опционально)">
            <input
              value={item.attachment?.code ?? ""}
              onChange={e => {
                const code = e.target.value;
                if (!code) {
                  const { attachment, ...rest } = item;
                  onChange(rest);
                } else {
                  onChange({ ...item, attachment: { code, title: item.attachment?.title ?? "" } });
                }
              }}
              placeholder="напр. К"
              style={inputStyle}
            />
          </Field>
        </div>
      </div>
      {item.attachment && (
        <Field label="Название приложения">
          <input
            value={item.attachment.title}
            onChange={e => onChange({ ...item, attachment: { ...item.attachment, title: e.target.value } })}
            style={inputStyle}
          />
        </Field>
      )}
      <button onClick={onDelete} style={btnStyle("danger")}>Удалить пункт</button>
    </div>
  );
}

// ─── Detail group editor (a stage's list of requirement items) ───
function GroupEditor({ group, onChange, onDelete }) {
  const updateItem = (idx, next) => {
    const items = group.items.slice();
    items[idx] = next;
    onChange({ ...group, items });
  };
  const deleteItem = (idx) => {
    onChange({ ...group, items: group.items.filter((_, i) => i !== idx) });
  };
  const addItem = () => {
    onChange({ ...group, items: [...group.items, { label: "", ref: "" }] });
  };

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <Field label="ID группы (детали этапа)">
            <input value={group.id} onChange={e => onChange({ ...group, id: e.target.value })} style={inputStyle} />
          </Field>
        </div>
        <div style={{ flex: 2 }}>
          <Field label="Название группы">
            <input value={group.label} onChange={e => onChange({ ...group, label: e.target.value })} style={inputStyle} />
          </Field>
        </div>
      </div>

      {group.items.map((item, i) => (
        <ItemEditor key={i} item={item} onChange={next => updateItem(i, next)} onDelete={() => deleteItem(i)} />
      ))}

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={addItem} style={btnStyle()}>+ Пункт</button>
        <button onClick={onDelete} style={btnStyle("danger")}>Удалить группу целиком</button>
      </div>
    </div>
  );
}

// ─── Stage editor (a row in the top-level stage strip) ───
function StageEditor({ stage, onChange, onDelete }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
      <input
        value={stage.label}
        onChange={e => onChange({ ...stage, label: e.target.value })}
        placeholder="Название этапа"
        style={{ ...inputStyle, flex: 2 }}
      />
      <input
        value={stage.groupId}
        onChange={e => onChange({ ...stage, groupId: e.target.value })}
        placeholder="groupId"
        style={{ ...inputStyle, flex: 1 }}
      />
      <input
        type="number"
        value={stage.refs}
        onChange={e => onChange({ ...stage, refs: Number(e.target.value) })}
        placeholder="refs"
        style={{ ...inputStyle, width: 70, flex: "none" }}
      />
      <label style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4, flex: "none", whiteSpace: "nowrap" }}>
        <input
          type="checkbox"
          checked={!!stage.isNested}
          onChange={e => onChange({ ...stage, isNested: e.target.checked })}
        />
        вложенный
      </label>
      <button onClick={onDelete} style={{ ...btnStyle("danger"), padding: "6px 10px" }}>✕</button>
    </div>
  );
}

// ─── Section editor (one whole "раздел": ГОР, ОР, Обучение, РПО, АПК...) ───
function SectionEditor({ section, onChange }) {
  const updateStage = (idx, next) => {
    const stages = section.stages.slice();
    stages[idx] = next;
    onChange({ ...section, stages });
  };
  const deleteStage = (idx) => onChange({ ...section, stages: section.stages.filter((_, i) => i !== idx) });
  const addStage = () => onChange({
    ...section,
    stages: [...section.stages, { id: section.stages.length + 1, label: "Новый этап", groupId: `stage_${Date.now()}`, refs: 0 }],
  });

  const updateGroup = (idx, next) => {
    const detail = section.detail.slice();
    detail[idx] = next;
    onChange({ ...section, detail });
  };
  const deleteGroup = (idx) => onChange({ ...section, detail: section.detail.filter((_, i) => i !== idx) });
  const addGroup = () => onChange({
    ...section,
    detail: [...section.detail, { id: `group_${Date.now()}`, label: "Новая группа", items: [] }],
  });

  return (
    <div>
      <div style={cardStyle}>
        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <Field label="ID раздела">
              <input value={section.id} onChange={e => onChange({ ...section, id: e.target.value })} style={inputStyle} />
            </Field>
          </div>
          <div style={{ flex: 2 }}>
            <Field label="Название раздела">
              <input value={section.title} onChange={e => onChange({ ...section, title: e.target.value })} style={inputStyle} />
            </Field>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          <div style={{ flex: 2 }}>
            <Field label="Номер СТО / регламента (текст)">
              <input value={section.std} onChange={e => onChange({ ...section, std: e.target.value })} style={inputStyle} />
            </Field>
          </div>
          <div style={{ flex: 1 }}>
            <Field label="Цвет (hex)">
              <div style={{ display: "flex", gap: 6 }}>
                <input type="color" value={section.color} onChange={e => onChange({ ...section, color: e.target.value })} style={{ width: 40, height: 32, padding: 0, border: "1px solid #D0D5E0", borderRadius: 6 }} />
                <input value={section.color} onChange={e => onChange({ ...section, color: e.target.value })} style={inputStyle} />
              </div>
            </Field>
          </div>
          <div style={{ flex: 1 }}>
            <Field label="Кол-во пунктов (refs)">
              <input type="number" value={section.refs} onChange={e => onChange({ ...section, refs: Number(e.target.value) })} style={inputStyle} />
            </Field>
          </div>
        </div>
        <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
          <input type="checkbox" checked={!!section.locked} onChange={e => onChange({ ...section, locked: e.target.checked })} />
          Раздел заблокирован (locked) — показывается как «скоро» на главном экране
        </label>
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, margin: "18px 0 8px" }}>Этапы (StageTabStrip)</div>
      <div style={cardStyle}>
        {section.stages.map((stage, i) => (
          <StageEditor key={i} stage={stage} onChange={next => updateStage(i, next)} onDelete={() => deleteStage(i)} />
        ))}
        <button onClick={addStage} style={btnStyle()}>+ Этап</button>
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, margin: "18px 0 8px" }}>Группы требований (detail)</div>
      {section.detail.map((group, i) => (
        <GroupEditor key={i} group={group} onChange={next => updateGroup(i, next)} onDelete={() => deleteGroup(i)} />
      ))}
      <button onClick={addGroup} style={btnStyle()}>+ Группа требований</button>
    </div>
  );
}

// ─── Raw JSON editor, for the parts we don't have a bespoke UI for yet
// (appendixContent, videoChecklist) — still fully editable, just as text. ───
function RawJsonEditor({ label, value, onChange }) {
  const [text, setText] = useState(() => JSON.stringify(value, null, 2));
  const [error, setError] = useState(null);

  const apply = () => {
    try {
      const parsed = JSON.parse(text);
      onChange(parsed);
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div style={cardStyle}>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{label}</div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={14}
        style={{ ...inputStyle, fontFamily: "monospace", fontSize: 12, resize: "vertical" }}
      />
      {error && <div style={{ color: "#DC2626", fontSize: 12, marginTop: 6 }}>Ошибка JSON: {error}</div>}
      <button onClick={apply} style={{ ...btnStyle(), marginTop: 8 }}>Применить изменения</button>
    </div>
  );
}

export default function App() {
  const [supported] = useState(() => typeof window !== "undefined" && "showOpenFilePicker" in window);
  const [fileHandle, setFileHandle] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [data, setData] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState(null);
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [view, setView] = useState("sections"); // "sections" | "appendix" | "video"

  const openFile = async () => {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [{ description: "JSON", accept: { "application/json": [".json"] } }],
      });
      const file = await handle.getFile();
      const text = await file.text();
      const json = JSON.parse(text);
      if (!Array.isArray(json.sections)) {
        setStatus({ type: "error", text: "Файл не похож на content.json — нет массива sections." });
        return;
      }
      setFileHandle(handle);
      setFileName(file.name);
      setData(json);
      setDirty(false);
      setSelectedSectionId(json.sections[0]?.id ?? null);
      setStatus({ type: "info", text: `Открыт файл: ${file.name}` });
    } catch (e) {
      if (e.name !== "AbortError") {
        setStatus({ type: "error", text: `Не удалось открыть файл: ${e.message}` });
      }
    }
  };

  const saveFile = async () => {
    if (!fileHandle || !data) return;
    try {
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(data, null, 2) + "\n");
      await writable.close();
      setDirty(false);
      setStatus({ type: "success", text: "Сохранено на диск." });
    } catch (e) {
      setStatus({ type: "error", text: `Не удалось сохранить: ${e.message}` });
    }
  };

  const updateSection = (id, next) => {
    setData(d => ({ ...d, sections: d.sections.map(s => (s.id === id ? next : s)) }));
    if (next.id !== id) setSelectedSectionId(next.id);
    setDirty(true);
  };

  const addSection = () => {
    const id = `section_${Date.now()}`;
    setData(d => ({
      ...d,
      sections: [...d.sections, { id, title: "Новый раздел", std: "", color: "#2563EB", refs: 0, locked: false, stages: [], detail: [] }],
    }));
    setSelectedSectionId(id);
    setDirty(true);
  };

  const deleteSection = (id) => {
    if (!confirm("Удалить раздел целиком? Это действие нельзя отменить до перезагрузки файла.")) return;
    setData(d => ({ ...d, sections: d.sections.filter(s => s.id !== id) }));
    setDirty(true);
    if (selectedSectionId === id) setSelectedSectionId(null);
  };

  const selectedSection = data?.sections.find(s => s.id === selectedSectionId) ?? null;

  return (
    <div style={{ minHeight: "100vh" }}>
      <div style={{
        position: "sticky", top: 0, zIndex: 10, background: "#FFFFFF", borderBottom: "1px solid #E8EAF0",
        padding: "14px 20px", display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{ fontSize: 16, fontWeight: 800 }}>ОТ Навигатор — Админка</div>
        <div style={{ flex: 1 }} />
        {fileName && <span style={{ fontSize: 12, color: "#4B5468" }}>{fileName}{dirty ? " ·  есть несохранённые изменения" : ""}</span>}
        <button onClick={openFile} style={btnStyle()}>Открыть content.json</button>
        <button onClick={saveFile} disabled={!fileHandle || !dirty} style={{ ...btnStyle("primary"), opacity: !fileHandle || !dirty ? 0.5 : 1, cursor: !fileHandle || !dirty ? "default" : "pointer" }}>
          Сохранить
        </button>
      </div>

      {!supported && (
        <div style={{ margin: 20, padding: "14px 16px", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 10, color: "#991B1B", fontSize: 13.5 }}>
          Этот браузер не поддерживает File System Access API (открытие/сохранение файлов напрямую на диск).
          Открой эту страницу в Chrome или Edge — админка рассчитана только на них и работает локально,
          без сервера сохранения.
        </div>
      )}

      {status && (
        <div style={{
          margin: "12px 20px 0", padding: "10px 14px", borderRadius: 8, fontSize: 13,
          background: status.type === "error" ? "#FEF2F2" : status.type === "success" ? "#F0FDF4" : "#EFF6FF",
          color: status.type === "error" ? "#991B1B" : status.type === "success" ? "#15803D" : "#1E40AF",
          border: `1px solid ${status.type === "error" ? "#FCA5A5" : status.type === "success" ? "#86EFAC" : "#BFDBFE"}`,
        }}>
          {status.text}
        </div>
      )}

      {!data ? (
        <div style={{ padding: "60px 20px", textAlign: "center", color: "#4B5468", fontSize: 14, lineHeight: 1.7 }}>
          Нажми «Открыть content.json» и выбери файл:<br />
          <code style={{ background: "#EEF2FF", padding: "2px 8px", borderRadius: 6 }}>{CONTENT_JSON_PATH}</code><br />
          из корня проекта ot-navigator.
        </div>
      ) : (
        <div style={{ display: "flex", gap: 20, padding: 20, maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ width: 220, flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#4B5468", textTransform: "uppercase", marginBottom: 8 }}>Разделы</div>
            {data.sections.map(s => (
              <div
                key={s.id}
                onClick={() => setView("sections") || setSelectedSectionId(s.id)}
                style={{
                  padding: "9px 10px", borderRadius: 8, marginBottom: 4, cursor: "pointer",
                  background: view === "sections" && selectedSectionId === s.id ? "#EEF2FF" : "transparent",
                  fontSize: 13, display: "flex", alignItems: "center", gap: 8,
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{s.title || s.id}</span>
                <button
                  onClick={e => { e.stopPropagation(); deleteSection(s.id); }}
                  style={{ background: "none", border: "none", color: "#9BA3B4", cursor: "pointer", fontSize: 12 }}
                  title="Удалить раздел"
                >✕</button>
              </div>
            ))}
            <button onClick={addSection} style={{ ...btnStyle(), width: "100%", marginTop: 6 }}>+ Раздел</button>

            <div style={{ fontSize: 11, fontWeight: 700, color: "#4B5468", textTransform: "uppercase", margin: "20px 0 8px" }}>Прочее</div>
            <div
              onClick={() => setView("appendix")}
              style={{ padding: "9px 10px", borderRadius: 8, marginBottom: 4, cursor: "pointer", background: view === "appendix" ? "#EEF2FF" : "transparent", fontSize: 13 }}
            >Приложения (appendixContent)</div>
            <div
              onClick={() => setView("video")}
              style={{ padding: "9px 10px", borderRadius: 8, cursor: "pointer", background: view === "video" ? "#EEF2FF" : "transparent", fontSize: 13 }}
            >Чеклист видеофиксации</div>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {view === "sections" && selectedSection && (
              <SectionEditor
                key={selectedSection.id}
                section={selectedSection}
                onChange={next => updateSection(selectedSection.id, next)}
              />
            )}
            {view === "sections" && !selectedSection && (
              <div style={{ color: "#9BA3B4", fontSize: 13 }}>Выбери раздел слева или создай новый.</div>
            )}
            {view === "appendix" && (
              <RawJsonEditor
                label="appendixContent — тексты приложений (К, Л и т.д.), на которые ссылаются пункты через attachment.code"
                value={data.appendixContent}
                onChange={next => { setData(d => ({ ...d, appendixContent: next })); setDirty(true); }}
              />
            )}
            {view === "video" && (
              <RawJsonEditor
                label="videoChecklist — чеклист видеофиксации РПО"
                value={data.videoChecklist}
                onChange={next => { setData(d => ({ ...d, videoChecklist: next })); setDirty(true); }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
