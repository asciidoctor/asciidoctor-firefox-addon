exports.main = function () {
  var widgets = require('sdk/widget');
  var tabs = require('sdk/tabs');
  var self = require('sdk/self');
  var data = self.data;
  var preferences = require('sdk/preferences/service');

  tabs.on('ready', convertAsciiDocAndRender);

  function convertAsciiDocAndRender(tab) {
    if (preferences.get('asciidoctorlivepreview.enabled', true)) {
      var worker = tab.attach({
        contentScriptFile: [data.url('opal.js'), data.url('asciidoctor.js'), data.url('asciidocify.js')],
        // TIP use contentScriptOptions to make data available as self.options within contentScript
        contentScript: 'asciidocify.load();',
        contentScriptWhen: 'ready'
      });
      worker.on('message', function(message) {
        worker.port.emit('RENDER_SANITIZED_HTML', { html: sanitizeHTML(message.html, true) });
      });
    }
  }

  function updateWidgetIcon(enabled) {
    if (enabled) {
      widget.contentURL = data.url('enabled.png')
    } else {
      widget.contentURL = data.url('disabled.png')
    }
  }

  var widget = widgets.Widget({
    id: 'asciidoctor-live-preview',
    label: 'Asciidoctor Live Preview',
    contentURL:data.url('enabled.png'),
    onClick:function () {
      var enabled = preferences.get('asciidoctorlivepreview.enabled', true);

      // Switch enabled <> disabled
      enabled = !enabled;

      // Update the extension icon
      updateWidgetIcon(enabled);

      // Save the new status of the extension
      preferences.set('asciidoctorlivepreview.enabled', enabled);

      // Reload the tab
      tabs.activeTab.reload();
    }
  });

  var enabled = preferences.get('asciidoctorlivepreview.enabled', true);
  updateWidgetIcon(enabled);
};

var {Cc, Ci} = require('chrome');

/**
* Parses a string into an HTML document, sanitizes the document, and returns
* the result serialized to a string.
*
* @param {string} html The HTML fragment to parse.
* @param {boolean} allowStyle allow <style> nodes and attributes in parsed fragment if true (Gecko 14+ only).
*
* @see https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIParserUtils
*/
function sanitizeHTML(html, allowStyle) {
  var parser = Cc['@mozilla.org/parserutils;1'].getService(Ci.nsIParserUtils);
  return parser.sanitize(html, !!allowStyle ? parser.SanitizerAllowStyle : 0);
}
