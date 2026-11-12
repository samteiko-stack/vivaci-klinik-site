/**
 * Vivaci treatment-page CMS (non-dev editors).
 * Persists to content/treatment-pages/{category}/{slug}.json via /admin/api.
 */

const OVERVIEW_BLOCK_IDS = [
  { id: "whatIsIt", label: "Vad är det / Om behandlingen" },
  { id: "symptoms", label: "Tecken & symtom / Passar för" },
  { id: "causes", label: "Orsaker" },
  { id: "assessment", label: "Hur vi bedömer det" },
];

const FACT_ICONS = [
  "",
  "timer",
  "heart-pulse",
  "wallet",
  "layout-grid",
  "calendar-check",
  "syringe",
  "sparkles",
];

const SECTION_LABELS = {
  hero: "Hero",
  facts: "Snabba fakta",
  overview: "Översikt",
  suitability: "Passar bra / Kräver bedömning",
  benefits: "Fördelar",
  howItWorks: "Så fungerar det",
  resultsTimeline: "Resultat över tid",
  treatmentAreas: "Behandlingsområden",
  beforeAfterCare: "Före & eftervård",
  beforeAfterGallery: "Före & Efter (bilder)",
  faq: "Vanliga frågor",
  related: "Relaterat",
  quizCta: "Quiz-kort",
  bottomCta: "Botten-CTA",
  method: "Vår metod (endast synlighet)",
  experts: "Möt experter (endast synlighet)",
  trust: "Trust (endast synlighet)",
};

const SECTION_ORDER = [
  "hero",
  "facts",
  "overview",
  "treatmentAreas",
  "suitability",
  "benefits",
  "howItWorks",
  "resultsTimeline",
  "beforeAfterCare",
  "beforeAfterGallery",
  "faq",
  "related",
  "quizCta",
  "method",
  "experts",
  "trust",
  "bottomCta",
];

const state = {
  authenticated: false,
  pages: [],
  filter: "",
  category: "",
  current: null,
  data: null,
  dirty: false,
};

const $ = (sel, root = document) => root.querySelector(sel);

async function api(path, options = {}) {
  const res = await fetch(path, {
    credentials: "same-origin",
    headers:
      options.body && !(options.body instanceof FormData)
        ? { "Content-Type": "application/json", ...(options.headers || {}) }
        : options.headers || {},
    ...options,
    body:
      options.body && typeof options.body === "object" && !(options.body instanceof FormData)
        ? JSON.stringify(options.body)
        : options.body,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || res.statusText || "Request failed");
  }
  return json;
}

function toast(message) {
  const node = $("#toast");
  node.textContent = message;
  node.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => {
    node.hidden = true;
  }, 3200);
}

function setDirty(dirty) {
  state.dirty = dirty;
  $("#save-btn").disabled = !dirty || !state.data;
  $("#save-hint").hidden = !dirty;
}

function categoryLabel(cat) {
  if (cat === "behandlingar") return "Behandlingar";
  if (cat === "problem") return "Problem";
  if (cat === "plastikkirurgi") return "Plastikkirurgi";
  return cat;
}

function el(tag, className, props = {}, children = []) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  Object.entries(props).forEach(([k, v]) => {
    if (k === "text") node.textContent = v;
    else if (k === "html") node.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else if (k === "style" && v && typeof v === "object") Object.assign(node.style, v);
    else if (k === "style") node.setAttribute("style", v);
    else if (v != null) node.setAttribute(k, v);
  });
  children.forEach((c) => {
    if (typeof c === "string") node.appendChild(document.createTextNode(c));
    else if (c) node.appendChild(c);
  });
  return node;
}

function fieldWrap(label, control) {
  return el("div", "ds-field", {}, [
    el("div", "ds-field-label", { text: label }),
    control,
  ]);
}

function textInput(value, placeholder, onInput) {
  const input = el("input", "ds-input", {
    type: "text",
    value: value || "",
    placeholder: placeholder || "",
  });
  input.addEventListener("input", () => {
    onInput(input.value);
    setDirty(true);
  });
  return input;
}

function textArea(value, rows, onInput) {
  const area = el("textarea", "ds-textarea", { rows: String(rows || 5) });
  area.value = value || "";
  area.addEventListener("input", () => {
    onInput(area.value);
    setDirty(true);
  });
  return area;
}

