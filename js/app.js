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

  /* ===================== 星空背景 ===================== */
  function initStarfield() {
    const cv = $("#starfield");
    if (!cv) return;
    const ctx = cv.getContext("2d");
    let stars = [];
    function resize() {
      cv.width = window.innerWidth;
      cv.height = window.innerHeight;
      const count = Math.min(180, Math.floor((cv.width * cv.height) / 9000));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * cv.width,
        y: Math.random() * cv.height,
        r: Math.random() * 1.3 + 0.2,
        a: Math.random(),
        s: Math.random() * 0.02 + 0.003,
        hue: Math.random() < 0.15 ? "purple" : (Math.random() < 0.1 ? "red" : "white"),
      }));
    }
    function tick() {
      ctx.clearRect(0, 0, cv.width, cv.height);
      for (const st of stars) {
        st.a += st.s;
        const tw = (Math.sin(st.a) + 1) / 2;
        let col = `rgba(255,255,255,${0.15 + tw * 0.7})`;
        if (st.hue === "purple") col = `rgba(160,110,220,${0.15 + tw * 0.6})`;
        if (st.hue === "red") col = `rgba(192,60,72,${0.15 + tw * 0.55})`;
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();
      }
      requestAnimationFrame(tick);
    }
    resize();
    window.addEventListener("resize", resize);
    tick();
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
  });
})();
