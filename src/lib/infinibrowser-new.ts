var t = (e, t, i) => {
  if ("string" == typeof e) return O.push([e, t, i]);
  e.addEventListener(t, i);
};

let O = [];

let i, A;

function w(e) {
  (i && (console.debug("[TRACE]", i, "-", Date.now() - A, "ms"), (i = 0)),
    e && ((i = e), (A = Date.now())));
}

async function W(e) {
  if (e)
    try {
      await V(e.name, new Uint8Array(await e.arrayBuffer()));
    } catch (e) {
      if ((J(), "string" == typeof e)) return alert(e);
      IBUtil.showError(e, "while opening a savefile");
    }
}

(t(window, "dragover", (e) => {
  (document.body.classList.add("drag"), e.preventDefault());
}),
  t(window, "dragleave", () => {
    document.body.classList.remove("drag");
  }),
  t(window, "drop", (e) => {
    (e.preventDefault(),
      document.body.classList.remove("drag"),
      W(e.dataTransfer.files.item(0)));
  }),
  t("file", "change", (e) => {
    (W(e.target.files.item(0)), (e.target.value = ""));
  }));

let savefile;
let l,
  Q,
  o = [],
  d = new Set(),
  b,
  c = !1,
  X = !1;

function Z() {
  ((item_count.textContent =
    recipe_count.textContent =
    first_discoveries.textContent =
    unknown_elements.textContent =
      "..."),
    Me(),
    M.clear(),
    (H = []),
    (Le = ""),
    (openedItem = {}),
    (sorting_sort.value = "time"),
    (sorting_order.name = "Order (ascending)"),
    (sorting_order_img.style.rotate = "180deg"),
    (search_input.value = ""),
    (search_icon.src = "/static/icon/button/search.svg"),
    (search_icon.style = null),
    (item_list.innerHTML = ""),
    rside.style.setProperty("--width", "400px"),
    (filter_first_discovery.indeterminate =
      filter_contributable.indeterminate =
      filter_recipeless.indeterminate =
      filter_regex.indeterminate =
        !0),
    (ee = null),
    (x = null),
    (L = null),
    (I = !1),
    (f = "time"),
    (g = !0),
    (u = ""),
    (b = []),
    (o = []),
    d.clear(),
    savefile && savefile.clear(),
    (savefile = l = Q = null));
}

function G(e) {
  ((filename.textContent = e),
    (c = !0),
    Z(),
    (loading.style = null),
    (analytics_main.style.display = "none"),
    (item_info.style.display = "none"),
    (stats.style = analytics.style = null),
    (document.body.style.backgroundPositionY = "-200px"),
    K(mainpage, analytics));
}

async function V(e, t, i = !0) {
  if (!c) {
    if (
      (i && G(e),
      (loading_state.textContent = "Loading..."),
      await new Promise((e) => setTimeout(e, 500)),
      !(savefile = await ICF.SaveFile.decode(t, {
        generateReverseRecipeMap: !1,
      })))
    )
      throw "Unsupported format";
    if (!savefile.elements.length) throw "Empty savefile!";
    ((l = savefile.elements),
      (Q = savefile.elementNames),
      (b = l.slice(0, 4)),
      savefile.reverseRecipeMap.clear(),
      await Promise.all([
        (async () => {
          loading_state.textContent = "Calculating depths...";
          let e = Date.now(),
            t = 0;
          for (var i of l) i.depth = 1 / 0;
          for (var n of b) n.depth = 0;
          for (;;) {
            let n = 0;
            t++;
            for (var a of l) {
              let e = a.depth,
                t,
                i;
              for (i of a.recipes)
                (t = i.a.depth + i.b.depth + 1) < e && (e = t);
              a.depth > e && ((a.depth = e), n++);
            }

            if ((await new Promise(setTimeout), !n)) break;
          }

          (console.debug("Depth calculation took", Date.now() - e, "ms"),
            (loading.style.display = "none"),
            (analytics_main.style = null),
            setTimeout(Y));
        })(),
        T(),
        ((i = new Intl.NumberFormat()),
        (item_count.textContent = i.format(l.length)),
        (recipe_count.textContent = i.format(savefile.stats.recipes)),
        (first_discoveries.textContent = i.format(savefile.stats.discoveries)),
        (unknown_elements.textContent = "0"),
        void (X || 0 == savefile.stats.recipes || 5e5 < savefile.stats.recipes
          ? (unknown_elements.textContent = "-")
          : (async () => {
              let e = l.filter((e) => e.recipes.length),
                t = [].concat(
                  e.filter((e) => e.discovery).slice(0, 25e3),
                  e.slice(-25e3),
                ),
                i = await fetch("/api/analytics/check", {
                  method: "POST",
                  body: await q(
                    new TextEncoder().encode(t.map((e) => e.text).join("\n")),
                    "deflate-raw",
                  ),
                  headers: { "Content-Type": "application/octet-stream" },
                }),
                n = new TextDecoder().decode(
                  await q(await i.arrayBuffer(), "deflate-raw", !1),
                );
              ((d = new Set(n.split("\n").map((e) => t[parseInt(e)]))).delete(
                void 0,
              ),
                p(unknown_elements, d.size).then(() => {
                  5e4 < l.length && (unknown_elements.textContent += "+");
                }));
            })())),
      ]));
  }
}