function enabledSwitch(section, labelText, onChange) {
  const wrap = el("label", "ds-toggle-field");
  const box = el("input", "ds-checkbox", { type: "checkbox" });
  box.checked = section.enabled !== false;
  box.addEventListener("change", () => {
    section.enabled = box.checked;
    onChange?.();
    setDirty(true);
  });
  const copy = el("span", "ds-toggle-field__copy");
  copy.append(el("span", "ds-toggle-field__title", { text: labelText || "Visa sektion på sidan" }));
  wrap.append(box, copy);
  return wrap;
}

function ctaEditor(cta, onChange) {
  if (!cta) cta = {};
  const row = el("div", "ds-flex", { style: "gap: var(--spacing-md); flex-wrap: wrap" });
  row.append(
    fieldWrap(
      "Knapptext",
      textInput(cta.label, "", (v) => {
        cta.label = v;
        onChange();
      })
    ),
    fieldWrap(
      "Länk",
      textInput(cta.href, "/kontakt", (v) => {
        cta.href = v;
        onChange();
      })
    )
  );
  return row;
}

function stringListRepeater(items, onChange, itemLabel = "Punkt") {
  if (!Array.isArray(items)) items = [];
  const host = el("div", "ds-stack");
  function render() {
    host.innerHTML = "";
    items.forEach((val, idx) => {
      const card = el("div", "ds-surface-inset");
      card.append(
        fieldWrap(
          `${itemLabel} ${idx + 1}`,
          textArea(val, 2, (v) => {
            items[idx] = v;
            onChange();
          })
        ),
        el("div", "ds-action-group", { style: "justify-content: flex-end" }, [
          el("button", "ds-btn ds-btn--ghost ds-btn--sm", { type: "button", text: "Ta bort" }),
        ])
      );
      card.querySelector("button").addEventListener("click", () => {
        items.splice(idx, 1);
        setDirty(true);
        render();
        onChange();
      });
      host.append(card);
    });
    const add = el("button", "ds-btn ds-btn--secondary ds-btn--sm", { type: "button", text: "+ Lägg till" });
    add.addEventListener("click", () => {
      items.push("");
      setDirty(true);
      render();
      onChange();
    });
    host.append(add);
  }
  render();
  return host;
}

function cardRepeater(items, fields, onChange, emptyItem) {
  if (!Array.isArray(items)) items = [];
  const host = el("div", "ds-stack");
  function render() {
    host.innerHTML = "";
    items.forEach((item, idx) => {
      const card = el("div", "ds-surface-inset");
      fields.forEach((f) => {
        card.append(
          fieldWrap(
            f.label,
            f.kind === "textarea"
              ? textArea(item[f.key], f.rows || 3, (v) => {
                  item[f.key] = v;
                  onChange();
                })
              : textInput(item[f.key], f.placeholder, (v) => {
                  item[f.key] = v;
                  onChange();
                })
          )
        );
      });
      const remove = el("button", "ds-btn ds-btn--ghost ds-btn--sm", { type: "button", text: "Ta bort" });
      remove.addEventListener("click", () => {
        items.splice(idx, 1);
        setDirty(true);
        render();
        onChange();
      });
      card.append(el("div", "ds-action-group", { style: "justify-content: flex-end" }, [remove]));
      host.append(card);
    });
    const add = el("button", "ds-btn ds-btn--secondary ds-btn--sm", { type: "button", text: "+ Lägg till" });
    add.addEventListener("click", () => {
      items.push({ ...emptyItem });
      setDirty(true);
      render();
      onChange();
    });
    host.append(add);
  }
  render();
  return host;
}

function sectionShell(key, bodyChildren) {
  const section = el("details", "vivaci-admin-section");
  section.append(el("summary", "", { text: SECTION_LABELS[key] || key }));
  const body = el("div", "vivaci-admin-section__body ds-stack");
  body.style.gap = "var(--spacing-md)";
  bodyChildren.forEach((c) => body.append(c));
  section.append(body);
  return section;
}

function ensureSection(data, key) {
  if (!data.sections) data.sections = {};
  if (!data.sections[key]) data.sections[key] = { enabled: true };
  return data.sections[key];
}

function ensureOverviewBlocks(section) {
  if (!section.blocks) section.blocks = [];
  OVERVIEW_BLOCK_IDS.forEach(({ id }) => {
    if (!section.blocks.find((b) => b.id === id)) {
      section.blocks.push({ id, heading: "", body: "", enabled: false });
    }
  });
}

