exports.main = function () {

  var system = require("sdk/system");
  var tabs = require('sdk/tabs');
  var self = require('sdk/self');
  var data = self.data;

  if (system.name == "Firefox" || system.name == "Iceweasel") {
    // Simple preferences are only supported in Firefox/Iceweasel
    var simplePreferences = require("sdk/simple-prefs").prefs;
    // Widget is only supported in Firefox/Iceweasel
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

    // HotKey is only supported in Firefox
    var { Hotkey } = require("sdk/hotkeys");

    Hotkey({
      combo: "accel-shift-d",
      onPress: function() {
        button.click();
      }
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
      contentScriptWhen: 'ready'
    });
  }
};

var {Cc, Ci} = require('chrome');