function J() {
  ((c = !1),
    (document.body.style.backgroundPositionY = null),
    K(analytics, mainpage, Z));
}

async function p(t, i) {
  var n = new Intl.NumberFormat(),
    a = i < 500 ? 100 : 255;
  for (let e = 0; e < a; e++) {
    var s = e / a,
      s = 1 == s ? 1 : 1 - Math.pow(2, -10 * s);
    ((t.textContent = n.format(Math.floor(i * s))),
      await new Promise(setTimeout));
  }

  t.textContent = n.format(i);
}

function Y() {
  (p(item_count, savefile.stats.elements),
    p(recipe_count, savefile.stats.recipes),
    p(first_discoveries, savefile.stats.discoveries));
}

async function q(e, t, i = !0) {
  ((i = new (i ? CompressionStream : DecompressionStream)(t)),
    (t = new Blob([e]).stream().pipeThrough(i)));
  return new Uint8Array(await new Response(t).arrayBuffer());
}

let m = 250;

function K(e, t, i = null) {
  ((e.style.animation = m + "ms hide_page ease-in-out"),
    (t.style.display = "none"),
    setTimeout(() => {
      ((e.style = "display: none"),
        (t.style = null),
        (t.style.animation = m + "ms show_page ease-in-out"),
        setTimeout(() => {
          ((t.style = null), i && i());
        }, m));
    }, m));
}

let u = "",
  f = "time",
  g = !0,
  ee = null,
  x = null,
  L = null,
  I = !1;

function T() {
  var e = x ? d : l;
  o = [];
  let t = I && new RegExp(u),
    i = u.toLowerCase();
  var n,
    a = t ? (e) => t.test(e) : (e) => e.toLowerCase().includes(i);
  for (n of e)
    !n ||
      (0 == x && d.has(n)) ||
      ee == !n.discovery ||
      (L && n.recipes.length) ||
      (0 == L && !n.recipes.length) ||
      ("depth" == f && n.depth == 1 / 0) ||
      (i && !a(n.text)) ||
      o.push(n);
  if ("time" == f)
    u &&
      !I &&
      o.sort((e, t) =>
        e.text.toLowerCase() == i ? -1 : t.text.toLowerCase() == i,
      );
  else if ("random" == f) {
    let e = o.length,
      t;
    for (; e--; ) ((t = ~~(Math.random() * e)), ([o[e], o[t]] = [o[t], o[e]]));
  } else
    o.sort(
      "name" == f
        ? (e, t) => e.text.localeCompare(t.text)
        : "emoji" == f
          ? (e, t) => e.emoji.localeCompare(t.emoji)
          : "depth" == f
            ? (e, t) => e.depth - t.depth
            : "length" == f
              ? (e, t) => e.text.length - t.text.length
              : "uses" == f
                ? (e, t) => e.uses.length - t.uses.length
                : "recipes" == f
                  ? (e, t) => e.recipes.length - t.recipes.length
                  : () => 0,
    );
  g || o.reverse();
  e = new Intl.NumberFormat().format(o.length);
  ((search_input.placeholder = `Search from ${e}
 elements`),
    (add_search_results.hidden = !u.length),
    (no_results.hidden = !!o.length),
    (loader.hidden = !o.length),
    i && o.length
      ? ((result_count.hidden = !1),
        (result_count.textContent = e + " result" + (1 == o.length ? "" : "s")))
      : (result_count.hidden = !0),
    re());
}