function renderEditor(data) {
  const root = $("#section-forms");
  root.innerHTML = "";
  const sections = data.sections || {};

  const addSection = (key, build) => {
    const sec = sections[key] || { enabled: true };
    sections[key] = sec;
    const inner = [enabledSwitch(sec)];
    build(sec, inner);
    root.append(sectionShell(key, inner));
  };

  addSection("hero", (sec, inner) => {
    inner.push(
      fieldWrap("Rubrik (H1)", textInput(sec.title || data.title, "", (v) => (sec.title = v))),
      fieldWrap("Intro", textArea(sec.intro, 5, (v) => (sec.intro = v))),
      el("p", "ds-text-muted", { text: "Knappar" }),
      ctaEditor(sec.primaryCta || (sec.primaryCta = {}), () => {}),
      ctaEditor(sec.secondaryCta || (sec.secondaryCta = {}), () => {})
    );
  });

  addSection("facts", (sec, inner) => {
    if (!sec.items) sec.items = [];
    inner.push(
      fieldWrap("Titel", textInput(sec.title, "Snabba fakta", (v) => (sec.title = v))),
      fieldWrap("Sammanfattning", textArea(sec.summary, 2, (v) => (sec.summary = v))),
      el("p", "ds-field-label", { text: "Fakta-rader" })
    );
    const host = el("div", "ds-stack");
    function renderFacts() {
      host.innerHTML = "";
      sec.items.forEach((item, idx) => {
        const card = el("div", "ds-surface-inset");
        const iconSelect = el("select", "ds-select");
        FACT_ICONS.forEach((ic) => {
          const opt = el("option", "", { value: ic, text: ic || "(automatisk ikon)" });
          iconSelect.append(opt);
        });
        iconSelect.value = item.icon || "";
        iconSelect.addEventListener("change", () => {
          item.icon = iconSelect.value || undefined;
          setDirty(true);
        });
        card.append(
          fieldWrap("Etikett", textInput(item.label, "", (v) => (item.label = v))),
          fieldWrap("Värde", textInput(item.value, "", (v) => (item.value = v))),
          fieldWrap("Ikon", iconSelect),
          el("div", "ds-action-group", { style: "justify-content: flex-end" }, [
            el("button", "ds-btn ds-btn--ghost ds-btn--sm", { type: "button", text: "Ta bort" }),
          ])
        );
        card.querySelector("button").addEventListener("click", () => {
          sec.items.splice(idx, 1);
          setDirty(true);
          renderFacts();
        });
        host.append(card);
      });
      const add = el("button", "ds-btn ds-btn--secondary ds-btn--sm", { type: "button", text: "+ Rad" });
      add.addEventListener("click", () => {
        sec.items.push({ label: "", value: "" });
        setDirty(true);
        renderFacts();
      });
      host.append(add);
    }
    renderFacts();
    inner.push(host);
  });

  addSection("overview", (sec, inner) => {
    ensureOverviewBlocks(sec);
    inner.push(
      fieldWrap("Tagline", textInput(sec.tagline, "", (v) => (sec.tagline = v))),
      fieldWrap("Rubrik (H2)", textInput(sec.heading, "", (v) => (sec.heading = v))),
      el("p", "ds-field-label", { text: "Innehållsblock" })
    );
    const grid = el("div", "ds-stack");
    OVERVIEW_BLOCK_IDS.forEach(({ id, label }) => {
      let block = sec.blocks.find((b) => b.id === id);
      if (!block) {
        block = { id, heading: "", body: "", enabled: false };
        sec.blocks.push(block);
      }
      const box = el("div", "ds-surface-muted");
      box.append(
        el("p", "ds-field-label", { text: label }),
        enabledSwitch(block),
        fieldWrap("Blockrubrik", textInput(block.heading, "", (v) => (block.heading = v))),
        fieldWrap("Brödtext (dubbla radbrytningar = nytt stycke)", textArea(block.body, 8, (v) => (block.body = v)))
      );
      grid.append(box);
    });
    inner.push(grid);
  });

  addSection("treatmentAreas", (sec, inner) => {
    if (!sec.items) sec.items = [];
    inner.push(
      cardRepeater(
        sec.items,
        [
          { key: "title", label: "Rubrik" },
          { key: "body", label: "Text", kind: "textarea", rows: 2 },
        ],
        () => {},
        { title: "", body: "" }
      )
    );
  });

  addSection("suitability", (sec, inner) => {
    if (!sec.goodFor) sec.goodFor = [];
    if (!sec.needsAssessment) sec.needsAssessment = [];
    inner.push(
      el("p", "ds-text-muted", {
        text: "Båda listorna måste ha minst en punkt för att sektionen ska visas på sidan.",
      }),
      el("p", "ds-field-label", { text: "Passar bra för dig som" }),
      stringListRepeater(sec.goodFor, () => {}),
      el("p", "ds-field-label", { text: "Kräver individuell bedömning" }),
      stringListRepeater(sec.needsAssessment, () => {})
    );
  });

  addSection("benefits", (sec, inner) => {
    if (!sec.items) sec.items = [];
    inner.push(
      cardRepeater(
        sec.items,
        [
          { key: "title", label: "Rubrik" },
          { key: "body", label: "Text", kind: "textarea", rows: 3 },
        ],
        () => {},
        { title: "", body: "" }
      )
    );
  });

  addSection("howItWorks", (sec, inner) => {
    if (!sec.steps) sec.steps = [];
    inner.push(
      fieldWrap("Rubrik", textInput(sec.heading, "Så fungerar det", (v) => (sec.heading = v))),
      fieldWrap("Brödtext (om inga steg finns)", textArea(sec.body, 6, (v) => (sec.body = v))),
      el("p", "ds-field-label", { text: "Steg (ersätter brödtext om minst ett steg finns)" }),
      cardRepeater(
        sec.steps,
        [
          { key: "title", label: "Stegnamn" },
          { key: "body", label: "Beskrivning", kind: "textarea", rows: 3 },
        ],
        () => {},
        { title: "", body: "" }
      )
    );
  });

  addSection("resultsTimeline", (sec, inner) => {
    if (!sec.items) sec.items = [];
    inner.push(
      fieldWrap("Rubrik", textInput(sec.heading, "Resultat över tid", (v) => (sec.heading = v))),
      cardRepeater(
        sec.items,
        [
          { key: "title", label: "Etikett (t.ex. Dag 0)" },
          { key: "body", label: "Beskrivning", kind: "textarea", rows: 2 },
        ],
        () => {},
        { title: "", body: "" }
      )
    );
  });

  addSection("beforeAfterCare", (sec, inner) => {
    if (!sec.before) sec.before = [];
    if (!sec.after) sec.after = [];
    inner.push(
      fieldWrap("Intro — före", textArea(sec.introBefore, 2, (v) => (sec.introBefore = v))),
      el("p", "ds-field-label", { text: "Checklista före" }),
      stringListRepeater(sec.before, () => {}),
      fieldWrap("Intro — efter", textArea(sec.introAfter, 2, (v) => (sec.introAfter = v))),
      el("p", "ds-field-label", { text: "Checklista efter" }),
      stringListRepeater(sec.after, () => {})
    );
  });

  addSection("beforeAfterGallery", (sec, inner) => {
    if (!sec.items) sec.items = [];
    inner.push(
      fieldWrap("Rubrik", textInput(sec.heading, "Före & Efter", (v) => (sec.heading = v))),
      fieldWrap("Intro", textArea(sec.intro, 2, (v) => (sec.intro = v))),
      fieldWrap("Disclaimer", textArea(sec.disclaimer, 2, (v) => (sec.disclaimer = v))),
      el("p", "ds-field-label", { text: "Bilder (sökvägar under /images/…)" }),
      cardRepeater(
        sec.items,
        [
          { key: "title", label: "Bildtext (valfritt)" },
          { key: "beforeImage", label: "Före-bild URL" },
          { key: "afterImage", label: "Efter-bild URL" },
        ],
        () => {},
        { title: "", beforeImage: "", afterImage: "" }
      )
    );
  });

  addSection("faq", (sec, inner) => {
    if (!sec.items) sec.items = [];
    inner.push(
      fieldWrap("Intro", textArea(sec.intro, 3, (v) => (sec.intro = v))),
      el("p", "ds-field-label", { text: "Frågor" }),
      cardRepeater(
        sec.items,
        [
          { key: "question", label: "Fråga" },
          { key: "answer", label: "Svar", kind: "textarea", rows: 4 },
        ],
        () => {},
        { question: "", answer: "" }
      )
    );
  });

  addSection("related", (sec, inner) => {
    if (!sec.items) sec.items = [];
    inner.push(
      fieldWrap("Rubrik", textInput(sec.heading, "Relaterat", (v) => (sec.heading = v))),
      cardRepeater(
        sec.items,
        [
          { key: "title", label: "Titel" },
          { key: "href", label: "Länk", placeholder: "/behandlingar/…" },
        ],
        () => {},
        { title: "", href: "" }
      )
    );
  });

  addSection("quizCta", (sec, inner) => {
    if (!sec.quizLink) sec.quizLink = { enabled: true, label: "Gör vårt gratis quiz" };
    inner.push(
      fieldWrap("Rubrik", textInput(sec.heading, "", (v) => (sec.heading = v))),
      fieldWrap("Intro", textArea(sec.intro, 3, (v) => (sec.intro = v))),
      enabledSwitch(sec.quizLink, "Visa quiz-knapp"),
      fieldWrap("Quiz-knapptext", textInput(sec.quizLink.label, "", (v) => (sec.quizLink.label = v)))
    );
  });

  ["method", "experts", "trust"].forEach((key) => {
    const sec = ensureSection(data, key);
    root.append(
      sectionShell(
        key,
        [enabledSwitch(sec), el("p", "ds-text-muted", { text: "Texter i dessa sektioner ligger i Webflow-mallen idag." })]
      )
    );
  });

  addSection("bottomCta", (sec, inner) => {
    inner.push(
      fieldWrap("Rubrik", textInput(sec.heading, "", (v) => (sec.heading = v))),
      fieldWrap("Intro", textArea(sec.intro, 3, (v) => (sec.intro = v))),
      el("p", "ds-field-label", { text: "Primär knapp" }),
      ctaEditor(sec.primaryCta || (sec.primaryCta = {}), () => {})
    );
  });

}

