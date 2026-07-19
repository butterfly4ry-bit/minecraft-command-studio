// ============================================================
// マイクラコマンド工房 メインロジック
// ============================================================

const state = {
  edition: localStorage.getItem("edition") || "bedrock",
  newsEdition: "bedrock",
  currentTemplate: null,
  params: {},
  cart: JSON.parse(localStorage.getItem("cart") || "[]"),
};

const BLOCK_TYPE_JA = {
  impulse: "インパルス(1回実行)",
  chain: "チェーン(連結)",
  repeat: "リピート(くり返し)",
};

// ---------- ユーティリティ ----------
const $ = (id) => document.getElementById(id);

let toastTimer = null;
function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add("hidden"), 2200);
}

function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(
      () => toast("コピーしました!"),
      () => fallbackCopy(text)
    );
  } else {
    fallbackCopy(text);
  }
}
function fallbackCopy(text) {
  const ta = document.createElement("textarea");
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand("copy"); toast("コピーしました!"); }
  catch { toast("コピーできませんでした"); }
  ta.remove();
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(state.cart));
  updateBadge();
}

// ---------- タブ ----------
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.toggle("active", b === btn));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.toggle("active", p.id === btn.dataset.tab));
    if (btn.dataset.tab === "tab-export") renderCart();
    if (btn.dataset.tab === "tab-news") loadNews(state.newsEdition);
  });
});

// ---------- エディション切り替え ----------
function setEdition(ed) {
  state.edition = ed;
  localStorage.setItem("edition", ed);
  $("btn-bedrock").classList.toggle("active", ed === "bedrock");
  $("btn-java").classList.toggle("active", ed === "java");
  if (state.currentTemplate) renderDiagram();
  renderCart();
}
$("btn-bedrock").addEventListener("click", () => setEdition("bedrock"));
$("btn-java").addEventListener("click", () => setEdition("java"));
setEdition(state.edition);

// ---------- テンプレート検索・一覧 ----------
function scoreTemplate(tpl, query) {
  if (!query) return 1;
  const q = query.toLowerCase().trim();
  const tokens = q.split(/[\s、。,\.]+/).filter(Boolean);
  let score = 0;
  const hay = (tpl.title + " " + tpl.desc + " " + tpl.keywords.join(" ")).toLowerCase();
  for (const t of tokens) {
    if (tpl.title.toLowerCase().includes(t)) score += 5;
    for (const kw of tpl.keywords) {
      if (kw.toLowerCase() === t) score += 4;
      else if (kw.toLowerCase().includes(t) || t.includes(kw.toLowerCase())) score += 2;
    }
    if (hay.includes(t)) score += 1;
  }
  return score;
}

function renderTemplateList() {
  const q = $("build-search").value;
  const list = $("template-list");
  list.innerHTML = "";
  const scored = TEMPLATES.map(t => ({ t, s: scoreTemplate(t, q) }))
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s);
  if (!scored.length) {
    list.innerHTML = '<p class="no-result">見つかりませんでした 😢<br>別の言葉で検索してみてください(例:「発光」「テレポート」「夜」)</p>';
    return;
  }
  for (const { t } of scored) {
    const btn = document.createElement("button");
    btn.className = "template-card";
    const blockCount = t.blocks(defaultParams(t)).length;
    btn.innerHTML = `
      <span class="template-icon">${t.icon}</span>
      <span><b>${t.title}</b><small>${t.desc}</small></span>
      <span class="template-tag">${blockCount > 1 ? "ブロック×" + blockCount : "ブロック×1"}</span>`;
    btn.addEventListener("click", () => openTemplate(t));
    list.appendChild(btn);
  }
}
$("build-search").addEventListener("input", renderTemplateList);

function defaultParams(tpl) {
  const p = {};
  for (const prm of tpl.params) p[prm.key] = prm.def;
  return p;
}

// ---------- テンプレート詳細 ----------
function openTemplate(tpl) {
  state.currentTemplate = tpl;
  state.params = defaultParams(tpl);
  $("template-list").classList.add("hidden");
  document.querySelector("#tab-build .search-box").classList.add("hidden");
  $("template-detail").classList.remove("hidden");
  $("detail-title").textContent = tpl.icon + " " + tpl.title;
  $("detail-desc").textContent = tpl.desc;
  renderParamForm();
  renderDiagram();
  window.scrollTo(0, 0);
}

$("detail-back").addEventListener("click", () => {
  state.currentTemplate = null;
  $("template-detail").classList.add("hidden");
  $("template-list").classList.remove("hidden");
  document.querySelector("#tab-build .search-box").classList.remove("hidden");
});