function C() {
  (clearTimeout(te),
    (item_list.style.opacity = 0.75),
    (te = setTimeout(
      () => {
        ((item_list.style.opacity = null), T());
      },
      2e5 < l.length
        ? 500
        : 1e5 < l.length
          ? 200
          : 5e4 < l.length
            ? 100
            : 1e4 < l.length
              ? 50
              : 25,
    )));
}

let te = null,
  M =
    (t("search_input", "input", () => {
      ((u = search_input.value)
        ? ((search_icon.src = "/static/icon/button/close.svg"),
          (search_icon.style.cursor = "pointer"))
        : ((search_icon.src = "/static/icon/button/search.svg"),
          (search_icon.style = null)),
        C());
    }),
    new Map()),
  ie = 100,
  S = 0,
  k = !1;

function ne() {
  var t, i;
  if (o.length && !(S >= o.length) && ae())
    for (let e = 0; e < ie; e++)
      ((t = o[S + e]),
        (i = void 0),
        t &&
          !M.has(t) &&
          ((i = IBUtil.createItemDiv(t)),
          z && D.has(t) && i.classList.add("selected"),
          item_list.append(i),
          M.set(t, i)));
}

function ae() {
  return (
    !loader.hidden &&
    loader.offsetTop - rside.scrollTop - 500 <=
      rside.offsetHeight + rside.offsetTop
  );
}

function se() {
  ae() && S < o.length
    ? (ne(), (S += ie), !k && rside.scrollTop > rside.offsetHeight && (k = !0))
    : 0 == rside.scrollTop && k && ((k = !1), re());
}

function re(e = !0) {
  ((item_list.innerHTML = ""), M.clear(), (S = 0), e && ne());
}

let le = !1,
  oe = 0,
  E = 400;

function de(e = E) {
  ((E = e),
    rside.style.setProperty("--width", e + "px"),
    (item_info.style.maxWidth = window.innerWidth - e - 10 + "px"));
}

setInterval(() => {
  o.length && S < o.length && ae() && (ne(), (S += ie));
}, 100);

let B = (e, t) => $$(e, (e) => e.classList.remove(t));

setInterval = "click";

let he = "transition-in 125ms",
  pe = "transition-out 125ms",
  me = (e, t) => {
    e = _("textarea", { value: e });
    (document.body.append(e),
      e.focus(),
      e.select(),
      e.setSelectionRange(0, e.value.length),
      document.execCommand("copy"),
      e.remove());
    let i = t.childNodes[0],
      n = i.src;
    (t.blur(),
      (t.style.pointerEvents = "none"),
      (t.style.animation = pe),
      setTimeout(() => {
        ((i.src =
          "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyBmaWxsPSIjN2Q3IiB2aWV3Qm94PSIwIDAgMjQgMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik05IDE2LjE3IDQuODMgMTJsLTEuNDIgMS40MUw5IDE5IDIxIDdsLTEuNDEtMS40MXoiLz4KPC9zdmc+Cg=="),
          (t.style.opacity = 1),
          (t.style.animation = he));
      }, 122),
      setTimeout(() => {
        ((t.style = null),
          (t.style.animation = pe),
          setTimeout(() => {
            ((i.src = n),
              (t.style.animation = he),
              setTimeout(() => (t.style = null), 122));
          }, 122));
      }, 1e3));
  };

