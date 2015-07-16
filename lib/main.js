exports.main = function () {

  var system = require("sdk/system");
  var tabs = require('sdk/tabs');
  var self = require('sdk/self');
  var data = self.data;

  if (system.name == "Firefox") {
    // Simple preferences are only supported in Firefox
    var simplePreferences = require("sdk/simple-prefs").prefs;
    // Widget is only supported in Firefox
    var { ToggleButton } = require("sdk/ui/button/toggle");
    var preferencesService = require('sdk/preferences/service');
    var enablePref = 'asciidoctorlivepreview.enabled';
    var enabled = preferencesService.get(enablePref, true);

    function getToggleButtonIcon(enabled) {
      return {
        "16": (enabled ? './enabled16.png' : './disabled16.png'),
        "32": (enabled ? './enabled32.png' : './disabled32.png')
      }
    }

    function convertAsciiDocAndRender(tab) {
      if (preferencesService.get(enablePref, true)) {
        var worker = tab.attach({
          contentScriptFile: [data.url('opal.js'), data.url('asciidoctor.js'), data.url('asciidocify.js')],
          contentScriptOptions: {
            preferences: simplePreferences
          },
          contentScript: 'asciidocify.load();',
          contentScriptWhen: 'ready'
        });
        worker.on('message', function(message) {
          worker.port.emit('RENDER_SANITIZED_HTML', { html: sanitizeHTML(message.html, true) });
        });
      }
    }

    var button = ToggleButton({
      id: "enable-disable-btn",
      label: "Asciidoctor Live Preview",
      icon: getToggleButtonIcon(enabled),
      onChange: function(state) {
        // Update the icon
        button.icon = getToggleButtonIcon(state.checked);

        // Save the new state
        preferencesService.set(enablePref, state.checked);

        // Reload the tab
        tabs.activeTab.reload();
      },
      checked: enabled
    });

    tabs.on('ready', convertAsciiDocAndRender);

  } else {
     // Method tab.attach() doesn't work on Fennec that's why we are using pageMod
     var pageMod = require("sdk/page-mod");
     pageMod.PageMod({
      include: "*",
      contentScriptFile: [data.url('opal.js'), data.url('asciidoctor.js'), data.url('asciidocify.js')],
      // TIP use contentScriptOptions to make data available as self.options within contentScript
      contentScript: 'asciidocify.load();',
      contentScriptWhen: 'ready',
      onAttach: function(worker) {
        worker.on('message', function(message) {
          worker.port.emit('RENDER_SANITIZED_HTML', { html: sanitizeHTML(message.html, true) });
        });
      }
    });
  }
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
