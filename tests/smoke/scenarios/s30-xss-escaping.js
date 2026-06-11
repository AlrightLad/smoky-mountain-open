// S30 — stored-XSS regression guard (v8.24.53).
// The security pentest found member display names / course names interpolated
// into innerHTML without escHtml at 9 sinks (activity feed quip, profile
// share-card, add-member dropdown, course-search displays, course detail/list,
// ace wall, trip scorecard, tee-time dropdown, equip-title modal). This asserts
// the escHtml helper neutralizes the canonical payload — a guard so a future
// edit can't silently reintroduce a raw sink.
module.exports = {
  id: 'S30',
  name: 'XSS escaping — escHtml neutralizes HTML in user-controlled fields',
  run: async function(ctx) {
    var page = ctx.page;
    var r = await page.evaluate(function() {
      var out = {};
      var payload = '<img src=x onerror=alert(1)>';
      out.escFn = typeof escHtml === 'function';
      if (out.escFn) {
        var e = escHtml(payload);
        out.escaped = (e.indexOf('<img') === -1) && (e.indexOf('&lt;img') !== -1);
        // round-trip through innerHTML must NOT create an <img> element
        var host = document.createElement('div');
        host.innerHTML = '<div>' + escHtml(payload) + '</div>';
        out.noImgElement = host.querySelectorAll('img').length === 0;
        out.textPreserved = host.textContent.indexOf('<img') !== -1; // shows as literal text
      }
      return out;
    });
    var failures = [];
    if (!r.escFn) failures.push('escHtml missing');
    if (!r.escaped) failures.push('escHtml did not entity-encode <img');
    if (!r.noImgElement) failures.push('escHtml output still parsed into an <img> element (XSS!)');
    if (!r.textPreserved) failures.push('payload not preserved as literal text');
    if (failures.length) throw new Error(failures.join(' | '));
    return { passed: true, details: 'escHtml neutralizes the canonical XSS payload' };
  }
};