(t("share_item", setInterval, async (e) => {
  if (openedItem.steps) {
    ((e.target.style.pointerEvents = "none"), e.target.blur());
    var t = await fetch("/api/analytics/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(openedItem),
      }),
      i = await t.json();
    if (((e.target.style = null), !i.id)) return IBUtil.showError(t, i);
    me("https://infinibrowser.wiki/item/" + i.id, e.target);
  }
}),
  t("copy_lineage", setInterval, (e) => {
    openedItem.steps &&
      me(
        openedItem.steps
          .map((e) => e[0].id + " + " + e[1].id + " = " + e[2].id)
          .join("\n"),
        e.target,
      );
  }),
  t("search_icon", setInterval, () => {
    ((search_input.value = ""),
      (search_icon.src = "/static/icon/button/search.svg"),
      (search_icon.style = null),
      (u = ""),
      T());
  }),
  IBUtil.onClick("item", (e) => {
    var e = e.target,
      i = parseInt(e.getAttribute("data-id"));
    if (z)
      ("item_list" == e.parentElement.id &&
        ((e) => {
          if (!(e.id < 4)) {
            if (D.has(e)) return Be(e);
            M.has(e) && M.get(e).classList.add("selected");
            var t = IBUtil.createItemDiv(e);
            (D.set(e, t), multi_target_items.append(t), ke());
          }
        })(l[i]),
        "multi_target_items" == e.parentElement.id && Be(l[i]));
    else {
      IBUtil.closeModal();
      {
        e = i;
        let t = l[e];
        t != j &&
          ((j = t),
          (xe = !0),
          (stats.style.display = "none"),
          (recipe_list.innerHTML = use_list.innerHTML = ""),
          (multi_target_items.innerHTML = recipe_tree.innerHTML = ""),
          (search_recipes_input.value = ""),
          (rt_span.textContent = "Here's how to craft this element"),
          (multi_target.hidden = !0),
          (item_emoji.hidden = !1),
          (item_navbar.style = null),
          (share_item.hidden = recipes_title.hidden = !1),
          (ue = fe = !1),
          (item_info.style.display = null),
          (openedItem = {}),
          de(),
          (item_recipe_cnt.textContent = new Intl.NumberFormat().format(
            t.recipes.length,
          )),
          (item_use_cnt.textContent = new Intl.NumberFormat().format(
            t.uses.length,
          )),
          (item_name.textContent = t.text),
          (item_emoji.textContent = t.emoji),
          twemoji.parse(item_emoji, {
            base: "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/",
          }),
          (element_id.style = null),
          (element_id.textContent = `This is your ${new Intl.NumberFormat().format(t.id - 3)}
${be(t.id - 3)}
 element`),
          t.id <= 3
            ? ((share_item.hidden = recipes_title.hidden = !0),
              (recipe_tree.innerHTML = ""),
              (element_id.textContent = "This is a primary element"))
            : ((async function t(i) {
                if (!we.has(i)) {
                  let e = await fetch("/api/item?id=" + encodeURIComponent(i), {
                    method: "HEAD",
                  });
                  if (429 == e.status)
                    return (await new Promise((e) => setTimeout(e, 500)), t(i));
                  we.set(i, 204 == e.status);
                }

                return we.get(i);
              })(t.text).then((e) => {
                (e || t.discovery) &&
                  element_id.append(
                    _(
                      "div",
                      { style: { color: "#bbf" } },
                      _("img", {
                        src: "/static/icon/button/magic.svg",
                        draggable: !1,
                      }),
                      e
                        ? t.discovery
                          ? "This first discovery is not on the website!"
                          : "This element is not on the website!"
                        : "This is a first discovery!",
                    ),
                  );
              }),
              IBUtil.wrap(Te, t)));
      }
    }
  }),
  IBUtil.onClick("_bc", (e) => e.target.blur()),
  t("lineage_section_btn", setInterval, (e) => {
    (B(".navbtn", "selected"),
      B(".navsection", "active"),
      e.target.classList.add("selected"),
      lineage_section.classList.add("active"));
  }));
