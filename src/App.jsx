import { useState, useEffect } from "react";
import contentData from "./data/content.json";

const C = {
  bg:      "#F7F8FA",
  white:   "#FFFFFF",
  border:  "#E8EAF0",
  border2: "#D0D5E0",
  text:    "#0F1117",
  text2:   "#4B5468",
  text3:   "#9BA3B4",
  or:      "#E8612A",
  gor:     "#2563EB",
  rv:      "#059669",
  accent:  "#2563EB",
  tag:     "#EEF2FF",
  tagText: "#3B52CC",
  warn:    "#DC2626",
  warnBg:  "#FEF2F2",
};

const { sections, appendixContent, videoChecklist } = contentData;


// Assign a stable id to every requirement item (groupId + index) so favorites/history
// can reference them without duplicating data. Must run BEFORE buildSearchIndex(),
// since that function copies items via spread — uid has to exist on the source object first.
sections.forEach(sec => {
  sec.detail.forEach(group => {
    group.items.forEach((item, i) => {
      item.uid = `${sec.id}:${group.id}:${i}`;
    });
  });
});

function buildSearchIndex() {
  const index = [];
  sections.forEach(sec => {
    if (sec.locked) return;
    sec.detail.forEach(group => {
      group.items.forEach(item => {
        index.push({
          ...item,
          sectionId: sec.id,
          sectionTitle: sec.title,
          sectionColor: sec.color,
          groupId: group.id,
          groupLabel: group.label,
        });
      });
    });
  });
  return index;
}
const searchIndex = buildSearchIndex();


// ─── Shared UI ────────────────────────────────────────────────
function RefTag({ value }) {
  return (
    <span style={{
      display: "inline-block", marginTop: 7,
      fontSize: 11, fontFamily: "monospace", fontWeight: 700,
      color: C.tagText, background: C.tag, padding: "3px 8px", borderRadius: 6,
    }}>{value}</span>
  );
}

// Wraps matching substrings of `query` inside `text` with a highlight mark.
// Case-insensitive, handles multiple occurrences, safe with empty query.
function Highlight({ text, query }) {
  if (!query || query.trim().length < 1) return <>{text}</>;

  const q = query.trim();
  const lowerText = text.toLowerCase();
  const lowerQ = q.toLowerCase();

  if (!lowerText.includes(lowerQ)) return <>{text}</>;

  const parts = [];
  let cursor = 0;
  let idx = lowerText.indexOf(lowerQ, cursor);

  while (idx !== -1) {
    if (idx > cursor) parts.push({ text: text.slice(cursor, idx), match: false });
    parts.push({ text: text.slice(idx, idx + q.length), match: true });
    cursor = idx + q.length;
    idx = lowerText.indexOf(lowerQ, cursor);
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), match: false });

  return (
    <>
      {parts.map((p, i) =>
        p.match ? (
          <mark key={i} style={{
            background: "#FEF08A",
            color: C.text,
            borderRadius: 3,
            padding: "0 1px",
            fontWeight: 700,
          }}>{p.text}</mark>
        ) : (
          <span key={i}>{p.text}</span>
        )
      )}
    </>
  );
}

function Pill({ children, color }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
      color: color, background: color + "18", padding: "3px 9px", borderRadius: 20,
    }}>{children}</span>
  );
}

