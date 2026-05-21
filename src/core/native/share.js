// PB.native.share — share sheet (text, URL, image).
//
// Native: @capacitor/share (iOS UIActivityViewController).
// Web fallback: navigator.share (Web Share API) or clipboard copy.

(function() {
  if (typeof PB === 'undefined' || !PB.native) return;

  function caps() {
    return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Share;
  }

  PB.native.share = {
    // Share text + optional URL + optional image (dataUrl)
    share: function(opts) {
      opts = opts || {};
      var title = opts.title || 'Parbaughs';
      var text = opts.text || '';
      var url = opts.url || '';

      if (PB.native.isNative() && caps()) {
        return caps().share({ title: title, text: text, url: url, dialogTitle: title });
      }
      // Web Share API (Chrome on Android + Safari 14+)
      if (typeof navigator.share === 'function') {
        var payload = { title: title };
        if (text) payload.text = text;
        if (url) payload.url = url;
        return navigator.share(payload).catch(function(e) {
          if (e.name !== 'AbortError') return Promise.reject(e);
        });
      }
      // Final fallback: copy to clipboard
      var copyText = [title, text, url].filter(Boolean).join('\n');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(copyText).then(function() {
          if (typeof Router !== 'undefined') Router.toast('Copied to clipboard');
        });
      }
      return Promise.reject(new Error('No share mechanism available'));
    }
  };
})();
