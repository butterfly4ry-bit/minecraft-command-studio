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
    note.textContent = "📜 Mojang公式パッチノート(英語)です。下のボタンで日本語に翻訳できます(無料の簡易翻訳のため、少し変な日本語になることがあります)。";
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
const newsTranslationCache = {}; // entryId → 訳文の配列

function translatableBlocks(bodyEl) {
  return [...bodyEl.querySelectorAll("p, li, h1, h2, h3, h4")]
    .filter(el => !el.closest(".news-lang-note") && el.textContent.trim());
}

async function fetchTranslation(text) {
  const res = await fetch("https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ja&dt=t", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: "q=" + encodeURIComponent(text),
  });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const data = await res.json();
  return (data[0] || []).map(seg => (seg && seg[0]) || "").join("");
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

  const apply = () => {
    const cache = newsTranslationCache[entryId];
    blocks.forEach((el, i) => {
      if (showingJa && cache && cache[i] != null) el.textContent = cache[i];
      else el.innerHTML = el.dataset.origHtml;
    });
    btn.textContent = showingJa ? "🔤 原文(英語)に戻す" : "🇯🇵 日本語に翻訳する";
    btn.disabled = false;
  };

  btn.addEventListener("click", async () => {
    if (showingJa) { showingJa = false; apply(); return; }
    if (newsTranslationCache[entryId]) { showingJa = true; apply(); return; }

    btn.disabled = true;
    btn.textContent = "翻訳中… 0%";
    try {
      const texts = blocks.map(el => el.textContent.trim());
      const translated = new Array(texts.length);
      let start = 0;
      while (start < texts.length) {
        // 約1200文字・最大20ブロックずつまとめて翻訳
        let end = start, size = 0;
        while (end < texts.length && size + texts[end].length < 1200 && end - start < 20) {
          size += texts[end].length + 1;
          end++;
        }
        if (end === start) end = start + 1;
        const part = await translateBatch(texts.slice(start, end));
        for (let i = 0; i < part.length; i++) translated[start + i] = part[i];
        btn.textContent = "翻訳中… " + Math.round((end / texts.length) * 100) + "%";
        start = end;
      }
      newsTranslationCache[entryId] = translated;
      showingJa = true;
      apply();
    } catch (e) {
      btn.disabled = false;
      btn.textContent = "⚠️ 翻訳サービスに接続できませんでした(タップで再試行)";
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