function renderPageList() {
  const list = $("#page-list");
  list.innerHTML = "";
  const q = state.filter.trim().toLowerCase();
  state.pages
    .filter((p) => !state.category || p.category === state.category)
    .filter((p) => {
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.path.toLowerCase().includes(q)
      );
    })
    .forEach((p) => {
      const btn = el("button", state.current === p ? "is-active" : "", {
        type: "button",
        role: "option",
      });
      btn.append(
        el("span", "ds-text-strong", { text: p.title }),
        el("span", "ds-text-meta", { text: `${categoryLabel(p.category)} · ${p.slug}` })
      );
      btn.addEventListener("click", () => selectPage(p));
      list.append(btn);
    });
}

async function selectPage(meta) {
  if (state.dirty && !confirm("Du har osparade ändringar. Fortsätt utan att spara?")) return;
  state.current = meta;
  setDirty(false);
  const data = await api(`/admin/api/pages/${meta.category}/${meta.slug}`);
  state.data = data;
  $("#empty-state").hidden = true;
  $("#editor-panel").hidden = false;
  $("#editor-title").textContent = data.title || meta.title;
  $("#editor-path").textContent = data.path || meta.path;
  $("#preview-link").href = data.path || meta.path;
  renderEditor(data);
  renderPageList();
}

