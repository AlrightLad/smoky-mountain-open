// PB.native.camera — photo capture + gallery.
//
// Native: @capacitor/camera (permission-aware, uses iOS native picker).
// Web fallback: <input type="file" accept="image/*"> programmatic click.

(function() {
  if (typeof PB === 'undefined' || !PB.native) return;

  function caps() {
    return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Camera;
  }

  function webPick(source) {
    return new Promise(function(resolve, reject) {
      var input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      if (source === 'camera') input.capture = 'environment';
      input.style.display = 'none';
      input.addEventListener('change', function() {
        var file = input.files && input.files[0];
        if (!file) { reject(new Error('No file selected')); return; }
        var reader = new FileReader();
        reader.onload = function() {
          resolve({ dataUrl: reader.result, format: file.type, size: file.size, name: file.name });
        };
        reader.onerror = function() { reject(reader.error); };
        reader.readAsDataURL(file);
      });
      document.body.appendChild(input);
      input.click();
      setTimeout(function() { try { document.body.removeChild(input); } catch (e) {} }, 30000);
    });
  }

  PB.native.camera = {
    capture: function(opts) {
      opts = opts || {};
      if (PB.native.isNative() && caps()) {
        return caps().getPhoto({
          source: 'CAMERA',
          quality: opts.quality || 80,
          resultType: 'dataUrl',
          allowEditing: !!opts.allowEditing
        });
      }
      return webPick('camera');
    },

    pickFromGallery: function(opts) {
      opts = opts || {};
      if (PB.native.isNative() && caps()) {
        return caps().getPhoto({
          source: 'PHOTOS',
          quality: opts.quality || 80,
          resultType: 'dataUrl',
          allowEditing: !!opts.allowEditing
        });
      }
      return webPick('gallery');
    }
  };
})();