let ue, fe;
(t("recipes_section_btn", setInterval, (e) => {
  (B(".navbtn", "selected"),
    B(".navsection", "active"),
    e.target.classList.add("selected"),
    recipes_section.classList.add("active"),
    ue || (_e(j.recipes), (ue = !0)));
}),
  t("uses_section_btn", setInterval, (e) => {
    if (
      (B(".navbtn", "selected"),
      B(".navsection", "active"),
      e.target.classList.add("selected"),
      uses_section.classList.add("active"),
      !fe)
    ) {
      e = j.uses;
      if (e?.length) {
        var t,
          i = [];
        for (t of e)
          i.push(
            _(
              "li",
              IBUtil.createItemDiv(t.other),
              "→",
              IBUtil.createItemDiv(t.result, "result"),
            ),
          );
        use_list.append(...i);
      } else use_list.textContent = "None";
      fe = !0;
    }
  }));
let ge;

function _e(t, i = new Set()) {
  if (
    ((recipe_list.style = null),
    (recipe_list.innerHTML = ""),
    (search_recipes_input.parentElement.style.width =
      item_navbar.offsetWidth + "px"),
    t?.length)
  ) {
    t.sort(
      (e, t) =>
        Math.max(e.a.depth, e.b.depth) - Math.max(t.a.depth, t.b.depth) ||
        Math.min(e.a.depth, e.b.depth) - Math.min(t.a.depth, t.b.depth),
    );
    var e,
      n = [],
      a = new Set(),
      s = [];
    for (e of t)
      (e.a == e.b && a.add(e.a),
        0 == e.a.depth && a.add(e.b),
        0 == e.b.depth && a.add(e.a));
    for (let e of t) {
      var r = IBUtil.createItemDiv(e.a),
        l = IBUtil.createItemDiv(e.b),
        r =
          (i.has(e[0]) && r.classList.add("hover"),
          i.has(e[1]) && l.classList.add("hover"),
          _(
            "li",
            r,
            "+",
            l,
            _(
              "button.ibtn",
              { onclick: () => IBUtil.wrap(Te, j, e) },
              _("img", {
                draggable: !1,
                src: "/static/icon/button/use_recipe.svg",
              }),
            ),
          ));
      (a.has(e.a) || a.has(e.b)) &&
      0 != e.a.depth &&
      0 != e.b.depth &&
      e.a != e.b
        ? ((r.style.opacity = 0.5), s.push(r))
        : n.push(r);
    }

    (recipe_list.append(...n),
      s.length && recipe_list.append(_("h3", "Unoptimal recipes"), ...s));
  } else recipe_list.textContent = "None";
}

async function ye(e, t = null) {
  for (
    var i = Array.isArray(e) ? e : [e],
      n = new Set(b),
      a = new Set(),
      s = new Set(),
      r = [],
      l =
        (1 == i.length &&
          t &&
          ((e = i.pop()),
          n.add(e),
          s.add(e),
          r.push([t.a, t.b, e]),
          n.has(t.a) || i.push(t.a),
          n.has(t.b) || i.push(t.b)),
        new Map());
    i.length;
  ) {
    var o,
      d = i.pop(),
      c = l.get(d);
    n.has(d) ||
      (c && (n.delete(c[0]), n.delete(c[1])),
      (o = ((e, t, i) => {
        let n = 1 / 0,
          a,
          s,
          r;
        if (e?.length) {
          for (s of e)
            t.has(s.a) ||
              t.has(s.b) ||
              ((r =
                (i.has(s.a) ? 0 : s.a.depth) +
                (i.has(s.b) || s.a == s.b ? 0 : s.b.depth)) < n &&
                ((n = r), (a = s)));
          return a || (!t.has(e[0].a) && !t.has(e[0].b) && e[0]);
        }
      })(d.recipes, s, n))
        ? n.has(o.a) && n.has(o.b)
          ? (r.push([o.a, o.b, d]), s.delete(d), n.add(d))
          : c
            ? (r.push([c.a, c.b, d]),
              s.delete(d),
              n.add(c.a),
              n.add(c.b),
              n.add(d))
            : (s.add(d),
              i.push(d),
              l.set(d, o),
              n.has(o.b) || i.push(o.b),
              n.has(o.a) || i.push(o.a))
        : (a.add(d), s.delete(d), n.add(d)),
      r.length % 500 == 0 && (await new Promise(setTimeout)));
  }

  return [r, Array.from(a.keys())];
}