async function boot() {
  const session = await api("/admin/api/session");
  window.__vivaciAuthRequired = !!session.authRequired;
  state.authenticated = session.authenticated;
  if (session.authenticated || !session.authRequired) {
    await showApp();
  } else {
    showLogin();
  }
}

function showLogin() {
  $("#login-panel").hidden = false;
  $("#editor-shell").hidden = true;
  $("#toolbar-actions").hidden = true;
}

async function showApp() {
  $("#login-panel").hidden = true;
  $("#editor-shell").hidden = false;
  $("#toolbar-actions").hidden = false;
  $("#logout-btn").hidden = !window.__vivaciAuthRequired;
  const res = await api("/admin/api/pages");
  state.pages = res.pages || [];
  renderPageList();
}

$("#login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const password = new FormData(e.target).get("password");
  $("#login-error").hidden = true;
  try {
    await api("/admin/api/login", { method: "POST", body: { password } });
    await showApp();
  } catch (err) {
    $("#login-error").textContent = err.message;
    $("#login-error").hidden = false;
  }
});

$("#logout-btn").addEventListener("click", async () => {
  await api("/admin/api/logout", { method: "POST", body: {} });
  state.data = null;
  state.current = null;
  setDirty(false);
  showLogin();
});

$("#save-btn").addEventListener("click", async () => {
  if (!state.data || !state.current) return;
  const { category, slug } = state.current;
  try {
    const heroTitle = state.data.sections?.hero?.title;
    if (heroTitle && String(heroTitle).trim()) {
      state.data.title = String(heroTitle).trim();
    }
    await api(`/admin/api/pages/${category}/${slug}`, { method: "PUT", body: state.data });
    setDirty(false);
    toast("Sparat — öppna förhandsgranskning för att se sidan.");
  } catch (err) {
    toast(err.message);
  }
});

$("#page-search").addEventListener("input", (e) => {
  state.filter = e.target.value;
  renderPageList();
});

$("#category-filter").addEventListener("change", (e) => {
  state.category = e.target.value;
  renderPageList();
});

window.addEventListener("beforeunload", (e) => {
  if (state.dirty) {
    e.preventDefault();
    e.returnValue = "";
  }
});

boot().catch((err) => {
  console.error(err);
  toast("Kunde inte starta admin: " + err.message);
});
