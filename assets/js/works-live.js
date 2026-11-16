/*
 * 制作実績一覧の最新化（組み合わせ型）
 *
 * 一覧はビルド時に HTML として書き出してあり、AI や検索エンジンはその内容を読む。
 * 閲覧者向けには、ここで microCMS から最新の一覧を取得し、
 * ・ビルド後に公開された実績を追加（詳細は /works/?id=xxx で main.min.js が表示）
 * ・公開を取りやめた実績を非表示
 * ・並び順を microCMS に合わせる（data-works-limit があればその件数まで）
 * を行う。取得に失敗した場合は、書き出し済みの一覧をそのまま表示する。
 */
(function () {
  var ENDPOINT = "https://openwill.microcms.io/api/v1/works";
  var API_KEY = "YK8dW75Wy52WfhIsENMJMzTsbLvDMGsvmaBv"; // main.min.js と同じ読み取り用キー
  var WORKS_PATH = "/openwill-preview/works/";

  function webp(url) {
    if (/\.(jpg|jpeg|png)(\?|$)/i.test(url)) return url + (url.indexOf("?") >= 0 ? "&" : "?") + "fm=webp";
    return url;
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  function card(w) {
    var li = el("li", "bl_worksCard");
    li.setAttribute("data-work-id", w.id);
    var a = el("a", "cardLink");
    a.href = WORKS_PATH + "?id=" + encodeURIComponent(w.id);
    var thumb = el("div", "cardThumb");
    if (w.thumbnail) {
      var img = el("img");
      img.src = webp(w.thumbnail.url);
      img.alt = w.title;
      img.loading = "lazy";
      thumb.appendChild(img);
    }
    var body = el("div", "cardBody");
    if (w.type && w.type.length) body.appendChild(el("span", "cardType", w.type.join(" / ")));
    body.appendChild(el("h3", "cardTitle", w.title));
    var tags = (w.tags || "").split(",").map(function (t) { return t.trim(); }).filter(Boolean);
    if (tags.length) {
      var box = el("div", "cardTags");
      tags.forEach(function (t) { box.appendChild(el("span", "tag", t)); });
      body.appendChild(box);
    }
    a.appendChild(thumb);
    a.appendChild(body);
    li.appendChild(a);
    return li;
  }

  var lists = document.querySelectorAll("[data-works-live]");
  if (!lists.length || !window.fetch) return;

  fetch(ENDPOINT + "?fields=id,title,type,tags,thumbnail&limit=100", { headers: { "X-MICROCMS-API-KEY": API_KEY } })
    .then(function (res) { if (!res.ok) throw new Error(res.status); return res.json(); })
    .then(function (data) {
      if (!data.contents || !data.contents.length) return;
      Array.prototype.forEach.call(lists, function (ul) {
        var existing = {};
        Array.prototype.forEach.call(ul.querySelectorAll("[data-work-id]"), function (li) {
          existing[li.getAttribute("data-work-id")] = li;
        });
        var frag = document.createDocumentFragment();
        var limit = parseInt(ul.getAttribute("data-works-limit"), 10) || data.contents.length;
        data.contents.slice(0, limit).forEach(function (w) { frag.appendChild(existing[w.id] || card(w)); });
        while (ul.firstChild) ul.removeChild(ul.firstChild);
        ul.appendChild(frag);
      });
    })
    .catch(function () {});
})();