async function ve(e, t) {
  for (var i = new Set(b), n = new Set(e), a = []; n.size; ) {
    let e = 0;
    for (var s of n)
      i.has(s[0]) && i.has(s[1]) && (a.push(s), n.delete(s), i.add(s[2]), e++);
    if (!e) {
      if (!t.length) break;
      var r = t.reduce((e, t) => (t.depth < e.depth ? t : e));
      (t.splice(t.indexOf(r), 1), i.add(r));
    }

    a.length % 500 == 0 && (await new Promise(setTimeout));
  }

  return a;
}

t("search_recipes_input", "input", (n) => {
  var e = j.recipes.length;
  ((recipe_list.style.opacity = 0.5),
    clearTimeout(ge),
    (ge = setTimeout(
      () => {
        {
          var e = n.target.value.toLowerCase(),
            i;
          if (!e.trim()) return _e(j.recipes);
          let t = new Set();
          for (i of l) i.text.toLowerCase().includes(e) && t.add(i);
          if (!t.size || !j.recipes.length) return _e([]);
          _e(
            j.recipes.filter((e) => t.has(e.a) || t.has(e.b)),
            t,
          );
        }
      },
      1e3 < e ? 200 : 500 < e ? 100 : 50,
    )));
});

let we = new Map();

let be = (e, t = e % 10, i = e % 100) =>
    1 == t && 11 != i
      ? "st"
      : 2 == t && 12 != i
        ? "nd"
        : 3 == t && 13 != i
          ? "rd"
          : "th",
  openedItem = {},
  xe = !1,
  j;

let D = new Map();

async function generateLineage(item) {
  var [e, t] = await ye(item);
  return { lineage: await ve(e, [...t]), missing: t };
}

let H = [],
  z = !1,
  Le = "";

async function Ie(e, i, n, a = void 0) {
  w("generate trace");
  var [a, s] = await ye(Array.from(e.keys()), a),
    a = (w("generate lineage"), await ve(a, [...s]));
  if (
    ((function e(t, i) {
      var n,
        a = new Map();
      for (n of t)
        (i.has(n[2]) || a.set(n[2], n), a.delete(n[0]), a.delete(n[1]));
      a.size && (a.forEach((e) => t.splice(t.indexOf(e), 1)), e(t, i));
    })(a, e),
    w("validate lineage"),
    a.length)
  ) {
    var t = a,
      r = e,
      l,
      o,
      d = new Set(b),
      c = new Set(),
      h = ([e, t, i]) =>
        `${e.text}
 + ${t.text}
 = ` + i.text;
    for (l of t)
      (d.has(l[0]) ||
        console.error(
          `[${h(l)}
] The first ingredient was used before it was crafted`,
        ),
        d.has(l[1]) ||
          console.error(
            `[${h(l)}
] The second ingredient was used before it was crafted`,
          ),
        d.has(l[2]) &&
          console.error(`[${h(l)}
] The element is already crafted`),
        c.delete(l[0]),
        c.delete(l[1]),
        d.add(l[2]),
        c.add(l[2]));
    for (o of r.keys()) c.delete(o);
    c.size &&
      console.error("Unused elements: " + [...c].map((e) => e.text).join(", "));
  }

  w("output lineage");
  ((t = a), (r = s), (s = e));
  recipe_tree.innerHTML = "";
  var p,
    m,
    u = new Set(t.flat()),
    f = {
      steps: t.map(([e, t, i]) => ({ a: e, b: t, result: i })),
      missing: {},
      targets: s,
    };

  openedItem.missing = {};

  for (p of r)
    u.has(p) &&
      ((m = p.recipes.length ? "loop" : "no_recipe"),
      (openedItem.missing[p.text] = m),
      (f.missing[p.text] = m));
  (recipe_tree.append(...IBUtil.displayLineage(f, "text")), w());
  {
    ((s = i), (i = n), (n = a));
    var g = e;
    let t = (e, t) => ({ id: e.text, emoji: e.emoji || "⬜", target: t });
    ((share_item.hidden = !n.length || 1e4 < n.length),
      (openedItem = {
        id: s,
        emoji: i,
        steps: n.map((e) => [t(e[0]), t(e[1]), t(e[2], g.has(e[2]) || void 0)]),
        missing: openedItem?.missing || {},
      }));
  }
}

