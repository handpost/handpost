// Handpost 郵便受けの読み込み役（bk34b、2026-10-18 開発者「移設しないと直らないのはお金の無駄を強要することになる。なんとか稼働中に修正できないものか」「A」）
// HotPocket は毎回この index.js を起こす。ここは本体（post_cur.js）を読むだけ。本体は upgrade の入力で post_new.js に置き替えられる。
//   post_new.js と state/upgrade.json があれば、tries を 1 増やして post_new.js を起こす。本体が 1 回きちんと動くと、本体の側で post_cur.js に昇格する（post.js の末尾）。
//   3 回続けて動かなければ（tries が 3 以上）post_new.js を捨てて post_cur.js に戻る。読み込みで落ちる（文法の誤りなど）ときも、その場で捨てて post_cur.js に戻る。
//   手紙や設定（state/）には触らない。このファイルは配備のときの zip に index.js として入る（本体は post_cur.js）
"use strict";
const fs = require("fs"), path = require("path");
const ROOT = process.cwd();
const CUR = path.join(ROOT, "post_cur.js"), NEW = path.join(ROOT, "post_new.js"), UPG = path.join(ROOT, "state", "upgrade.json");
const drop = (why) => { try { fs.unlinkSync(NEW); } catch (e) { } try { fs.unlinkSync(UPG); } catch (e) { } console.log("upgrade reverted: " + why); };
let target = CUR;
try {
  if (fs.existsSync(NEW)) {
    let u = null; try { u = JSON.parse(fs.readFileSync(UPG, "utf8")); } catch (e) { u = null; }
    if (!u || typeof u !== "object" || (u.tries | 0) >= 3) drop(u ? "tries" : "no record");
    else { u.tries = (u.tries | 0) + 1; try { fs.writeFileSync(UPG, JSON.stringify(u)); target = NEW; } catch (e) { } }
  }
} catch (e) { }
global.HP_POST_FILE = path.basename(target);
try { require(target); }
catch (e) {
  if (target !== NEW) throw e;
  drop("load failed " + String((e && e.message) || e).slice(0, 80));
  global.HP_POST_FILE = path.basename(CUR);
  require(CUR);
}
