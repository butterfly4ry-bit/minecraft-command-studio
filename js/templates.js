// ============================================================
// コマンドテンプレートデータ
// 各テンプレート: やりたいこと → コマンドブロックの並び(図解)を生成
// gen(p, ed) — p: パラメータ値, ed: 'bedrock' | 'java'
// ============================================================

const TARGETS = [
  { id: "@p", ja: "いちばん近くのプレイヤー (@p)" },
  { id: "@a", ja: "全プレイヤー (@a)" },
  { id: "@s", ja: "実行した本人 (@s)" },
  { id: "@r", ja: "ランダムなプレイヤー (@r)" },
  { id: "@e", ja: "すべてのエンティティ (@e)" },
];

// bedrock:false のエフェクトは統合版に存在しない
const EFFECTS = [
  { id: "speed", ja: "移動速度上昇", bedrock: true },
  { id: "slowness", ja: "移動速度低下", bedrock: true },
  { id: "jump_boost", ja: "跳躍力上昇", bedrock: true },
  { id: "regeneration", ja: "再生能力", bedrock: true },
  { id: "instant_health", ja: "即時回復", bedrock: true },
  { id: "fire_resistance", ja: "火炎耐性", bedrock: true },
  { id: "water_breathing", ja: "水中呼吸", bedrock: true },
  { id: "invisibility", ja: "透明化", bedrock: true },
  { id: "night_vision", ja: "暗視", bedrock: true },
  { id: "strength", ja: "攻撃力上昇", bedrock: true },
  { id: "poison", ja: "毒", bedrock: true },
  { id: "levitation", ja: "浮遊", bedrock: true },
  { id: "glowing", ja: "発光(Java版のみ)", bedrock: false },
  { id: "absorption", ja: "衝撃吸収", bedrock: true },
];

const ITEMS = [
  { id: "diamond", ja: "ダイヤモンド" },
  { id: "diamond_sword", ja: "ダイヤの剣" },
  { id: "netherite_ingot", ja: "ネザライトインゴット" },
  { id: "golden_apple", ja: "金のリンゴ" },
  { id: "enchanted_golden_apple", ja: "エンチャントされた金のリンゴ" },
  { id: "elytra", ja: "エリトラ" },
  { id: "totem_of_undying", ja: "不死のトーテム" },
  { id: "emerald", ja: "エメラルド" },
  { id: "iron_ingot", ja: "鉄インゴット" },
  { id: "bread", ja: "パン" },
  { id: "cooked_beef", ja: "ステーキ" },
  { id: "bow", ja: "弓" },
  { id: "arrow", ja: "矢" },
  { id: "ender_pearl", ja: "エンダーパール" },
  { id: "tnt", ja: "TNT" },
];

const MOBS = [
  { id: "zombie", ja: "ゾンビ" },
  { id: "skeleton", ja: "スケルトン" },
  { id: "creeper", ja: "クリーパー" },
  { id: "spider", ja: "クモ" },
  { id: "enderman", ja: "エンダーマン" },
  { id: "villager", ja: "村人" },
  { id: "iron_golem", ja: "アイアンゴーレム" },
  { id: "wolf", ja: "オオカミ" },
  { id: "cat", ja: "ネコ" },
  { id: "horse", ja: "ウマ" },
  { id: "cow", ja: "ウシ" },
  { id: "pig", ja: "ブタ" },
  { id: "sheep", ja: "ヒツジ" },
  { id: "chicken", ja: "ニワトリ" },
  { id: "lightning_bolt", ja: "カミナリ" },
];

const BLOCKS = [
  { id: "stone", ja: "石" },
  { id: "grass_block", ja: "草ブロック" },
  { id: "glass", ja: "ガラス" },
  { id: "oak_planks", ja: "オークの板材" },
  { id: "diamond_block", ja: "ダイヤモンドブロック" },
  { id: "gold_block", ja: "金ブロック" },
  { id: "emerald_block", ja: "エメラルドブロック" },
  { id: "obsidian", ja: "黒曜石" },
  { id: "water", ja: "水" },
  { id: "lava", ja: "溶岩" },
  { id: "air", ja: "空気(消す)" },
];

