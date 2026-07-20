// ============================================================
// ニュース:Mojang公式ランチャーのパッチノートを取得して表示
// (launchercontent.mojang.com は CORS 許可されている公式データ)
// カードをタップすると詳細(公式パッチノート全文)をモーダル表示
// ============================================================

const NEWS_BASE = "https://launchercontent.mojang.com";
const NEWS_SOURCES = {
  java: NEWS_BASE + "/v2/javaPatchNotes.json",
  bedrock: NEWS_BASE + "/v2/bedrockPatchNotes.json",
};

const INFO_LINKS = [
  { icon: "🟩", title: "マインクラフト公式ニュース", sub: "minecraft.net(日本語)", url: "https://www.minecraft.net/ja-jp/articles" },
  { icon: "📖", title: "Minecraft Wiki コマンド一覧", sub: "全コマンドの詳しい解説(日本語)", url: "https://ja.minecraft.wiki/w/%E3%82%B3%E3%83%9E%E3%83%B3%E3%83%89" },
  { icon: "🛠", title: "Bedrock Wiki", sub: "統合版のアドオン・コマンド技術情報(英語)", url: "https://wiki.bedrock.dev/" },
  { icon: "💬", title: "Minecraft公式 X(旧Twitter)", sub: "最新情報をいち早くチェック", url: "https://x.com/Minecraft" },
  { icon: "📝", title: "公式フィードバック・パッチノート", sub: "アップデート内容の原文(英語)", url: "https://feedback.minecraft.net/hc/en-us/sections/360001186971" },
];

const newsCache = {};
const newsDetailCache = {};

async function loadNews(edition) {
  const listEl = document.getElementById("news-list");
  if (newsCache[edition]) {
    renderNews(newsCache[edition], edition);
    return;
  }
  listEl.innerHTML = '<p class="hint">読み込み中…</p>';
  try {
    const res = await fetch(NEWS_SOURCES[edition]);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    const entries = (data.entries || []).slice(0, 15);
    newsCache[edition] = entries;
    renderNews(entries, edition);
  } catch (e) {
    listEl.innerHTML =
      '<p class="hint">⚠️ アップデート情報を取得できませんでした(オフラインの可能性があります)。下の情報源リンクから最新情報をチェックしてください。</p>';
  }
}

function renderNews(entries, edition) {
  const listEl = document.getElementById("news-list");
  if (!entries.length) {
    listEl.innerHTML = '<p class="hint">情報がありません。</p>';
    return;
  }
  listEl.innerHTML = "";
  const edLabel = edition === "java" ? "Java版" : "統合版";
  for (const e of entries) {
    const card = document.createElement("button");
    card.className = "news-card";
    card.type = "button";
    const date = e.date ? new Date(e.date).toLocaleDateString("ja-JP") : "";
    const short = (e.shortText || "").trim().slice(0, 90);
    card.innerHTML = `
      <span class="news-date">${date} ・ ${edLabel}</span>
      <b>${escapeHtml(e.title || "バージョン " + (e.version || ""))}</b>
      ${short ? `<p>${escapeHtml(short)}…</p>` : ""}
      <span class="news-more">▶ タップして詳細を読む</span>`;
    card.addEventListener("click", () => openNewsDetail(e));
    listEl.appendChild(card);
  }
}

