// ============================================================
// ZIP書き出し(無圧縮/store方式・依存ライブラリなし)
// .mcpack(統合版ビヘイビアーパック)と データパックzip(Java版)を生成
// ============================================================

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c >>> 0;
  }
  return t;
})();

function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// files: [{ name: "path/in/zip.txt", text: "内容" }]
function buildZip(files) {
  const enc = new TextEncoder();
  const chunks = [];
  const central = [];
  let offset = 0;

  for (const f of files) {
    const nameBytes = enc.encode(f.name);
    const data = enc.encode(f.text);
    const crc = crc32(data);

    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);          // version needed
    local.setUint16(6, 0x0800, true);      // UTF-8ファイル名フラグ
    local.setUint16(8, 0, true);           // 無圧縮
    local.setUint16(10, 0, true);          // 時刻
    local.setUint16(12, 0x5821, true);     // 日付(適当な固定値)
    local.setUint32(14, crc, true);
    local.setUint32(18, data.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, nameBytes.length, true);
    local.setUint16(28, 0, true);

    chunks.push(new Uint8Array(local.buffer), nameBytes, data);

    const cd = new DataView(new ArrayBuffer(46));
    cd.setUint32(0, 0x02014b50, true);
    cd.setUint16(4, 20, true);
    cd.setUint16(6, 20, true);
    cd.setUint16(8, 0x0800, true);
    cd.setUint16(10, 0, true);
    cd.setUint16(12, 0, true);
    cd.setUint16(14, 0x5821, true);
    cd.setUint32(16, crc, true);
    cd.setUint32(20, data.length, true);
    cd.setUint32(24, data.length, true);
    cd.setUint16(28, nameBytes.length, true);
    cd.setUint32(42, offset, true);
    central.push(new Uint8Array(cd.buffer), nameBytes);

    offset += 30 + nameBytes.length + data.length;
  }

  let cdSize = 0;
  for (const c of central) cdSize += c.length;

  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, cdSize, true);
  end.setUint32(16, offset, true);

  return new Blob([...chunks, ...central, new Uint8Array(end.buffer)], { type: "application/zip" });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

function uuid() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0;
        return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
      });
}

// 半角英数の安全なファイル名に変換
function safeName(s, fallback) {
  const cleaned = (s || "").replace(/[^a-zA-Z0-9_\-]/g, "").toLowerCase();
  return cleaned || fallback;
}

// ---------- 統合版 .mcpack ----------
// items: [{ fnName, commands: [..], tick: bool }]
function buildMcpack(packName, items) {
  const files = [];
  files.push({
    name: "manifest.json",
    text: JSON.stringify({
      format_version: 2,
      header: {
        name: packName,
        description: "マイクラコマンド工房で作成したコマンド集",
        uuid: uuid(),
        version: [1, 0, 0],
        min_engine_version: [1, 21, 0],
      },
      modules: [{ type: "data", uuid: uuid(), version: [1, 0, 0] }],
    }, null, 2),
  });

  const tickFns = [];
  for (const it of items) {
    files.push({ name: `functions/${it.fnName}.mcfunction`, text: it.commands.join("\n") + "\n" });
    if (it.tick) tickFns.push(it.fnName);
  }
  if (tickFns.length) {
    files.push({ name: "functions/tick.json", text: JSON.stringify({ values: tickFns }, null, 2) });
  }
  return buildZip(files);
}

// ---------- Java版 データパック ----------
function buildDatapack(packName, nsRaw, items, packFormat) {
  const ns = safeName(nsRaw, "mypack");
  const files = [];
  files.push({
    name: "pack.mcmeta",
    text: JSON.stringify({
      pack: { pack_format: packFormat, description: packName + "(マイクラコマンド工房)" },
    }, null, 2),
  });

  const tickFns = [];
  for (const it of items) {
    files.push({ name: `data/${ns}/function/${it.fnName}.mcfunction`, text: it.commands.join("\n") + "\n" });
    if (it.tick) tickFns.push(`${ns}:${it.fnName}`);
  }
  if (tickFns.length) {
    files.push({
      name: "data/minecraft/tags/function/tick.json",
      text: JSON.stringify({ values: tickFns }, null, 2),
    });
  }
  return buildZip(files);
}