function renderParamForm() {
  const form = $("param-form");
  form.innerHTML = "";
  for (const prm of state.currentTemplate.params) {
    if (prm.type === "check") {
      const label = document.createElement("label");
      label.className = "field-check";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = !!state.params[prm.key];
      input.addEventListener("change", () => { state.params[prm.key] = input.checked; renderDiagram(); });
      label.appendChild(input);
      label.appendChild(document.createTextNode(prm.label));
      form.appendChild(label);
      continue;
    }
    const label = document.createElement("label");
    label.className = "field";
    const span = document.createElement("span");
    span.textContent = prm.label;
    label.appendChild(span);
    let input;
    if (prm.type === "select") {
      input = document.createElement("select");
      for (const opt of prm.options) {
        const o = document.createElement("option");
        o.value = opt.v;
        o.textContent = opt.ja;
        input.appendChild(o);
      }
      input.value = state.params[prm.key];
      input.addEventListener("change", () => { state.params[prm.key] = input.value; renderDiagram(); });
    } else {
      input = document.createElement("input");
      input.type = prm.type === "number" ? "number" : "text";
      if (prm.min != null) input.min = prm.min;
      if (prm.max != null) input.max = prm.max;
      input.value = state.params[prm.key];
      input.addEventListener("input", () => {
        state.params[prm.key] = prm.type === "number" ? Number(input.value || prm.def) : input.value;
        renderDiagram();
      });
    }
    label.appendChild(input);
    form.appendChild(label);
  }
}

function currentBlocks() {
  return state.currentTemplate.blocks(state.params);
}

function renderDiagram() {
  if (!state.currentTemplate) return;
  const dia = $("diagram");
  dia.innerHTML = "";
  const blocks = currentBlocks();
  blocks.forEach((b, i) => {
    if (i > 0) {
      const arrow = document.createElement("div");
      arrow.className = "diagram-arrow";
      arrow.textContent = "⬇";
      dia.appendChild(arrow);
    }
    const cmd = b.gen(state.edition);
    const div = document.createElement("div");
    div.className = "cmd-block " + b.type;
    const settings = [
      b.type === "chain" ? "条件なし" : "無条件",
      b.type === "impulse" ? "動力が必要" : "常時実行",
    ];
    div.innerHTML = `
      <div class="block-head">
        <span class="block-face"></span>
        <span>
          <div class="block-type">${BLOCK_TYPE_JA[b.type]}</div>
          <div class="block-settings">${settings.map(s => `<span class="block-setting">${s}</span>`).join("")}</div>
        </span>
      </div>
      ${b.note ? `<div class="block-note">${b.note}</div>` : ""}
      <div class="block-cmd">
        <code>${escapeHtml(cmd)}</code>
        <button type="button" class="copy-btn">コピー</button>
      </div>`;
    div.querySelector(".copy-btn").addEventListener("click", () => copyText(cmd));
    dia.appendChild(div);
  });

  const noteEl = $("edition-note");
  const note = state.currentTemplate.editionNote ? state.currentTemplate.editionNote(state.params) : "";
  if (note) {
    noteEl.textContent = note;
    noteEl.classList.remove("hidden");
  } else {
    noteEl.classList.add("hidden");
  }
}

$("btn-copy-all").addEventListener("click", () => {
  const cmds = currentBlocks().map(b => b.gen(state.edition)).join("\n");
  copyText(cmds);
});

$("btn-add-cart").addEventListener("click", () => {
  const tpl = state.currentTemplate;
  const blocks = currentBlocks();
  const isTick = blocks[0].type === "repeat";
  const idx = state.cart.filter(c => c.tplId === tpl.id).length + 1;
  state.cart.push({
    tplId: tpl.id,
    title: tpl.title,
    icon: tpl.icon,
    fnName: safeName(tpl.id.replace(/-/g, "_"), "cmd") + (idx > 1 ? "_" + idx : ""),
    params: { ...state.params },
    tick: isTick,
  });
  saveCart();
  toast("書き出しリストに追加しました!");
});

// ---------- コマンドリファレンス ----------
function renderRefList() {
  const q = ($("ref-search").value || "").toLowerCase().trim();
  const list = $("ref-list");
  list.innerHTML = "";
  const items = COMMAND_REF.filter(c =>
    !q || c.name.toLowerCase().includes(q) || c.summary.toLowerCase().includes(q) ||
    c.desc.toLowerCase().includes(q)
  );
  if (!items.length) {
    list.innerHTML = '<p class="no-result">見つかりませんでした</p>';
    return;
  }
  for (const c of items) {
    const det = document.createElement("details");
    det.className = "ref-card";
    det.innerHTML = `
      <summary><code>/${c.name}</code><small>${c.summary}</small></summary>
      <div class="ref-body">
        <div class="ref-syntax"><b>🟦 Java版</b><code>${escapeHtml(c.java)}</code></div>
        <div class="ref-syntax"><b>🟩 統合版</b><code>${escapeHtml(c.bedrock)}</code></div>
        <div class="ref-syntax"><b>📝 例</b><code>${escapeHtml(c.example)}</code></div>
        <p class="ref-desc">${c.desc}</p>
      </div>`;
    list.appendChild(det);
  }
}
$("ref-search").addEventListener("input", renderRefList);