function StageTabStrip({ stages, color, activeId, onSelect }) {
  return (
    <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", marginLeft: -20, paddingLeft: 20, paddingRight: 20, marginRight: -20 }}>
      <div style={{ display: "flex", gap: 8, paddingBottom: 2, minWidth: "max-content" }}>
        {stages.map((s) => {
          const active = s.groupId === activeId;
          return (
            <button key={s.id} onClick={() => onSelect(s.groupId)} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
              padding: "10px 12px", borderRadius: 14, border: "none",
              background: active ? color : C.white,
              boxShadow: active ? `0 4px 14px ${color}40` : "0 1px 4px rgba(0,0,0,0.06)",
              cursor: "pointer", transition: "all 0.18s", minWidth: 82,
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: 8,
                background: active ? "rgba(255,255,255,0.25)" : color + "15",
                color: active ? C.white : color,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 800,
              }}>{s.id}</div>
              <span style={{ fontSize: 10.5, fontWeight: 600, color: active ? C.white : C.text2, textAlign: "center", lineHeight: 1.25 }}>{s.label}</span>
              <span style={{ fontSize: 9.5, fontFamily: "monospace", fontWeight: 700, color: active ? "rgba(255,255,255,0.75)" : C.text3 }}>{s.refs} пунктов</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Threshold above which we show a "Подробнее" toggle instead of full text
const LONG_TEXT_THRESHOLD = 90;

function ItemCard({ item, idx, color, isFavorite, onToggleFavorite }) {
  const isLong = item.label.length > LONG_TEXT_THRESHOLD;
  const [expanded, setExpanded] = useState(!isLong);
  const [showAttachment, setShowAttachment] = useState(false);

  const shortText = isLong ? item.label.slice(0, LONG_TEXT_THRESHOLD).trim() + "…" : item.label;

  return (
    <div style={{
      background: C.white, borderRadius: 14, border: `1px solid ${C.border}`,
      padding: "14px 16px", display: "flex", gap: 12, alignItems: "flex-start",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)", position: "relative",
    }}>
      <div style={{
        width: 24, height: 24, borderRadius: 7, flexShrink: 0, marginTop: 1,
        background: color + "15", color: color,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 800,
      }}>{idx + 1}</div>

      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14.5, color: C.text, lineHeight: 1.6 }}>
          {expanded ? item.label : shortText}
        </div>

        {isLong && (
          <button
            onClick={() => setExpanded(e => !e)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "5px 0 0", fontSize: 12.5, fontWeight: 600,
              color: color, display: "flex", alignItems: "center", gap: 3,
            }}
          >
            {expanded ? "Свернуть" : "Подробнее"}
            <svg width="8" height="8" viewBox="0 0 10 10" fill="none" style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
              <path d="M2 3.5l3 3 3-3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}

        {item.attachment && (
          <button
            onClick={() => setShowAttachment(true)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              marginTop: 8, padding: "5px 10px", borderRadius: 8,
              border: `1px dashed ${color}60`, background: color + "0A",
              fontSize: 12, fontWeight: 600, color: color, cursor: "pointer",
            }}
          >
            📎 Приложение {item.attachment.code}
          </button>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 2 }}>
          <RefTag value={item.ref} />
          {onToggleFavorite && (
            <button
              onClick={() => onToggleFavorite(item.uid)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 17, padding: "4px 2px 4px 8px", lineHeight: 1,
                color: isFavorite ? "#F59E0B" : C.text3,
              }}
            >
              {isFavorite ? "★" : "☆"}
            </button>
          )}
        </div>
      </div>

      {showAttachment && item.attachment && (() => {
        const content = appendixContent[item.attachment.code];
        return (
          <div
            onClick={() => setShowAttachment(false)}
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
              display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100,
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                background: C.white, borderRadius: "20px 20px 0 0",
                padding: "20px 20px 28px", width: "100%", maxWidth: 480,
                maxHeight: "80vh", overflowY: "auto",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 11, color: C.text3, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6 }}>
                    Приложение {item.attachment.code}{content?.status ? ` · ${content.status}` : ""}
                  </div>
                  <div style={{ fontSize: 15.5, fontWeight: 700, color: C.text, marginTop: 3, lineHeight: 1.3 }}>{item.attachment.title}</div>
                </div>
                <button onClick={() => setShowAttachment(false)} style={{
                  width: 28, height: 28, borderRadius: "50%", border: "none",
                  background: C.bg, color: C.text3, fontSize: 13, cursor: "pointer", flexShrink: 0, marginLeft: 10,
                }}>✕</button>
              </div>

              {!content ? (
                <div style={{
                  marginTop: 14, padding: "16px", background: C.bg, borderRadius: 12,
                  fontSize: 13.5, color: C.text3, lineHeight: 1.6, fontStyle: "italic", textAlign: "center",
                }}>
                  Текст приложения ещё не добавлен в справочник.<br/>Открой оригинал документа для полной формы.
                </div>
              ) : (
                <div style={{ marginTop: 14 }}>
                  {content.intro && (
                    <div style={{ fontSize: 13, color: C.text2, lineHeight: 1.55, marginBottom: 14, fontStyle: "italic" }}>{content.intro}</div>
                  )}

                  {/* Form-field style (Приложение К): numbered fields, some as tables */}
                  {content.sections && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {content.sections.map((s, i) => (
                        <div key={i} style={{
                          display: "flex", gap: 10, padding: "10px 12px",
                          background: C.bg, borderRadius: 10,
                        }}>
                          <span style={{
                            flexShrink: 0, width: 22, height: 22, borderRadius: 6,
                            background: color + "18", color: color,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 11, fontWeight: 800,
                          }}>{s.n}</span>
                          <span style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{s.label}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Clause style (Приложение Л): ref + text */}
                  {content.items && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {content.items.map((it, i) => (
                        <div key={i} style={{ padding: "10px 12px", background: C.bg, borderRadius: 10 }}>
                          <span style={{
                            display: "inline-block", marginBottom: 5,
                            fontSize: 10.5, fontFamily: "monospace", fontWeight: 700,
                            color: color, background: color + "15", padding: "2px 6px", borderRadius: 5,
                          }}>{it.ref}</span>
                          <div style={{ fontSize: 13, color: C.text, lineHeight: 1.55 }}>{it.text}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ─── Detail screen ────────────────────────────────────────────
// ─── Video Recording Checklist Screen ────────────────────────
function VideoChecklistScreen({ sectionColor, onBack }) {
  const [checked, setChecked] = useState(() => new Set());
  const [openGroup, setOpenGroup] = useState(videoChecklist[0].id);

  const totalItems = videoChecklist.reduce((acc, g) => acc + g.items.length, 0);
  const checkedCount = checked.size;
  const progress = Math.round((checkedCount / totalItems) * 100);

  const toggle = (uid) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  };

  const resetAll = () => setChecked(new Set());

  // Build a flat list of unchecked items across all groups, for the summary block
  const unfinished = [];
  videoChecklist.forEach(group => {
    group.items.forEach(item => {
      const uid = `${group.id}:${item.ref}:${item.text}`;
      if (!checked.has(uid)) {
        unfinished.push({ ...item, uid, groupId: group.id, groupLabel: group.label, groupIcon: group.icon });
      }
    });
  });

  const jumpToItem = (groupId) => {
    setOpenGroup(groupId);
    // Scroll the group into view after it renders
    setTimeout(() => {
      const el = document.getElementById(`vc-group-${groupId}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "-apple-system, 'Inter', sans-serif" }}>
      <div style={{
        background: C.white, borderBottom: `1px solid ${C.border}`,
        position: "sticky", top: 0, zIndex: 30, padding: "0 20px",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0 10px" }}>
          <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", fontSize: 15, color: sectionColor, fontWeight: 600, padding: 0 }}>
            <svg width="9" height="16" viewBox="0 0 9 16" fill="none">
              <path d="M7.5 1.5L2 8l5.5 6.5" stroke={sectionColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Назад
          </button>
          {checkedCount > 0 && (
            <button onClick={resetAll} style={{ background: "none", border: "none", color: C.text3, fontSize: 13, cursor: "pointer" }}>
              Сбросить
            </button>
          )}
        </div>

        <div style={{ paddingBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <Pill color={sectionColor}>ВИДЕОФИКСАЦИЯ</Pill>
            <span style={{ fontSize: 12, color: C.text3, fontFamily: "monospace" }}>ПОЛОЖЕНИЕ-04-1963-2025, разд.6</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: -0.5, lineHeight: 1.2 }}>
            Чеклист видеозаписи РПО
          </div>
        </div>

        <div style={{ paddingBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12, color: C.text3 }}>
            <span style={{ fontWeight: 600, color: C.text2 }}>Прогресс инструктажа</span>
            <span style={{ fontFamily: "monospace" }}>{checkedCount}/{totalItems} · {progress}%</span>
          </div>
          <div style={{ height: 6, background: C.border, borderRadius: 3, overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${progress}%`,
              background: progress === 100 ? "#16A34A" : sectionColor,
              borderRadius: 3, transition: "width 0.25s ease",
            }} />
          </div>
          {progress === 100 && (
            <div style={{ marginTop: 8, fontSize: 13, fontWeight: 600, color: "#16A34A", display: "flex", alignItems: "center", gap: 6 }}>
              ✅ Все пункты отмечены — инструктаж полный
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: "16px 20px 110px", display: "flex", flexDirection: "column", gap: 12 }}>
        {videoChecklist.map(group => {
          const isOpen = openGroup === group.id;
          const groupChecked = group.items.filter(it => checked.has(`${group.id}:${it.ref}:${it.text}`)).length;
          return (
            <div key={group.id} id={`vc-group-${group.id}`} style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden" }}>
              <button
                onClick={() => setOpenGroup(isOpen ? null : group.id)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 12,
                  padding: "14px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left",
                }}
              >
                <span style={{ fontSize: 20 }}>{group.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{group.label}</div>
                  <div style={{ fontSize: 11, color: C.text3, fontFamily: "monospace", marginTop: 1 }}>
                    {groupChecked}/{group.items.length} отмечено
                  </div>
                </div>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s", flexShrink: 0 }}>
                  <path d="M2 3.5l3 3 3-3" stroke={C.text3} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {isOpen && (
                <div style={{ padding: "0 16px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                  {group.items.map((item, i) => {
                    const uid = `${group.id}:${item.ref}:${item.text}`;
                    const isChecked = checked.has(uid);
                    return (
                      <div
                        key={i}
                        onClick={() => toggle(uid)}
                        style={{
                          display: "flex", gap: 10, alignItems: "flex-start",
                          padding: "10px 12px", borderRadius: 12, cursor: "pointer",
                          background: isChecked ? sectionColor + "0D" : C.bg,
                          border: `1.5px solid ${isChecked ? sectionColor + "40" : C.border}`,
                          transition: "all 0.15s",
                        }}
                      >
                        <div style={{
                          width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1,
                          border: `2px solid ${isChecked ? sectionColor : C.border2}`,
                          background: isChecked ? sectionColor : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "all 0.15s",
                        }}>
                          {isChecked && (
                            <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                              <path d="M1 4.5L4 7.5L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: 14, color: isChecked ? C.text2 : C.text, lineHeight: 1.5,
                            textDecoration: isChecked ? "line-through" : "none",
                          }}>{item.text}</div>
                          {item.script && (
                            <div style={{
                              marginTop: 6, fontSize: 12.5, color: C.text2, fontStyle: "italic",
                              background: C.white, borderRadius: 8, padding: "7px 10px",
                              border: `1px dashed ${C.border2}`, lineHeight: 1.5,
                            }}>{item.script}</div>
                          )}
                          <RefTag value={item.ref} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* ── Summary: unfinished items ── */}
        <div style={{ marginTop: 8 }}>
          {progress === 100 ? (
            <div style={{
              background: "#F0FDF4", border: "1.5px solid #86EFAC", borderRadius: 16,
              padding: "20px 18px", textAlign: "center",
            }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>✅</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#15803D" }}>Всё отмечено</div>
              <div style={{ fontSize: 12.5, color: "#16A34A", marginTop: 3 }}>Все {totalItems} пунктов чеклиста выполнены</div>
            </div>
          ) : (
            <div style={{ background: C.white, borderRadius: 16, border: `1.5px solid #FCA5A5`, overflow: "hidden" }}>
              <div style={{
                padding: "14px 16px", background: "#FEF2F2",
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <span style={{ fontSize: 18 }}>⚠️</span>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: "#991B1B" }}>Не отмечено: {unfinished.length}</div>
                  <div style={{ fontSize: 11.5, color: "#B91C1C", marginTop: 1 }}>Нажми на пункт, чтобы перейти к нему</div>
                </div>
              </div>
              <div style={{ padding: "8px 12px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
                {unfinished.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => jumpToItem(item.groupId)}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 9, textAlign: "left",
                      padding: "9px 10px", borderRadius: 10, border: `1px solid ${C.border}`,
                      background: C.bg, cursor: "pointer", width: "100%",
                    }}
                  >
                    <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{item.groupIcon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10.5, color: C.text3, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600, marginBottom: 2 }}>
                        {item.groupLabel}
                      </div>
                      <div style={{ fontSize: 13, color: C.text, lineHeight: 1.45 }}>{item.text}</div>
                    </div>
                    <svg width="7" height="12" viewBox="0 0 7 12" fill="none" style={{ flexShrink: 0, marginTop: 3 }}>
                      <path d="M1.5 1.5l4 4.5-4 4.5" stroke={C.text3} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailScreen({ section, onBack, initialGroupId, favorites, onToggleFavorite }) {
  // initialGroupId may point directly at a top-level stage's groupId, OR at a
  // sub-group id nested inside a stage (e.g. coming from search results for
  // "Целевой инструктаж", whose id is "celevoy" but whose stage groupId is
  // "instructions"). Resolve which case we're in before setting initial state.
  const resolveInitial = () => {
    if (!initialGroupId) {
      return { group: section.detail[0]?.id ?? null, sub: null };
    }
    // Case 1: initialGroupId is a stage's own groupId (non-nested or nested-without-target)
    const directStage = section.stages.find(s => s.groupId === initialGroupId);
    if (directStage) {
      if (directStage.isNested) {
        const subs = section.subGroups?.[initialGroupId] ?? [];
        return { group: initialGroupId, sub: subs[0]?.id ?? null };
      }
      return { group: initialGroupId, sub: null };
    }
    // Case 2: initialGroupId is actually a sub-group id — find its parent nested stage
    for (const stage of section.stages) {
      if (!stage.isNested) continue;
      const subs = section.subGroups?.[stage.groupId] ?? [];
      if (subs.some(s => s.id === initialGroupId)) {
        return { group: stage.groupId, sub: initialGroupId };
      }
    }
    // Fallback: treat it as a flat detail id
    return { group: initialGroupId, sub: null };
  };
  const initialResolved = resolveInitial();

  const [activeGroup, setActiveGroup] = useState(initialResolved.group);
  const [activeSubGroup, setActiveSubGroup] = useState(initialResolved.sub);
  const [searchQ, setSearchQ] = useState("");
  const [searching, setSearching] = useState(false);
  const [showVideoChecklist, setShowVideoChecklist] = useState(false);

  if (showVideoChecklist) {
    return <VideoChecklistScreen sectionColor={section.color} onBack={() => setShowVideoChecklist(false)} />;
  }

  const stageIdx = section.stages.findIndex(s => s.groupId === activeGroup);
  const currentStage = section.stages[stageIdx];
  const prev = section.stages[stageIdx - 1];
  const next = section.stages[stageIdx + 1];

  // Nested stages (e.g. "Инструктажи", "Совмещение профессий") show a list of
  // sub-cards first; the actual requirement list only appears once a sub-card is picked.
  const isNestedStage = !!currentStage?.isNested;
  const subGroupList = isNestedStage ? (section.subGroups?.[currentStage.groupId] ?? []) : [];
  const currentGroup = isNestedStage
    ? section.detail.find(g => g.id === activeSubGroup)
    : section.detail.find(g => g.id === activeGroup);

  const allItems = section.detail.flatMap(g => g.items.map(i => ({ ...i, group: g.label })));
  const searchResults = searchQ.length > 1
    ? allItems.filter(i => i.label.toLowerCase().includes(searchQ.toLowerCase()) || i.ref.toLowerCase().includes(searchQ.toLowerCase()))
    : [];

  const isLongGroup = currentGroup && currentGroup.id === "confined";

  // Switches to a different top-level stage; if it's a nested stage, auto-selects
  // its first sub-card so the person isn't dropped on an empty screen.
  const changeStage = (groupId) => {
    setActiveGroup(groupId);
    const stage = section.stages.find(s => s.groupId === groupId);
    if (stage?.isNested) {
      const subs = section.subGroups?.[groupId] ?? [];
      setActiveSubGroup(subs[0]?.id ?? null);
    } else {
      setActiveSubGroup(null);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "-apple-system, 'Inter', sans-serif" }}>
      <div style={{
        background: C.white, borderBottom: `1px solid ${C.border}`,
        position: "sticky", top: 0, zIndex: 30, padding: "0 20px",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0 10px" }}>
          <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", fontSize: 15, color: section.color, fontWeight: 600, padding: 0 }}>
            <svg width="9" height="16" viewBox="0 0 9 16" fill="none">
              <path d="M7.5 1.5L2 8l5.5 6.5" stroke={section.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Назад
          </button>
          <button onClick={() => { setSearching(s => !s); setSearchQ(""); }} style={{
            width: 34, height: 34, borderRadius: 10,
            background: searching ? section.color : C.bg,
            border: `1px solid ${searching ? section.color : C.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", fontSize: 15, color: searching ? C.white : C.text2,
          }}>{searching ? "✕" : "🔍"}</button>
        </div>

        {searching ? (
          <div style={{ paddingBottom: 12 }}>
            <input
              autoFocus value={searchQ} onChange={e => setSearchQ(e.target.value)}
              placeholder="Требование или пункт СТО..."
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "11px 14px", borderRadius: 12,
                border: `1.5px solid ${searchQ ? section.color : C.border}`,
                fontSize: 15, color: C.text, background: C.bg, outline: "none",
              }}
            />
          </div>
        ) : (
          <>
            <div style={{ paddingBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <Pill color={section.color}>{section.id.toUpperCase()}</Pill>
                <span style={{ fontSize: 12, color: C.text3, fontFamily: "monospace" }}>{section.std}</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: -0.5, lineHeight: 1.2 }}>{section.title}</div>
            </div>
            <div style={{ paddingBottom: 14 }}>
              <StageTabStrip stages={section.stages} color={section.color} activeId={activeGroup} onSelect={changeStage} />
            </div>
          </>
        )}
      </div>

      <div style={{ padding: "20px 20px 110px" }}>
        {searching ? (
          searchQ.length > 1 ? (
            searchResults.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 12, color: C.text3, marginBottom: 4 }}>Найдено: {searchResults.length}</div>
                {searchResults.map((r, i) => (
                  <div key={i} style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, padding: "14px 16px" }}>
                    <div style={{ fontSize: 11, color: C.text3, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, marginBottom: 6 }}>{r.group}</div>
                    <div style={{ fontSize: 14.5, color: C.text, lineHeight: 1.6, marginBottom: 6 }}><Highlight text={r.label} query={searchQ} /></div>
                    <RefTag value={<Highlight text={r.ref} query={searchQ} />} />
                  </div>
                ))}
              </div>
            ) : <div style={{ textAlign: "center", color: C.text3, padding: "60px 0", fontSize: 15 }}>Ничего не найдено</div>
          ) : <div style={{ textAlign: "center", color: C.text3, padding: "60px 0", fontSize: 15 }}>Поиск по {allItems.length} пунктам СТО</div>
        ) : currentGroup ? (
          <>
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12, color: C.text3 }}>
                <span style={{ fontWeight: 600, color: C.text2 }}>
                  {isNestedStage ? `${currentStage.label} · ${currentGroup.label}` : currentGroup.label}
                </span>
                <span style={{ fontFamily: "monospace" }}>{currentStage?.id}/{section.stages.length} · {currentGroup.items.length} пунктов</span>
              </div>
              <div style={{ height: 4, background: C.border, borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${((stageIdx + 1) / section.stages.length) * 100}%`, background: section.color, borderRadius: 2, transition: "width 0.3s ease" }} />
              </div>
            </div>

            {isNestedStage && (
              <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                {subGroupList.map(sub => {
                  const active = sub.id === activeSubGroup;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => setActiveSubGroup(sub.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
                        padding: "8px 12px", borderRadius: 10, border: "none", cursor: "pointer",
                        background: active ? section.color : C.white,
                        boxShadow: active ? `0 3px 10px ${section.color}40` : `0 1px 3px rgba(0,0,0,0.05)`,
                        fontSize: 12.5, fontWeight: 600,
                        color: active ? "#fff" : C.text2,
                      }}
                    >
                      {sub.badgeLetter ? (
                        <span style={{
                          width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                          background: active ? "rgba(255,255,255,0.25)" : sub.badgeColor,
                          color: active ? "#fff" : "#fff",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 11, fontWeight: 800,
                        }}>{sub.badgeLetter}</span>
                      ) : (
                        <span style={{ fontSize: 13 }}>{sub.icon}</span>
                      )}
                      {sub.label}
                    </button>
                  );
                })}
              </div>
            )}

            {isLongGroup && (
              <div style={{
                background: C.warnBg, border: `1px solid #FCA5A5`, borderRadius: 12,
                padding: "10px 14px", marginBottom: 14, display: "flex", gap: 8, alignItems: "flex-start",
              }}>
                <span style={{ fontSize: 14 }}>⚠️</span>
                <span style={{ fontSize: 12.5, color: "#991B1B", lineHeight: 1.5 }}>
                  Самый насыщенный раздел — 11 пунктов с детальными обязанностями. Рекомендуем читать не спеша.
                </span>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {currentGroup.items.map((item, idx) => (
                <ItemCard
                  key={idx} item={item} idx={idx} color={section.color}
                  isFavorite={favorites?.has(item.uid)}
                  onToggleFavorite={onToggleFavorite}
                />
              ))}
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button onClick={() => prev && changeStage(prev.groupId)} disabled={!prev} style={{
                flex: 1, padding: "16px 0", borderRadius: 14,
                border: `1.5px solid ${prev ? C.border2 : C.border}`,
                background: C.white, color: prev ? C.text : C.text3,
                fontSize: 13.5, fontWeight: 600, cursor: prev ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                boxShadow: prev ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
              }}>
                <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                  <path d="M6.5 1L1 7l5.5 6" stroke={prev ? C.text2 : C.text3} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {prev ? prev.label : "Начало"}
              </button>
              <button onClick={() => next && changeStage(next.groupId)} disabled={!next} style={{
                flex: 1.4, padding: "16px 0", borderRadius: 14, border: "none",
                background: next ? section.color : C.border,
                color: next ? C.white : C.text3,
                fontSize: 13.5, fontWeight: 700, cursor: next ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                boxShadow: next ? `0 4px 14px ${section.color}50` : "none",
                transition: "all 0.18s",
              }}>
                {next ? next.label : "Готово"}
                {next && <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M1.5 1L7 7l-5.5 6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </button>
            </div>

            {/* Video checklist entry point — always visible regardless of active stage */}
            <button
              onClick={() => setShowVideoChecklist(true)}
              style={{
                width: "100%", marginTop: 14, padding: "14px 16px", borderRadius: 14,
                border: `1.5px solid ${C.border}`, background: C.white, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 12, textAlign: "left",
              }}
            >
              <div style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: "#1112120D", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
              }}>📹</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Чеклист видеофиксации РПО</div>
                <div style={{ fontSize: 11.5, color: C.text3, marginTop: 1 }}>Что сказать на камеру перед началом работ</div>
              </div>
              <svg width="9" height="15" viewBox="0 0 9 15" fill="none">
                <path d="M1.5 1.5l6 6-6 6" stroke={C.text3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

// ─── Home ─────────────────────────────────────────────────────
function SectionCard({ s, onPress }) {
  const [pressed, setPressed] = useState(false);
  const emojis = { or: "🔥", gor: "💨", rv: "🪜", training: "🎓", rpo: "📐", apk: "🔍" };
  return (
    <div
      onClick={() => !s.locked && onPress(s)}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        background: C.white, borderRadius: 18,
        border: `1.5px solid ${pressed && !s.locked ? s.color + "80" : C.border}`,
        padding: "18px 18px 16px",
        cursor: s.locked ? "default" : "pointer",
        transform: pressed && !s.locked ? "scale(0.98)" : "scale(1)",
        transition: "all 0.14s",
        boxShadow: pressed ? "none" : "0 2px 8px rgba(0,0,0,0.05)",
        opacity: s.locked ? 0.5 : 1,
        userSelect: "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 13, background: s.color + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
          {emojis[s.id]}
        </div>
        {s.locked ? <Pill color={C.text3}>СКОРО</Pill> : (
          <div style={{ width: 30, height: 30, borderRadius: 9, background: s.color + "15", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="9" height="15" viewBox="0 0 9 15" fill="none">
              <path d="M1.5 1.5l6 6-6 6" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: C.text, letterSpacing: -0.3, marginBottom: 4 }}>{s.title}</div>
      <div style={{ fontSize: 12, color: C.text3, fontFamily: "monospace" }}>{s.std}</div>
      <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, color: C.text2 }}>Пунктов СТО</span>
        <span style={{ fontSize: 13, fontFamily: "monospace", fontWeight: 700, color: s.color }}>{s.refs}</span>
      </div>
    </div>
  );
}


// --- Global Search Screen ---
function GlobalSearchScreen({ onOpenSection, favorites, onToggleFavorite, history, onCommitQuery }) {
  const [query, setQuery] = useState("");

  // Save the query to search history once the user pauses typing, rather than on
  // every keystroke — avoids filling history with incomplete prefixes.
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;
    const t = setTimeout(() => onCommitQuery(trimmed), 600);
    return () => clearTimeout(t);
  }, [query, onCommitQuery]);

  const results = query.trim().length > 1
    ? searchIndex.filter(i =>
        i.label.toLowerCase().includes(query.toLowerCase()) ||
        i.ref.toLowerCase().includes(query.toLowerCase()) ||
        i.groupLabel.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const grouped = results.reduce((acc, r) => {
    acc[r.sectionId] = acc[r.sectionId] || [];
    acc[r.sectionId].push(r);
    return acc;
  }, {});

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "-apple-system, 'Inter', sans-serif", paddingBottom: 100 }}>
      <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "48px 20px 16px", position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: -0.6, marginBottom: 14 }}>Поиск</div>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: C.text3 }}>🔍</span>
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Требование, пункт СТО, тема..."
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "13px 14px 13px 38px", borderRadius: 14,
              border: `1.5px solid ${query ? C.accent : C.border}`,
              fontSize: 15, color: C.text, background: C.bg, outline: "none",
            }}
          />
          {query && (
            <button onClick={() => setQuery("")} style={{
              position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
              width: 20, height: 20, borderRadius: "50%", border: "none",
              background: C.text3, color: "white", fontSize: 11, cursor: "pointer",
            }}>✕</button>
          )}
        </div>
      </div>

      <div style={{ padding: "16px 20px" }}>
        {query.trim().length <= 1 ? (
          history && history.length > 0 ? (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.text3, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>
                Недавние запросы
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {history.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => setQuery(h)}
                    style={{
                      padding: "7px 12px", borderRadius: 20,
                      border: `1px solid ${C.border}`, background: C.white,
                      fontSize: 13, color: C.text2, cursor: "pointer",
                    }}
                  >{h}</button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", color: C.text3, padding: "60px 0", fontSize: 14, lineHeight: 1.6 }}>
              Поиск по {searchIndex.length} пунктам НТД<br/>
              во всех открытых разделах
            </div>
          )
        ) : results.length === 0 ? (
          <div style={{ textAlign: "center", color: C.text3, padding: "60px 0", fontSize: 15 }}>
            Ничего не найдено по «{query}»
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ fontSize: 12, color: C.text3 }}>Найдено: {results.length}</div>
            {Object.entries(grouped).map(([sectionId, items]) => {
              const sec = sections.find(s => s.id === sectionId);
              return (
                <div key={sectionId}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: sec.color }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{sec.title}</span>
                    <span style={{ fontSize: 12, color: C.text3, fontFamily: "monospace" }}>{items.length}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {items.map((r, i) => (
                      <div
                        key={i}
                        onClick={() => onOpenSection(sec, r.groupId)}
                        style={{
                          background: C.white, borderRadius: 14, border: `1px solid ${C.border}`,
                          padding: "13px 15px", cursor: "pointer",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                        }}
                      >
                        <div style={{ fontSize: 11, color: C.text3, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600, marginBottom: 5 }}>
                          {r.groupLabel}
                        </div>
                        <div style={{ fontSize: 14.5, color: C.text, lineHeight: 1.55, marginBottom: 6 }}><Highlight text={r.label} query={query} /></div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <RefTag value={<Highlight text={r.ref} query={query} />} />
                          <button
                            onClick={(e) => { e.stopPropagation(); onToggleFavorite(r.uid); }}
                            style={{
                              background: "none", border: "none", cursor: "pointer",
                              fontSize: 17, padding: "4px 2px", lineHeight: 1,
                              color: favorites?.has(r.uid) ? "#F59E0B" : C.text3,
                            }}
                          >{favorites?.has(r.uid) ? "★" : "☆"}</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Favorites Screen ─────────────────────────────────────────
function FavoritesScreen({ favorites, onToggleFavorite, onOpenSection }) {
  const favItems = searchIndex.filter(i => favorites.has(i.uid));

  const grouped = favItems.reduce((acc, r) => {
    acc[r.sectionId] = acc[r.sectionId] || [];
    acc[r.sectionId].push(r);
    return acc;
  }, {});

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "-apple-system, 'Inter', sans-serif", paddingBottom: 100 }}>
      <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "48px 20px 16px", position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: -0.6 }}>Избранное</div>
        <div style={{ fontSize: 13, color: C.text3, marginTop: 4 }}>
          {favItems.length > 0 ? `${favItems.length} пунктов сохранено` : "Пока пусто"}
        </div>
      </div>

      <div style={{ padding: "16px 20px" }}>
        {favItems.length === 0 ? (
          <div style={{ textAlign: "center", color: C.text3, padding: "60px 20px", fontSize: 14, lineHeight: 1.6 }}>
            Нажми на ☆ рядом с любым требованием,<br/>чтобы оно появилось здесь
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {Object.entries(grouped).map(([sectionId, items]) => {
              const sec = sections.find(s => s.id === sectionId);
              return (
                <div key={sectionId}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: sec.color }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{sec.title}</span>
                    <span style={{ fontSize: 12, color: C.text3, fontFamily: "monospace" }}>{items.length}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {items.map((r, i) => (
                      <div
                        key={i}
                        onClick={() => onOpenSection(sec, r.groupId)}
                        style={{
                          background: C.white, borderRadius: 14, border: `1px solid ${C.border}`,
                          padding: "13px 15px", cursor: "pointer",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                        }}
                      >
                        <div style={{ fontSize: 11, color: C.text3, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600, marginBottom: 5 }}>
                          {r.groupLabel}
                        </div>
                        <div style={{ fontSize: 14.5, color: C.text, lineHeight: 1.55, marginBottom: 6 }}>{r.label}</div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <RefTag value={r.ref} />
                          <button
                            onClick={(e) => { e.stopPropagation(); onToggleFavorite(r.uid); }}
                            style={{
                              background: "none", border: "none", cursor: "pointer",
                              fontSize: 17, padding: "4px 2px", lineHeight: 1, color: "#F59E0B",
                            }}
                          >★</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Profile screen ───────────────────────────────────────────
function ProfileScreen({ favorites, onClearData }) {
  const readySections = sections.filter(s => !s.locked).length;

  const handleClear = () => {
    const confirmed = window.confirm(
      "Удалить избранное и историю поиска? Это действие нельзя отменить."
    );
    if (confirmed) onClearData();
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "-apple-system, 'Inter', sans-serif", paddingBottom: 100 }}>
      <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "48px 20px 16px", position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: -0.6 }}>Профиль</div>
      </div>

      <div style={{ padding: "20px 20px" }}>
        <div style={{
          background: C.white, borderRadius: 16, border: `1px solid ${C.border}`,
          padding: "18px 16px", display: "flex", alignItems: "center", gap: 14,
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%", background: C.gor + "15",
            border: `1.5px solid ${C.gor}30`, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 20, fontWeight: 700, color: C.gor, flexShrink: 0,
          }}>И</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Инженер по ОТ</div>
            <div style={{ fontSize: 12.5, color: C.text3, marginTop: 2 }}>Локальный профиль на устройстве</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          {[
            { value: String(favorites.size),      label: "избранных" },
            { value: String(readySections),        label: "разделов доступно" },
            { value: String(searchIndex.length),   label: "пунктов НТД" },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, padding: "13px 10px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.gor, letterSpacing: -0.6, fontFamily: "monospace" }}>{s.value}</div>
              <div style={{ fontSize: 10.5, color: C.text3, marginTop: 3, lineHeight: 1.3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <button
          onClick={handleClear}
          style={{
            width: "100%", marginTop: 20, padding: "14px 16px", borderRadius: 14,
            border: `1.5px solid #FCA5A5`, background: C.warnBg, cursor: "pointer",
            fontSize: 14, fontWeight: 600, color: C.warn,
          }}
        >
          Очистить избранное и историю поиска
        </button>
      </div>
    </div>
  );
}

// --- localStorage persistence (favorites, search history) ---
// Wrapped in try/catch: localStorage throws in private/incognito mode in
// some browsers, and we'd rather silently lose persistence than crash the app.
const STORAGE_KEYS = {
  favorites: "ot-navigator:favorites",
  searchHistory: "ot-navigator:search-history",
};
const SEARCH_HISTORY_LIMIT = 8;

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore — e.g. private mode, storage disabled, quota exceeded
  }
}

export default function App() {
  const [activeSection, setActiveSection] = useState(null);
  const [activeTab, setActiveTab] = useState("home");
  const [time, setTime] = useState(new Date());
  const [initialGroup, setInitialGroup] = useState(null);
  const [favorites, setFavorites] = useState(() => new Set(loadFromStorage(STORAGE_KEYS.favorites, [])));
  const [searchHistory, setSearchHistory] = useState(() => loadFromStorage(STORAGE_KEYS.searchHistory, []));

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.favorites, Array.from(favorites));
  }, [favorites]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.searchHistory, searchHistory);
  }, [searchHistory]);

  const commitSearchQuery = (q) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) return;
    setSearchHistory(prev => [trimmed, ...prev.filter(h => h.toLowerCase() !== trimmed.toLowerCase())].slice(0, SEARCH_HISTORY_LIMIT));
  };

  const clearLocalData = () => {
    setFavorites(new Set());
    setSearchHistory([]);
  };

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const toggleFavorite = (uid) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  };

  const openSectionFromSearch = (sec, groupId) => {
    setInitialGroup(groupId);
    setActiveSection(sec);
  };

  if (activeSection) {
    return (
      <DetailScreen
        section={activeSection}
        initialGroupId={initialGroup}
        onBack={() => { setActiveSection(null); setInitialGroup(null); }}
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
      />
    );
  }

  if (activeTab === "search") {
    return (
      <>
        <GlobalSearchScreen
          onOpenSection={openSectionFromSearch}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          history={searchHistory}
          onCommitQuery={commitSearchQuery}
        />
        <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />
      </>
    );
  }

  if (activeTab === "profile") {
    return (
      <>
        <ProfileScreen favorites={favorites} onClearData={clearLocalData} />
        <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />
      </>
    );
  }

  if (activeTab === "favorites") {
    return (
      <>
        <FavoritesScreen favorites={favorites} onToggleFavorite={toggleFavorite} onOpenSection={openSectionFromSearch} />
        <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />
      </>
    );
  }

  const h = time.getHours();
  const greeting = h < 6 ? "Доброй ночи" : h < 12 ? "Доброе утро" : h < 18 ? "Добрый день" : "Добрый вечер";


  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "-apple-system, 'Inter', sans-serif" }}>
      <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "48px 20px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: C.gor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: C.white }}>ОТ</div>
            <span style={{ fontSize: 17, fontWeight: 700, color: C.text, letterSpacing: -0.3 }}>ОТ Навигатор</span>
          </div>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: C.gor + "15", border: `1.5px solid ${C.gor}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: C.gor }}>И</div>
        </div>
        <div style={{ fontSize: 13, color: C.text3, marginBottom: 3 }}>{greeting}</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: C.text, letterSpacing: -0.8, lineHeight: 1.15 }}>Справочник ОТ</div>
      </div>

      <div style={{ padding: "20px 20px 90px", display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", gap: 10 }}>
          {[
            { value: "170", label: "пунктов НТД",  color: C.accent },
            { value: "5",   label: "разделов",      color: C.or     },
            { value: "32",  label: "этапов",        color: C.rv     },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, padding: "13px 12px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color, letterSpacing: -0.8, fontFamily: "monospace" }}>{s.value}</div>
              <div style={{ fontSize: 11, color: C.text3, marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ background: C.white, borderRadius: 16, border: `1.5px solid ${C.gor}30`, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", boxShadow: `0 4px 16px ${C.gor}18` }}
          onClick={() => setActiveSection(sections[0])}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: C.gor + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>💨</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: C.text3, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 2 }}>Обновлено сегодня</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Газоопасные работы · Замкнутое пространство</div>
          </div>
          <svg width="9" height="15" viewBox="0 0 9 15" fill="none">
            <path d="M1.5 1.5l6 6-6 6" stroke={C.gor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text2, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 }}>Виды работ</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {sections.map(s => <SectionCard key={s.id} s={s} onPress={setActiveSection} />)}
          </div>
        </div>

        <div style={{ background: C.accent, borderRadius: 16, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14, opacity: 0.7, boxShadow: `0 4px 18px ${C.accent}40` }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🧠</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.white }}>Вопрос дня</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 2 }}>Проверь знания · ~1 мин</div>
          </div>
          <Pill color="#FFFFFF">СКОРО</Pill>
        </div>
      </div>

      <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

// --- Reusable bottom tab bar ---
function TabBar({ activeTab, setActiveTab }) {
  const tabs = [
    { id: "home",      emoji: "🏠", label: "Главная"   },
    { id: "search",    emoji: "🔍", label: "Поиск"     },
    { id: "favorites", emoji: "⭐", label: "Избранное" },
    { id: "profile",   emoji: "👤", label: "Профиль"   },
  ];
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      background: "rgba(255,255,255,0.94)", backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)", borderTop: `1px solid ${C.border}`,
      display: "flex", justifyContent: "space-around", padding: "10px 0 26px",
    }}>
      {tabs.map(item => {
        const active = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "0 14px", display: "flex", flexDirection: "column",
              alignItems: "center", gap: 3,
              color: active ? C.gor : C.text3,
            }}
          >
            <span style={{ fontSize: 22, lineHeight: 1 }}>{item.emoji}</span>
            <span style={{ fontSize: 10, fontWeight: active ? 700 : 500 }}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
