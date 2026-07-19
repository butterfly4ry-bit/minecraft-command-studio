// ============================================================
// ニュース:Mojang公式ランチャーのパッチノートを取得して表示
// (launchercontent.mojang.com は CORS 許可されている公式データ)
// 取得できない場合は情報源リンクのみ表示
// ============================================================

const NEWS_SOURCES = {
  java: "https://launchercontent.mojang.com/v2/javaPatchNotes.json",
  bedrock: "https://launchercontent.mojang.com/v2/bedrockPatchNotes.json",
};

const INFO_LINKS = [
  { icon: "🟩", title: "マインクラフト公式ニュース", sub: "minecraft.net(日本語)", url: "https://www.minecraft.net/ja-jp/articles" },
  { icon: "📖", title: "Minecraft Wiki コマンド一覧", sub: "全コマンドの詳しい解説(日本語)", url: "https://ja.minecraft.wiki/w/%E3%82%B3%E3%83%9E%E3%83%B3%E3%83%89" },
  { icon: "🛠", title: "Bedrock Wiki", sub: "統合版のアドオン・コマンド技術情報(英語)", url: "https://wiki.bedrock.dev/" },
  { icon: "💬", title: "Minecraft公式 X(旧Twitter)", sub: "最新情報をいち早くチェック", url: "https://x.com/Minecraft" },
  { icon: "📝", title: "公式フィードバック・パッチノート", sub: "アップデート内容の原文(英語)", url: "https://feedback.minecraft.net/hc/en-us/sections/360001186971" },
];

const newsCache = {};

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

function stripHtml(html) {
  const div = document.createElement("div");
  div.innerHTML = html || "";
  return (div.textContent || "").trim();
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
    const card = document.createElement("div");
    card.className = "news-card";
    const date = e.date ? new Date(e.date).toLocaleDateString("ja-JP") : "";
    const body = stripHtml(e.body).slice(0, 120);
    card.innerHTML = `
      <span class="news-date">${date} ・ ${edLabel}</span>
      <b>${escapeHtml(e.title || "バージョン " + (e.version || ""))}</b>
      <p>${escapeHtml(body)}${body.length >= 120 ? "…" : ""}</p>`;
    listEl.appendChild(card);
  }
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