// ---------- 書き出し ----------
function updateBadge() {
  const badge = $("cart-badge");
  badge.textContent = state.cart.length;
  badge.classList.toggle("hidden", state.cart.length === 0);
}

function cartItemCommands(item, edition) {
  const tpl = TEMPLATES.find(t => t.id === item.tplId);
  if (!tpl) return [];
  return tpl.blocks(item.params).map(b => b.gen(edition));
}

function renderCart() {
  const list = $("cart-list");
  if (!list) return;
  list.innerHTML = "";
  if (!state.cart.length) {
    list.innerHTML = '<p class="no-result">まだ何も追加されていません。<br>「つくる」タブでコマンドを作って追加してみましょう!</p>';
    $("export-options").classList.add("hidden");
    $("export-text").classList.add("hidden");
    return;
  }
  $("export-options").classList.remove("hidden");
  state.cart.forEach((item, i) => {
    const div = document.createElement("div");
    div.className = "cart-item";
    const cmds = cartItemCommands(item, state.edition);
    div.innerHTML = `
      <div class="cart-item-head">
        <span class="template-icon">${item.icon}</span>
        <b>${item.title}</b>
        <button class="cart-del" title="削除">🗑</button>
      </div>
      <code>${cmds.map(escapeHtml).join("\n")}</code>
      <label class="cart-tick">
        <input type="checkbox" ${item.tick ? "checked" : ""}>
        つねに自動実行する(tick =リピートブロック相当)
      </label>`;
    div.querySelector(".cart-del").addEventListener("click", () => {
      state.cart.splice(i, 1);
      saveCart();
      renderCart();
    });
    div.querySelector(".cart-tick input").addEventListener("change", (e) => {
      item.tick = e.target.checked;
      saveCart();
    });
    list.appendChild(div);
  });
}

function exportItems(edition) {
  return state.cart.map(item => ({
    fnName: item.fnName,
    commands: cartItemCommands(item, edition),
    tick: item.tick,
  }));
}

$("btn-export-mcpack").addEventListener("click", () => {
  if (!state.cart.length) return;
  const packName = $("pack-name").value || "マイコマンド";
  const blob = buildMcpack(packName, exportItems("bedrock"));
  downloadBlob(blob, safeName(packName, "mycommands") + ".mcpack");
  toast("統合版 .mcpack を書き出しました!");
});

$("btn-export-datapack").addEventListener("click", () => {
  if (!state.cart.length) return;
  const packName = $("pack-name").value || "マイコマンド";
  const ns = safeName(packName, "mypack");
  const pf = Number($("pack-format").value) || 71;
  const blob = buildDatapack(packName, ns, exportItems("java"), pf);
  downloadBlob(blob, safeName(packName, "mycommands") + "_datapack.zip");
  toast("Java版データパックを書き出しました!(/function " + ns + ":◯◯ で実行)");
});

$("btn-export-text").addEventListener("click", () => {
  if (!state.cart.length) return;
  const el = $("export-text");
  const edLabel = state.edition === "java" ? "Java版" : "統合版";
  const lines = [`# ${edLabel}のコマンド一覧(ヘッダーの切り替えで変わります)`, ""];
  for (const item of state.cart) {
    lines.push(`# --- ${item.fnName}.mcfunction(${item.title})${item.tick ? " [自動実行]" : ""} ---`);
    lines.push(...cartItemCommands(item, state.edition));
    lines.push("");
  }
  el.textContent = lines.join("\n");
  el.classList.remove("hidden");
});

// ---------- ニュース ----------
$("news-bedrock").addEventListener("click", () => {
  state.newsEdition = "bedrock";
  $("news-bedrock").classList.add("active");
  $("news-java").classList.remove("active");
  loadNews("bedrock");
});
$("news-java").addEventListener("click", () => {
  state.newsEdition = "java";
  $("news-java").classList.add("active");
  $("news-bedrock").classList.remove("active");
  loadNews("java");
});

// ---------- 初期化 ----------
renderTemplateList();
renderRefList();
renderInfoLinks();
updateBadge();

if ("serviceWorker" in navigator && location.protocol === "https:") {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