// ---------- 詳細モーダル ----------
async function openNewsDetail(entry) {
  const modal = document.getElementById("news-modal");
  const titleEl = document.getElementById("news-modal-title");
  const bodyEl = document.getElementById("news-modal-body");
  titleEl.textContent = entry.title || "詳細";
  bodyEl.innerHTML = '<p class="hint">読み込み中…</p>';
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";

  try {
    let detail = newsDetailCache[entry.id];
    if (!detail) {
      const res = await fetch(NEWS_BASE + "/v2/" + entry.contentPath);
      if (!res.ok) throw new Error("HTTP " + res.status);
      detail = await res.json();
      newsDetailCache[entry.id] = detail;
    }
    bodyEl.innerHTML = "";

    const note = document.createElement("div");
    note.className = "news-lang-note";
    note.textContent = "📜 Mojang公式パッチノート(英語)です。下のボタンで日本語に翻訳できます(無料の簡易翻訳)。長い記事は数分かかりますが、一度訳せばこの端末に保存されて次からは一瞬です。途中で止まってもボタンを押せば続きから再開します。";
    bodyEl.appendChild(note);

    const transBtn = document.createElement("button");
    transBtn.className = "translate-btn";
    transBtn.type = "button";
    bodyEl.appendChild(transBtn);

    if (detail.image && detail.image.url) {
      const img = document.createElement("img");
      img.src = NEWS_BASE + detail.image.url;
      img.alt = detail.image.title || "";
      img.loading = "lazy";
      img.addEventListener("error", () => img.remove());
      bodyEl.appendChild(img);
    }

    bodyEl.appendChild(sanitizeHtml(detail.body || "<p>本文がありません。</p>"));
    setupTranslation(bodyEl, transBtn, entry.id);
    bodyEl.scrollTop = 0;
  } catch (e) {
    bodyEl.innerHTML = '<p class="hint">⚠️ 詳細を読み込めませんでした。通信環境を確認してもう一度試してください。</p>';
  }
}

function closeNewsDetail() {
  document.getElementById("news-modal").classList.add("hidden");
  document.body.style.overflow = "";
}

// 公式データのHTML本文から危険な要素・属性を取り除いて安全に表示する
function sanitizeHtml(html) {
  const tmpl = document.createElement("template");
  tmpl.innerHTML = html;
  const frag = tmpl.content;
  frag.querySelectorAll("script, style, iframe, object, embed, form, link, meta").forEach(el => el.remove());
  frag.querySelectorAll("*").forEach(el => {
    for (const attr of [...el.attributes]) {
      const name = attr.name.toLowerCase();
      const val = String(attr.value || "");
      if (name.startsWith("on") || (name === "href" || name === "src") && val.trim().toLowerCase().startsWith("javascript:")) {
        el.removeAttribute(attr.name);
      }
    }
    // 画像は公式CDNの相対パスを絶対URLへ
    if (el.tagName === "IMG" && el.getAttribute("src") && el.getAttribute("src").startsWith("/")) {
      el.src = NEWS_BASE + el.getAttribute("src");
    }
    if (el.tagName === "A") {
      el.target = "_blank";
      el.rel = "noopener";
    }
  });
  // 中身が空のリスト項目・段落を除去(先頭の「・」だけの行など)
  frag.querySelectorAll("li, p").forEach(el => {
    if (!el.textContent.trim() && !el.querySelector("img")) el.remove();
  });
  frag.querySelectorAll("ul, ol").forEach(el => {
    if (!el.children.length) el.remove();
  });
  frag.querySelectorAll("img").forEach(img => {
    img.addEventListener("error", () => {
      const item = img.closest("li, p");
      img.remove();
      if (item && !item.textContent.trim() && !item.querySelector("img")) item.remove();
    });
  });
  const wrap = document.createElement("div");
  wrap.appendChild(frag);
  return wrap;
}

// ---------- 日本語翻訳(キー不要の無料翻訳サービスを利用) ----------
// 訳文は端末(localStorage)に保存し、一度訳した記事は二度と通信しない
const newsTranslationCache = (() => {
  try { return JSON.parse(localStorage.getItem("newsTransStore") || "{}"); }
  catch (e) { return {}; }
})();

function saveTransStore() {
  try {
    // 新しい8記事分だけ保存(容量対策)
    const ids = Object.keys(newsTranslationCache)
      .sort((a, b) => (newsTranslationCache[b].ts || 0) - (newsTranslationCache[a].ts || 0))
      .slice(0, 8);
    const slim = {};
    for (const id of ids) slim[id] = newsTranslationCache[id];
    localStorage.setItem("newsTransStore", JSON.stringify(slim));
  } catch (e) { /* 容量オーバー時は保存しない */ }
}