const TITLE_COLORS = [
  { id: "white", ja: "白" },
  { id: "gold", ja: "金色" },
  { id: "red", ja: "赤" },
  { id: "aqua", ja: "水色" },
  { id: "green", ja: "緑" },
  { id: "light_purple", ja: "ピンク" },
  { id: "yellow", ja: "黄色" },
];

const PARTICLES = [
  { ja: "ハート", java: "minecraft:heart", bedrock: "minecraft:heart_particle" },
  { ja: "村人の怒り", java: "minecraft:angry_villager", bedrock: "minecraft:villager_angry" },
  { ja: "村人のハッピー", java: "minecraft:happy_villager", bedrock: "minecraft:villager_happy" },
  { ja: "爆発", java: "minecraft:explosion", bedrock: "minecraft:explosion_particle" },
  { ja: "炎", java: "minecraft:flame", bedrock: "minecraft:basic_flame_particle" },
];

const SOUNDS = [
  { ja: "レベルアップ音", java: "minecraft:entity.player.levelup", bedrock: "random.levelup" },
  { ja: "爆発音", java: "minecraft:entity.generic.explode", bedrock: "random.explode" },
  { ja: "金床の音", java: "minecraft:block.anvil.use", bedrock: "random.anvil_use" },
  { ja: "エンダーマンのテレポート音", java: "minecraft:entity.enderman.teleport", bedrock: "mob.endermen.portal" },
  { ja: "雷の音", java: "minecraft:entity.lightning_bolt.thunder", bedrock: "ambient.weather.thunder" },
];

// セレクタ表記: 距離指定はJava版 distance=..5 / 統合版 r=5
function nearSelector(type, radius, ed) {
  return ed === "java"
    ? `@e[type=minecraft:${type},distance=..${radius}]`
    : `@e[type=${type},r=${radius}]`;
}

function jsonText(text, color) {
  return JSON.stringify({ text: text, color: color });
}

