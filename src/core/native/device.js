// PB.native.device — runtime/platform info.
//
// Native: @capacitor/device plugin.
// Web fallback: navigator + window.matchMedia.

(function() {
  if (typeof PB === 'undefined' || !PB.native) return;

  PB.native.device = {
    // Returns: { platform, osVersion, model, manufacturer, webViewVersion }
    info: function() {
      if (PB.native.isNative() && window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Device) {
        return window.Capacitor.Plugins.Device.getInfo();
      }
      // Web fallback — limited info
      var ua = navigator.userAgent;
      var platform = PB.native.platform();
      var osVersion = (ua.match(/OS (\d+_\d+)/) || ua.match(/Android (\d+\.\d+)/) || [])[1] || 'unknown';
      var model = (ua.match(/iPhone|iPad|Pixel|SM-/) || ['unknown'])[0];
      return Promise.resolve({
        platform: platform,
        osVersion: String(osVersion).replace('_', '.'),
        model: model,
        manufacturer: 'unknown',
        webViewVersion: ua.split(' ').pop()
      });
    },

    // Returns whether the device has a notch / safe-area inset top > 0
    hasSafeArea: function() {
      var env = getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top');
      return parseFloat(env || '0') > 0;
    }
  };
})();