async function Te(e, t = 0) {
  var i;
  e.id < 4 ||
    (B(".navbtn", "selected"),
    B(".navsection", "active"),
    lineage_section.classList.add("active"),
    lineage_section_btn.classList.add("selected"),
    (recipe_tree.innerHTML = ""),
    (share_item.hidden = recipes_title.hidden = !1),
    t &&
      ((i = Math.max(t.a.depth, t.b.depth) + 1),
      (element_id.textContent = "Using "),
      element_id.append(
        _("b", t.a.text),
        "+",
        _("b", t.b.text),
        `(depth ${Number.isSafeInteger(i) ? i : "unknown"}
)`,
      )),
    await Ie(new Set([e]), e.text, e.emoji, t));
}

async function Ce() {
  ((rt_span.textContent =
    `Lineage for ${D.size}
 element` + (1 == D.size ? "" : "s")),
    (element_id.style.display = "none"),
    (recipe_tree.innerHTML = ""),
    (share_item.hidden = recipes_title.hidden = !1),
    D.size
      ? await Ie(D, Le.trim().slice(0, 300) || "Multi-Target Lineage", "🛠️")
      : ((element_id.style = null),
        (element_id.textContent = "Empty"),
        (openedItem = {})));
}

function Me() {
  if (
    ((j = null),
    (stats.style = null),
    (xe = !1),
    (z = !1),
    (multi_target_items.innerHTML =
      recipe_tree.innerHTML =
      recipe_list.innerHTML =
      use_list.innerHTML =
        ""),
    (item_info.style.display = "none"),
    D?.size)
  ) {
    for (var e of D.keys())
      (H.push(e), M.has(e) && M.get(e).classList.remove("selected"));
    D.clear();
  }
}

(t("multi_target_btn", setInterval, function () {
  ((z = !0),
    (item_navbar.style.display = "none"),
    (multi_target.hidden = !1),
    (share_item.hidden = recipes_title.hidden = !1),
    (ue = fe = !1),
    (stats.style.display = "none"),
    (item_info.style.display = null),
    de(),
    (item_name.innerHTML = recipe_tree.innerHTML = ""),
    (item_emoji.hidden = !0),
    (openedItem = {}));
  let e = _("input", {
    maxLength: 250,
    oninput() {
      Le = openedItem.id = e.value.trim();
    },
    onblur() {
      e.value ||= "Multi-Target Lineage";
    },
  });
  ((e.value = Le = openedItem.id = "Multi-Target Lineage"),
    item_name.append(e),
    H.length && (Ee(H), (H = [])),
    IBUtil.wrap(Ce));
}),
  t("add_search_results", setInterval, () => {
    if (1e4 < o.length)
      return alert(
        "Cowardly refusing to add more than 10,000 elements (doing this will most likely freeze your tab forever)",
      );
    if (100 < o.length) {
      var e = new Intl.NumberFormat().format(o.length);
      if (
        !confirm(
          1e3 < o.length
            ? `There are more than 1,000 elements to be added (${e}
). ` +
                "Adding all of them could take a long time (if not forever) especially on low-end devices, " +
                `and will freeze your tab.

Do you wish to continue?`
            : `There are more than 100 elements to be added (${e}
); continue?`,
        )
      )
        return;
    }

    Ee(o);
  }));
let Se;

function ke() {
  (clearTimeout(Se),
    (recipe_tree.style.opacity = 0.5),
    (Se = setTimeout(() => {
      ((recipe_tree.style.opacity = null), IBUtil.wrap(Ce));
    }, 200)));
}

function Ee(e) {
  var t,
    i,
    n = [];
  for (t of e)
    D.has(t) ||
      t.id < 4 ||
      (M.has(t) && M.get(t).classList.add("selected"),
      (i = IBUtil.createItemDiv(t)),
      D.set(t, i),
      n.push(i));
  n.length && (multi_target_items.append(...n), ke());
}

function Be(e) {
  (M.has(e) && M.get(e).classList.remove("selected"),
    D.get(e).remove(),
    D.delete(e),
    ke());
}

export { generateLineage };
