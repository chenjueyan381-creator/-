/* ========================================================================
   我的小世界 — 交互逻辑
   ======================================================================== */
(function () {
  "use strict";

  const PASSWORD = "111913";
  const LS = {
    diary: "msw_diary",
    fav: "msw_fav",
    mood: "msw_mood",
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const load = (k, def) => {
    try { return JSON.parse(localStorage.getItem(k)) ?? def; }
    catch { return def; }
  };
  const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
  const todayStr = () => {
    const d = new Date();
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  };

  /* ===================== 奶油背景：飘落的小点缀 ===================== */
  function initStarfield() {
    const cv = $("#starfield");
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const COLS = ["rgba(242,126,157,", "rgba(247,215,116,", "rgba(155,201,143,", "rgba(168,216,240,", "rgba(199,179,230,"];
    const EMO = ["🍓", "✿", "♡", "⭐", "🌸"];
    const sprites = EMO.map((ch) => {
      const c = document.createElement("canvas");
      c.width = c.height = 36;
      const g = c.getContext("2d");
      g.font = "26px serif";
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.globalAlpha = 0.9;
      g.fillStyle = "#f27e9d";
      g.fillText(ch, 18, 19);
      return c;
    });
    let bits = [];
    function resize() {
      cv.width = window.innerWidth;
      cv.height = window.innerHeight;
      const count = Math.min(46, Math.floor((cv.width * cv.height) / 24000));
      bits = Array.from({ length: count }, (_, i) => ({
        x: Math.random() * cv.width,
        y: Math.random() * cv.height,
        r: Math.random() * 2.6 + 1.6,
        sp: Math.random() * 0.35 + 0.12,
        ph: Math.random() * 6.28,
        col: COLS[(Math.random() * COLS.length) | 0],
        emo: i % 7 === 0 ? sprites[(Math.random() * sprites.length) | 0] : null,
        rot: Math.random() * 6.28,
        vr: (Math.random() - 0.5) * 0.01,
      }));
    }
    function tick(t) {
      ctx.clearRect(0, 0, cv.width, cv.height);
      for (const b of bits) {
        b.y += b.sp;
        b.x += Math.sin(t / 1800 + b.ph) * 0.3;
        b.rot += b.vr;
        if (b.y > cv.height + 24) { b.y = -24; b.x = Math.random() * cv.width; }
        if (b.emo) {
          ctx.save();
          ctx.globalAlpha = 0.22 + 0.1 * Math.sin(t / 900 + b.ph);
          ctx.translate(b.x, b.y);
          ctx.rotate(b.rot);
          ctx.drawImage(b.emo, -13, -13, 26, 26);
          ctx.restore();
        } else {
          ctx.globalAlpha = 1;
          ctx.fillStyle = b.col + (0.18 + 0.12 * Math.sin(t / 800 + b.ph)) + ")";
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r, 0, 6.29);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(tick);
    }
    resize();
    window.addEventListener("resize", resize);
    requestAnimationFrame(tick);
  }

  /* ===================== 备份口令（跨设备同步） ===================== */
  function initBackup() {
    const KEYS = ["msw_diary", "msw_fav", "msw_mood", "planet_wishes", "planet_capsules", "world_save_v1"];
    const bBtn = $("#backup-btn"), iBtn = $("#import-btn");
    if (!bBtn || !iBtn) return;
    bBtn.addEventListener("click", () => {
      const data = {};
      KEYS.forEach((k) => { const v = localStorage.getItem(k); if (v != null) data[k] = v; });
      const code = "XSJ1." + btoa(unescape(encodeURIComponent(JSON.stringify(data))));
      const done = () => alert("备份口令已复制！🍓\n到另一台设备打开网站，点「导入备份」粘贴即可。");
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(done).catch(() => prompt("手动复制下面这串口令：", code));
      } else {
        prompt("手动复制下面这串口令：", code);
      }
    });
    iBtn.addEventListener("click", () => {
      const code = prompt("把备份口令粘贴到这里：");
      if (!code) return;
      try {
        const s = code.trim();
        if (!s.startsWith("XSJ1.")) throw 0;
        const data = JSON.parse(decodeURIComponent(escape(atob(s.slice(5)))));
        Object.keys(data).forEach((k) => { if (KEYS.includes(k)) localStorage.setItem(k, data[k]); });
        alert("导入成功！日记、收藏、心情都回来啦 🍓");
        location.reload();
      } catch (e) {
        alert("口令好像不对，再检查一下有没有复制完整～");
      }
    });
  }

  /* ===================== 密码入口 ===================== */
  function initGate() {
    const gate = $("#gate");
    const tw = $("#typewriter");
    const form = $("#gate-form");
    const input = $("#gate-input");
    const err = $("#gate-error");
    const msg = "欢迎来到我的小世界";

    // 打字机
    let i = 0;
    (function type() {
      if (i <= msg.length) {
        tw.textContent = msg.slice(0, i);
        i++;
        setTimeout(type, 140);
      } else {
        form.classList.add("is-ready");
        setTimeout(() => input.focus(), 200);
      }
    })();

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (input.value.trim() === PASSWORD) {
        gate.classList.add("is-gone");
        const app = $("#app");
        app.hidden = false;
        setTimeout(() => gate.remove(), 900);
      } else {
        err.textContent = "⚠ 密语有误，门不会为你而开。";
        err.classList.remove("shake");
        void err.offsetWidth;
        err.classList.add("shake");
        input.value = "";
        input.focus();
      }
    });
  }

  /* ===================== 导航 ===================== */
  function initNav() {
    $$(".nav__item").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.section;
        if (!id) return; // 外链（如星球世界）直接跳转
        $$(".nav__item").forEach((b) => b.classList.toggle("is-active", b === btn));
        $$(".panel").forEach((p) => p.classList.toggle("is-active", p.id === id));
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
  }

  /* ===================== 角色收藏馆 ===================== */
  const CHARACTERS = [
    {
      key: "l", name: "L", from: "DEATH NOTE · 死亡笔记", img: "images/l.jpg",
      glyph: "L", mode: "cover", pos: "center 26%",
      quote: "「正义会胜利……？那么，胜利的人就是正义。」",
    },
    {
      key: "touya", name: "塔矢亮", from: "HIKARU NO GO · 棋魂", img: "images/touya.jpg",
      glyph: "棋", mode: "cover", pos: "center 22%",
      quote: "「我一直在追逐着那一手——神之一手。」",
    },
    {
      key: "shizuya", name: "竹早静弥", from: "TSURUNE · 弦音", img: "images/shizuya.png",
      glyph: "弦", mode: "cut", pos: "center top",
      quote: "「把心放平，弦音自会清澈。」",
    },
    {
      key: "watanuki", name: "四月一日君寻", from: "×××HOLiC", img: "images/watanuki.jpg",
      glyph: "祓", mode: "contain", pos: "center",
      quote: "「这世上没有偶然，有的只是必然。」",
    },
    {
      key: "yuuko", name: "壹原侑子", from: "×××HOLiC", img: "images/yuuko.jpg",
      glyph: "願", mode: "cover", pos: "center 14%",
      quote: "「等价交换——你愿以什么，换你所求？」",
    },
  ];
  function renderCharacters() {
    const grid = $("#card-grid");
    grid.innerHTML = CHARACTERS.map((c) => `
      <article class="card card--${c.key}" data-mode="${c.mode}">
        <div class="card__frame">
          <div class="card__media">
            <img class="card__img" src="${c.img}" alt="${esc(c.name)}"
                 style="object-position:${c.pos}" />
            <div class="card__fallback">${c.glyph}</div>
            <span class="card__corner tl"></span><span class="card__corner tr"></span>
            <span class="card__corner bl"></span><span class="card__corner br"></span>
          </div>
        </div>
        <div class="card__body">
          <div class="card__name">${esc(c.name)}</div>
          <div class="card__from">${esc(c.from)}</div>
          <div class="card__quote">${esc(c.quote)}</div>
        </div>
      </article>`).join("");
    // 图片加载失败时隐藏图片，露出符文占位
    $$(".card__img", grid).forEach((img) => {
      img.addEventListener("error", () => { img.style.display = "none"; });
    });
  }

  /* ===================== 秘密日记 ===================== */
  function initDiary() {
    const form = $("#diary-form");
    const dateEl = $("#diary-date");
    const textEl = $("#diary-text");
    const list = $("#diary-list");
    dateEl.value = todayStr();

    function render() {
      const entries = load(LS.diary, []);
      if (!entries.length) {
        list.innerHTML = `<p class="fav__empty">尚无封存的档案……</p>`;
        return;
      }
      list.innerHTML = entries.map((e) => `
        <div class="diary__entry">
          <button class="del" data-id="${e.id}">销毁 ✕</button>
          <h4>⟡ ${esc(e.date)}</h4>
          <p>${esc(e.text)}</p>
        </div>`).join("");
      $$(".del", list).forEach((b) => b.addEventListener("click", () => {
        const left = load(LS.diary, []).filter((x) => String(x.id) !== b.dataset.id);
        save(LS.diary, left);
        render();
      }));
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = textEl.value.trim();
      if (!text) return;
      const entries = load(LS.diary, []);
      entries.unshift({ id: Date.now(), date: dateEl.value || todayStr(), text });
      save(LS.diary, entries);
      textEl.value = "";
      render();
    });
    render();
  }

  /* ===================== 我喜欢的 ===================== */
  function initFavorites() {
    const form = $("#fav-form");
    const typeEl = $("#fav-type");
    const inputEl = $("#fav-input");
    const lists = {
      music: $("#fav-music"), movie: $("#fav-movie"), thing: $("#fav-thing"),
    };

    function render() {
      const data = load(LS.fav, { music: [], movie: [], thing: [] });
      for (const type of Object.keys(lists)) {
        const items = data[type] || [];
        if (!items.length) {
          lists[type].innerHTML = `<li class="fav__empty">还没有收藏~</li>`;
          continue;
        }
        lists[type].innerHTML = items.map((it) => `
          <li>
            <span>${esc(it.text)}</span>
            <button class="del" data-type="${type}" data-id="${it.id}" title="删除">✕</button>
          </li>`).join("");
      }
      $$(".fav__list .del").forEach((b) => b.addEventListener("click", () => {
        const data = load(LS.fav, { music: [], movie: [], thing: [] });
        data[b.dataset.type] = (data[b.dataset.type] || []).filter((x) => String(x.id) !== b.dataset.id);
        save(LS.fav, data);
        render();
      }));
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = inputEl.value.trim();
      if (!text) return;
      const type = typeEl.value;
      const data = load(LS.fav, { music: [], movie: [], thing: [] });
      if (!data[type]) data[type] = [];
      data[type].push({ id: Date.now(), text });
      save(LS.fav, data);
      inputEl.value = "";
      render();
    });
    render();
  }

  /* ===================== 今日心情 ===================== */
  function initMood() {
    const dateEl = $("#mood-today-date");
    const berries = $$(".mood__berry");
    const noteEl = $("#mood-note");
    const listEl = $("#mood-list");
    const today = todayStr();
    dateEl.textContent = today;

    function getToday() {
      const all = load(LS.mood, {});
      return all[today] || { value: 0, note: "" };
    }
    function paint(v) {
      berries.forEach((b) => b.classList.toggle("on", Number(b.dataset.v) <= v));
    }
    function persist(value, note) {
      const all = load(LS.mood, {});
      all[today] = { value, note };
      save(LS.mood, all);
      renderHistory();
    }
    function renderHistory() {
      const all = load(LS.mood, {});
      const rows = Object.keys(all).sort().reverse();
      if (!rows.length) { listEl.innerHTML = `<p class="fav__empty">还没有记录心情~</p>`; return; }
      listEl.innerHTML = rows.map((d) => {
        const m = all[d];
        return `<div class="mood__row">
          <span class="d">${esc(d)}</span>
          <span class="b">${"🍓".repeat(m.value)}${"·".repeat(5 - m.value)}</span>
          <span class="n">${esc(m.note || "")}</span>
        </div>`;
      }).join("");
    }

    const cur = getToday();
    paint(cur.value);
    noteEl.value = cur.note || "";

    berries.forEach((b) => {
      b.addEventListener("click", () => {
        const v = Number(b.dataset.v);
        paint(v);
        persist(v, noteEl.value.trim());
      });
      b.addEventListener("mouseenter", () => paint(Number(b.dataset.v)));
    });
    $("#mood-stars").addEventListener("mouseleave", () => paint(getToday().value));
    noteEl.addEventListener("input", () => {
      const t = getToday();
      persist(t.value, noteEl.value.trim());
    });
    renderHistory();
  }

  /* ===================== 启动 ===================== */
  document.addEventListener("DOMContentLoaded", () => {
    initStarfield();
    initGate();
    initNav();
    renderCharacters();
    initDiary();
    initFavorites();
    initMood();
    initBackup();
  });
})();