function translatableBlocks(bodyEl) {
  return [...bodyEl.querySelectorAll("p, li, h1, h2, h3, h4")]
    .filter(el => !el.closest(".news-lang-note") && el.textContent.trim());
}

// 8秒であきらめて次のサービスに切り替えるfetch
async function fetchWithTimeout(url, ms = 8000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

// 翻訳サービスのリスト。上から順に試し、成功したものを次回も優先する
const TRANSLATE_PROVIDERS = [
  {
    name: "google",
    async translate(text) {
      const res = await fetchWithTimeout(
        "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ja&dt=t&q=" +
          encodeURIComponent(text)
      );
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      const out = (data[0] || []).map(seg => (seg && seg[0]) || "").join("");
      if (!out) throw new Error("empty");
      return out;
    },
  },
  {
    name: "lingva",
    async translate(text) {
      let lastErr;
      for (const host of ["lingva.ml", "translate.plausibility.cloud"]) {
        try {
          const res = await fetchWithTimeout(
            `https://${host}/api/v1/en/ja/${encodeURIComponent(text)}`, 25000
          );
          if (!res.ok) throw new Error("HTTP " + res.status);
          const data = await res.json();
          if (data.translation) return data.translation;
          throw new Error("no translation");
        } catch (e) { lastErr = e; }
      }
      throw lastErr;
    },
  },
  {
    name: "mymemory",
    async translate(text) {
      // 1回500文字までの制限があるため、文単位で分割して順に翻訳
      const chunks = [];
      let buf = "";
      for (const line of text.split("\n")) {
        if ((buf + "\n" + line).length > 450 && buf) { chunks.push(buf); buf = line; }
        else buf = buf ? buf + "\n" + line : line;
      }
      if (buf) chunks.push(buf);
      const out = [];
      for (const c of chunks) {
        const res = await fetchWithTimeout(
          "https://api.mymemory.translated.net/get?langpair=en%7Cja&q=" + encodeURIComponent(c)
        );
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = await res.json();
        const t = data.responseData && data.responseData.translatedText;
        if (!t || data.responseStatus !== 200) throw new Error("mymemory error");
        out.push(t);
      }
      return out.join("\n");
    },
  },
];

let preferredProvider = 0; // 前回成功したサービスを覚えておく

async function fetchTranslation(text) {
  let lastErr;
  for (let i = 0; i < TRANSLATE_PROVIDERS.length; i++) {
    const idx = (preferredProvider + i) % TRANSLATE_PROVIDERS.length;
    try {
      const result = await TRANSLATE_PROVIDERS[idx].translate(text);
      preferredProvider = idx;
      return result;
    } catch (e) { lastErr = e; }
  }
  throw lastErr;
}

// 複数ブロックを改行区切りでまとめて翻訳し、行数が一致すれば割り当てる
async function translateBatch(texts) {
  const joined = texts.map(t => t.replace(/\s*\n\s*/g, " ")).join("\n");
  const result = await fetchTranslation(joined);
  const lines = result.split("\n").map(s => s.trim());
  if (lines.length === texts.length) return lines;
  const out = [];
  for (const t of texts) out.push(await fetchTranslation(t));
  return out;
}

function setupTranslation(bodyEl, btn, entryId) {
  let showingJa = false;
  const blocks = translatableBlocks(bodyEl);
  blocks.forEach(el => { el.dataset.origHtml = el.innerHTML; });

  // 訳文と進み具合を記事ごとに保持(失敗しても途中から再開できる)
  const state = newsTranslationCache[entryId] ||
    (newsTranslationCache[entryId] = { arr: [], done: 0, complete: false });
  state.ts = Date.now();

  const apply = () => {
    blocks.forEach((el, i) => {
      if (showingJa && state.arr[i] != null) el.textContent = state.arr[i];
      else el.innerHTML = el.dataset.origHtml;
    });
    btn.textContent = showingJa ? "🔤 原文(英語)に戻す" : "🇯🇵 日本語に翻訳する";
    btn.disabled = false;
  };

  btn.addEventListener("click", async () => {
    if (showingJa) { showingJa = false; apply(); return; }
    if (state.complete) { showingJa = true; apply(); return; }

    btn.disabled = true;
    const texts = blocks.map(el => el.textContent.trim());
    btn.textContent = "翻訳中… " + Math.round((state.done / texts.length) * 100) + "%";
    try {
      // 約1200文字・最大25ブロックずつのまとまりに分割
      const batches = [];
      let s = state.done;
      while (s < texts.length) {
        let end = s, size = 0;
        while (end < texts.length && size + texts[end].length < 1200 && end - s < 25) {
          size += texts[end].length + 1;
          end++;
        }
        if (end === s) end = s + 1;
        batches.push([s, end]);
        s = end;
      }

      // 3並列で翻訳し、先頭から順に確定させていく(途中失敗でも再開可能)
      const results = new Array(batches.length);
      let nextBatch = 0;
      let confirmed = 0;
      let failed = false;
      const worker = async () => {
        while (!failed) {
          const i = nextBatch++;
          if (i >= batches.length) return;
          const [a, b] = batches[i];
          // 失敗したら間隔を空けながら最大3回試す(流量制限対策)
          let ok = false, lastErr;
          for (const waitMs of [0, 2500, 7000]) {
            if (waitMs) await new Promise(r => setTimeout(r, waitMs));
            try {
              results[i] = await translateBatch(texts.slice(a, b));
              ok = true;
              break;
            } catch (e) { lastErr = e; }
          }
          if (!ok) {
            failed = true;
            throw lastErr;
          }
          // サービスに負荷をかけないよう、次のまとまりまで少し待つ
          await new Promise(r => setTimeout(r, 700));
          while (confirmed < batches.length && results[confirmed]) {
            const [ca, cb] = batches[confirmed];
            for (let k = 0; k < results[confirmed].length; k++) state.arr[ca + k] = results[confirmed][k];
            state.done = cb;
            confirmed++;
          }
          btn.textContent = "翻訳中… " + Math.round((state.done / texts.length) * 100) + "%";
        }
      };
      // 流量制限を避けるため1本ずつ順番に処理
      await worker();

      state.complete = true;
      saveTransStore();
      showingJa = true;
      apply();
    } catch (e) {
      // 途中まで訳せた分は表示・保存し、続きから再開できるようにする
      saveTransStore();
      showingJa = state.done > 0;
      apply();
      btn.textContent = state.done > 0
        ? "⚠️ 途中で止まりました(タップで続きから再開)"
        : "⚠️ 翻訳サービスに接続できませんでした(タップで再試行)";
      if (showingJa) showingJa = false; // 次のタップで再開処理に入るよう戻す
    }
  });

  apply();
}

function renderInfoLinks() {
  const el = document.getElementById("news-links");
  el.innerHTML = "";
  for (const l of INFO_LINKS) {
    const a = document.createElement("a");
    a.className = "news-link";
    a.href = l.url;
    a.target = "_blank";
    a.rel = "noopener";
    a.innerHTML = `<span class="template-icon">${l.icon}</span><span><b>${escapeHtml(l.title)}</b><small>${escapeHtml(l.sub)}</small></span><span class="arrow">›</span>`;
    el.appendChild(a);
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// モーダルの閉じる操作
document.getElementById("news-modal-close").addEventListener("click", closeNewsDetail);
document.getElementById("news-modal").addEventListener("click", (e) => {
  if (e.target === document.getElementById("news-modal")) closeNewsDetail();
});