const TEMPLATES = [
  {
    id: "effect",
    icon: "✨",
    title: "エフェクト(効果)を付与する",
    desc: "プレイヤーやモブにポーション効果を付けます。暗視・スピード・透明化など。",
    keywords: ["エフェクト", "効果", "発光", "暗視", "スピード", "速く", "透明", "毒", "回復", "浮遊", "ポーション", "バフ", "ひかる", "光る"],
    params: [
      { key: "target", label: "だれに?", type: "select", options: TARGETS.map(t => ({ v: t.id, ja: t.ja })), def: "@a" },
      { key: "effect", label: "どの効果?", type: "select", options: EFFECTS.map(e => ({ v: e.id, ja: e.ja })), def: "night_vision" },
      { key: "seconds", label: "何秒間?", type: "number", def: 30, min: 1, max: 1000000 },
      { key: "level", label: "強さ(レベル)", type: "number", def: 1, min: 1, max: 255 },
      { key: "hide", label: "モヤモヤ(パーティクル)を隠す", type: "check", def: true },
      { key: "always", label: "ずっと付与し続ける(リピート)", type: "check", def: false },
    ],
    editionNote: p => {
      const ef = EFFECTS.find(e => e.id === p.effect);
      return ef && !ef.bedrock ? "「発光」は統合版には存在しないエフェクトです。統合版で似たことをしたい場合は暗視などで代用してください。" : "";
    },
    blocks: p => [{
      type: p.always ? "repeat" : "impulse",
      note: p.always ? "リピートブロックで効果が切れないように付与し続けます" : "ボタンやレバーで1回だけ実行します",
      gen: (ed) => ed === "java"
        ? `effect give ${p.target} minecraft:${p.effect} ${p.seconds} ${p.level - 1} ${p.hide}`
        : `effect ${p.target} ${p.effect} ${p.seconds} ${p.level - 1} ${p.hide}`,
    }],
  },
  {
    id: "tp",
    icon: "🌀",
    title: "テレポートさせる",
    desc: "指定した座標にプレイヤーをテレポートさせます。",
    keywords: ["テレポート", "tp", "移動", "ワープ", "飛ぶ", "座標"],
    params: [
      { key: "target", label: "だれを?", type: "select", options: TARGETS.map(t => ({ v: t.id, ja: t.ja })), def: "@p" },
      { key: "x", label: "X座標", type: "text", def: "100" },
      { key: "y", label: "Y座標", type: "text", def: "64" },
      { key: "z", label: "Z座標", type: "text", def: "100" },
    ],
    blocks: p => [{
      type: "impulse",
      note: "「~」を使うと今いる場所からの相対座標になります(例: ~ ~10 ~ で10ブロック上へ)",
      gen: () => `tp ${p.target} ${p.x} ${p.y} ${p.z}`,
    }],
  },
  {
    id: "give",
    icon: "🎁",
    title: "アイテムをあげる",
    desc: "プレイヤーにアイテムを渡します。",
    keywords: ["アイテム", "give", "あげる", "もらう", "ダイヤ", "剣", "配布", "プレゼント"],
    params: [
      { key: "target", label: "だれに?", type: "select", options: TARGETS.filter(t => t.id !== "@e").map(t => ({ v: t.id, ja: t.ja })), def: "@p" },
      { key: "item", label: "どのアイテム?", type: "select", options: ITEMS.map(i => ({ v: i.id, ja: i.ja })), def: "diamond" },
      { key: "count", label: "いくつ?", type: "number", def: 1, min: 1, max: 6400 },
    ],
    blocks: p => [{
      type: "impulse",
      note: "ボタンを押したらアイテムがもらえる「配布ボタン」などに使えます",
      gen: (ed) => ed === "java"
        ? `give ${p.target} minecraft:${p.item} ${p.count}`
        : `give ${p.target} ${p.item} ${p.count}`,
    }],
  },
  {
    id: "summon",
    icon: "🐷",
    title: "モブ(生き物)を召喚する",
    desc: "指定した場所にモブを出現させます。",
    keywords: ["召喚", "summon", "モブ", "スポーン", "出す", "ゾンビ", "生き物", "動物", "雷", "カミナリ"],
    params: [
      { key: "mob", label: "どのモブ?", type: "select", options: MOBS.map(m => ({ v: m.id, ja: m.ja })), def: "zombie" },
      { key: "count", label: "何体?", type: "number", def: 1, min: 1, max: 30 },
    ],
    blocks: p => {
      const n = Math.min(Math.max(1, p.count | 0), 30);
      const arr = [{
        type: "impulse",
        note: n > 1 ? `${n}体出すため、インパルス1つ+チェーン${n - 1}つで繋げます` : "コマンドブロックの上に召喚されます",
        gen: (ed) => ed === "java" ? `summon minecraft:${p.mob} ~ ~1 ~` : `summon ${p.mob} ~ ~1 ~`,
      }];
      for (let i = 1; i < n; i++) {
        arr.push({
          type: "chain",
          gen: (ed) => ed === "java" ? `summon minecraft:${p.mob} ~ ~1 ~` : `summon ${p.mob} ~ ~1 ~`,
        });
      }
      return arr;
    },
  },
  {
    id: "time",
    icon: "🌙",
    title: "時間を変える(朝・夜など)",
    desc: "ワールドの時間を朝・昼・夜などに変更します。",
    keywords: ["時間", "time", "夜", "朝", "昼", "夕方", "真夜中"],
    params: [
      { key: "time", label: "いつにする?", type: "select", options: [
        { v: "day", ja: "朝(day)" },
        { v: "noon", ja: "昼(noon)" },
        { v: "sunset", ja: "夕方(sunset)" },
        { v: "night", ja: "夜(night)" },
        { v: "midnight", ja: "真夜中(midnight)" },
      ], def: "night" },
    ],
    blocks: p => [{
      type: "impulse",
      gen: () => `time set ${p.time}`,
    }],
  },
  {
    id: "weather",
    icon: "🌧",
    title: "天気を変える",
    desc: "晴れ・雨・雷雨に天気を変更します。",
    keywords: ["天気", "weather", "雨", "晴れ", "雷", "雷雨", "嵐"],
    params: [
      { key: "weather", label: "どの天気?", type: "select", options: [
        { v: "clear", ja: "晴れ(clear)" },
        { v: "rain", ja: "雨(rain)" },
        { v: "thunder", ja: "雷雨(thunder)" },
      ], def: "clear" },
    ],
    blocks: p => [{
      type: "impulse",
      gen: () => `weather ${p.weather}`,
    }],
  },
  {
    id: "title",
    icon: "💬",
    title: "画面に大きな文字を出す",
    desc: "全員の画面中央にタイトル文字を表示します。",
    keywords: ["タイトル", "title", "文字", "メッセージ", "表示", "テロップ", "字幕"],
    params: [
      { key: "text", label: "表示する文字", type: "text", def: "ようこそ!" },
      { key: "color", label: "文字の色", type: "select", options: TITLE_COLORS.map(c => ({ v: c.id, ja: c.ja })), def: "gold" },
      { key: "target", label: "だれに見せる?", type: "select", options: TARGETS.filter(t => t.id !== "@e").map(t => ({ v: t.id, ja: t.ja })), def: "@a" },
    ],
    editionNote: () => "Java版は文字をJSON形式で書く必要があります(自動で変換済み)。統合版はそのまま文字を書けます(色を付けるには§コードを使います)。",
    blocks: p => [{
      type: "impulse",
      gen: (ed) => ed === "java"
        ? `title ${p.target} title ${jsonText(p.text, p.color)}`
        : `title ${p.target} title ${p.text}`,
    }],
  },
  {
    id: "particle",
    icon: "🎇",
    title: "パーティクル(粒)を出す",
    desc: "ハートや炎などのパーティクルを表示します。",
    keywords: ["パーティクル", "particle", "ハート", "エフェクト", "演出", "粒"],
    params: [
      { key: "particle", label: "どのパーティクル?", type: "select", options: PARTICLES.map((pt, i) => ({ v: String(i), ja: pt.ja })), def: "0" },
      { key: "always", label: "出し続ける(リピート)", type: "check", def: true },
    ],
    editionNote: () => "パーティクルの名前は統合版とJava版で違います(自動で切り替え済み)。",
    blocks: p => [{
      type: p.always ? "repeat" : "impulse",
      note: "コマンドブロックの1ブロック上に表示されます",
      gen: (ed) => {
        const pt = PARTICLES[p.particle | 0];
        return ed === "java"
          ? `particle ${pt.java} ~ ~1 ~ 0.3 0.3 0.3 0 5`
          : `particle ${pt.bedrock} ~ ~1 ~`;
      },
    }],
  },
  {
    id: "playsound",
    icon: "🔊",
    title: "音を鳴らす",
    desc: "効果音をプレイヤーに聞かせます。",
    keywords: ["音", "サウンド", "playsound", "効果音", "鳴らす", "SE"],
    params: [
      { key: "sound", label: "どの音?", type: "select", options: SOUNDS.map((s, i) => ({ v: String(i), ja: s.ja })), def: "0" },
      { key: "target", label: "だれに聞かせる?", type: "select", options: TARGETS.filter(t => t.id !== "@e").map(t => ({ v: t.id, ja: t.ja })), def: "@a" },
    ],
    editionNote: () => "音の名前は統合版とJava版で違います(自動で切り替え済み)。",
    blocks: p => [{
      type: "impulse",
      gen: (ed) => {
        const s = SOUNDS[p.sound | 0];
        return ed === "java"
          ? `playsound ${s.java} master ${p.target}`
          : `playsound ${s.bedrock} ${p.target}`;
      },
    }],
  },
  {
    id: "gamemode",
    icon: "🎮",
    title: "ゲームモードを変える",
    desc: "サバイバル・クリエイティブなどに切り替えます。",
    keywords: ["ゲームモード", "gamemode", "クリエイティブ", "サバイバル", "アドベンチャー", "スペクテイター"],
    params: [
      { key: "mode", label: "どのモード?", type: "select", options: [
        { v: "survival", ja: "サバイバル" },
        { v: "creative", ja: "クリエイティブ" },
        { v: "adventure", ja: "アドベンチャー" },
        { v: "spectator", ja: "スペクテイター" },
      ], def: "creative" },
      { key: "target", label: "だれの?", type: "select", options: TARGETS.filter(t => t.id !== "@e").map(t => ({ v: t.id, ja: t.ja })), def: "@p" },
    ],
    blocks: p => [{
      type: "impulse",
      gen: () => `gamemode ${p.mode} ${p.target}`,
    }],
  },
  {
    id: "keepinv",
    icon: "🛡",
    title: "死んでもアイテムを落とさない",
    desc: "keepInventory をONにして、死んでもインベントリを保持します。",
    keywords: ["キープインベントリ", "keepinventory", "死んでも", "アイテム", "落とさない", "ロスト", "ゲームルール"],
    params: [
      { key: "on", label: "ONにする", type: "check", def: true },
    ],
    blocks: p => [{
      type: "impulse",
      note: "チャットで1回実行するだけでもOKです",
      gen: () => `gamerule keepInventory ${p.on}`,
    }],
  },
  {
    id: "setblock",
    icon: "🧱",
    title: "ブロックを置く",
    desc: "指定した座標にブロックを設置します。",
    keywords: ["ブロック", "setblock", "置く", "設置", "建築"],
    params: [
      { key: "block", label: "どのブロック?", type: "select", options: BLOCKS.map(b => ({ v: b.id, ja: b.ja })), def: "diamond_block" },
      { key: "x", label: "X座標", type: "text", def: "~" },
      { key: "y", label: "Y座標", type: "text", def: "~2" },
      { key: "z", label: "Z座標", type: "text", def: "~" },
    ],
    blocks: p => [{
      type: "impulse",
      gen: () => `setblock ${p.x} ${p.y} ${p.z} ${p.block}`,
    }],
  },
  {
    id: "fill",
    icon: "🏗",
    title: "範囲をブロックで埋める",
    desc: "2つの座標の間をまとめてブロックで埋めます。整地にも使えます。",
    keywords: ["fill", "埋める", "整地", "まとめて", "範囲", "壊す", "消す"],
    params: [
      { key: "block", label: "どのブロック?", type: "select", options: BLOCKS.map(b => ({ v: b.id, ja: b.ja })), def: "glass" },
      { key: "from", label: "角の座標①(x y z)", type: "text", def: "~ ~ ~" },
      { key: "to", label: "角の座標②(x y z)", type: "text", def: "~10 ~5 ~10" },
    ],
    blocks: p => [{
      type: "impulse",
      note: "「空気」を選ぶと範囲のブロックを消せます(整地)",
      gen: () => `fill ${p.from} ${p.to} ${p.block}`,
    }],
  },
  {
    id: "score",
    icon: "🏆",
    title: "スコアボードを作って表示する",
    desc: "ポイント計測用のスコアボードを作成し、画面横に表示します。",
    keywords: ["スコア", "scoreboard", "ポイント", "点数", "ランキング", "表示"],
    params: [
      { key: "name", label: "スコア名(半角英数)", type: "text", def: "point" },
      { key: "display", label: "表示名", type: "text", def: "ポイント" },
    ],
    blocks: p => [
      {
        type: "impulse",
        note: "①スコアボードを作成",
        gen: (ed) => ed === "java"
          ? `scoreboard objectives add ${p.name} dummy ${jsonText(p.display, "white")}`
          : `scoreboard objectives add ${p.name} dummy ${p.display}`,
      },
      {
        type: "chain",
        note: "②画面の横に表示",
        gen: () => `scoreboard objectives setdisplay sidebar ${p.name}`,
      },
    ],
  },
  {
    id: "kill",
    icon: "💀",
    title: "モブやエンティティを消す",
    desc: "指定した種類のモブをすべて消します。",
    keywords: ["kill", "キル", "消す", "倒す", "退治", "削除", "アイテム掃除"],
    params: [
      { key: "what", label: "何を消す?", type: "select", options: [
        { v: "item", ja: "落ちているアイテム(掃除)" },
        ...MOBS.filter(m => m.id !== "lightning_bolt").map(m => ({ v: m.id, ja: m.ja })),
      ], def: "item" },
    ],
    blocks: p => [{
      type: "impulse",
      gen: (ed) => ed === "java"
        ? `kill @e[type=minecraft:${p.what}]`
        : `kill @e[type=${p.what}]`,
    }],
  },
  {
    id: "clear",
    icon: "🧹",
    title: "持ち物を空にする",
    desc: "プレイヤーのインベントリからアイテムを消します。",
    keywords: ["clear", "クリア", "持ち物", "インベントリ", "空", "没収"],
    params: [
      { key: "target", label: "だれの?", type: "select", options: TARGETS.filter(t => t.id !== "@e").map(t => ({ v: t.id, ja: t.ja })), def: "@p" },
    ],
    blocks: p => [{
      type: "impulse",
      gen: () => `clear ${p.target}`,
    }],
  },
  {
    id: "near-detect",
    icon: "📡",
    title: "モブが近づいたら〇〇する",
    desc: "指定モブがプレイヤーの近くに来たら、自動でコマンドを実行します。",
    keywords: ["近づいたら", "検知", "センサー", "自動", "execute", "来たら", "反応"],
    params: [
      { key: "mob", label: "どのモブを検知?", type: "select", options: MOBS.filter(m => m.id !== "lightning_bolt").map(m => ({ v: m.id, ja: m.ja })), def: "zombie" },
      { key: "radius", label: "何ブロック以内?", type: "number", def: 5, min: 1, max: 100 },
      { key: "action", label: "何をする?", type: "select", options: [
        { v: "title", ja: "画面に警告を表示" },
        { v: "sound", ja: "警告音を鳴らす" },
        { v: "glow_self", ja: "自分にスピードを付与(逃げる用)" },
      ], def: "title" },
    ],
    editionNote: () => "距離の書き方がエディションで違います:Java版は distance=..5、統合版は r=5(自動で切り替え済み)。",
    blocks: p => [{
      type: "repeat",
      note: "リピートブロックで常にチェックし続けます(常時実行ON)",
      gen: (ed) => {
        const sel = nearSelector(p.mob, p.radius, ed);
        let run;
        if (p.action === "title") {
          run = ed === "java" ? `title @s actionbar ${jsonText("ちかくに敵がいる!", "red")}` : `title @s actionbar §cちかくに敵がいる!`;
        } else if (p.action === "sound") {
          run = ed === "java" ? `playsound minecraft:block.note_block.pling master @s` : `playsound note.pling @s`;
        } else {
          run = ed === "java" ? `effect give @s minecraft:speed 3 1 true` : `effect @s speed 3 1 true`;
        }
        return `execute as @a at @s if entity ${sel} run ${run}`;
      },
    }],
  },
  {
    id: "block-detect",
    icon: "🚩",
    title: "特定のブロックに乗ったら〇〇する",
    desc: "プレイヤーが指定ブロックの上に立ったら、自動でコマンドを実行します。",
    keywords: ["乗ったら", "踏んだら", "立ったら", "ブロック", "検知", "ジャンプ台", "自動", "execute", "トラップ"],
    params: [
      { key: "block", label: "どのブロックに乗ったら?", type: "select", options: [
        { v: "gold_block", ja: "金ブロック" },
        { v: "diamond_block", ja: "ダイヤモンドブロック" },
        { v: "emerald_block", ja: "エメラルドブロック" },
        { v: "redstone_block", ja: "レッドストーンブロック" },
      ], def: "gold_block" },
      { key: "action", label: "何をする?", type: "select", options: [
        { v: "jump", ja: "大ジャンプさせる(ジャンプ台)" },
        { v: "speed", ja: "ダッシュさせる(スピードの道)" },
        { v: "heal", ja: "回復させる(回復の床)" },
      ], def: "jump" },
    ],
    blocks: p => [{
      type: "repeat",
      note: "リピートブロックで常にチェックし続けます(常時実行ON)",
      gen: (ed) => {
        let run;
        if (p.action === "jump") {
          run = ed === "java" ? `effect give @s minecraft:levitation 1 4 true` : `effect @s levitation 1 4 true`;
        } else if (p.action === "speed") {
          run = ed === "java" ? `effect give @s minecraft:speed 2 2 true` : `effect @s speed 2 2 true`;
        } else {
          run = ed === "java" ? `effect give @s minecraft:regeneration 2 1 true` : `effect @s regeneration 2 1 true`;
        }
        return `execute as @a at @s if block ~ ~-1 ~ ${p.block} run ${run}`;
      },
    }],
  },
  {
    id: "welcome",
    icon: "🎉",
    title: "ようこそ演出(タイトル+音+花火風)",
    desc: "ボタンを押すと、タイトル表示・レベルアップ音・パーティクルが一気に発動する演出チェーンです。",
    keywords: ["ようこそ", "演出", "イベント", "チェーン", "組み合わせ", "welcome", "お祝い", "パーティー"],
    params: [
      { key: "text", label: "表示する文字", type: "text", def: "ようこそ!" },
    ],
    blocks: p => [
      {
        type: "impulse",
        note: "①ボタンで発動:タイトル表示",
        gen: (ed) => ed === "java"
          ? `title @a title ${jsonText(p.text, "gold")}`
          : `title @a title ${p.text}`,
      },
      {
        type: "chain",
        note: "②つづけて効果音",
        gen: (ed) => ed === "java"
          ? `playsound minecraft:entity.player.levelup master @a`
          : `playsound random.levelup @a`,
      },
      {
        type: "chain",
        note: "③つづけてパーティクル",
        gen: (ed) => ed === "java"
          ? `particle minecraft:totem_of_undying ~ ~2 ~ 0.5 0.5 0.5 0.3 60`
          : `particle minecraft:totem_particle ~ ~2 ~`,
      },
    ],
  },
  {
    id: "lobby",
    icon: "🏁",
    title: "スタート地点に全員集合させる",
    desc: "全プレイヤーを1か所にテレポートして、体力も回復させます。ミニゲームの開始に。",
    keywords: ["集合", "スタート", "ロビー", "全員", "ミニゲーム", "開始", "はじめ"],
    params: [
      { key: "x", label: "集合場所X", type: "text", def: "0" },
      { key: "y", label: "集合場所Y", type: "text", def: "70" },
      { key: "z", label: "集合場所Z", type: "text", def: "0" },
    ],
    blocks: p => [
      {
        type: "impulse",
        note: "①全員をテレポート",
        gen: () => `tp @a ${p.x} ${p.y} ${p.z}`,
      },
      {
        type: "chain",
        note: "②体力を回復",
        gen: (ed) => ed === "java"
          ? `effect give @a minecraft:instant_health 1 4 true`
          : `effect @a instant_health 1 4 true`,
      },
      {
        type: "chain",
        note: "③開始の合図を表示",
        gen: (ed) => ed === "java"
          ? `title @a title ${jsonText("スタート!", "green")}`
          : `title @a title スタート!`,
      },
    ],
  },
];
