// This is an active module of the ggrossetie (1) Add-on
exports.main = function () {

    var widgets = require("sdk/widget");
    var tabs = require("sdk/tabs");
    var self = require("sdk/self");
    var data = self.data;
    var preferences = require("sdk/preferences/service");

    tabs.on("ready", renderAsciidoc);

    function renderAsciidoc(tab) {
        if (preferences.get("asciidoctorlivepreview.enabled", true)) {
            tab.attach({
                contentScriptFile:[data.url("opal.js"),
                    data.url("asciidoctor.js"),
                    data.url("asciidocify.js")],
                contentScript:'asciidocify.load();'
            });
        }
    }

    function updateWidgetIcon(enabled) {
        if (enabled) {
            widget.contentURL = data.url("enabled.png")
        } else {
            widget.contentURL = data.url("disabled.png")
        }
    }

    var widget = widgets.Widget({
        id:"asciidoctor-live-preview",
        label:"Asciidoctor Live Preview",
        contentURL:data.url("enabled.png"),
        onClick:function () {
            var enabled = preferences.get("asciidoctorlivepreview.enabled", true);

            // Switch enabled <> disabled
            enabled = !enabled;

            // Update the extension icon
            updateWidgetIcon(enabled);

            // Save the new status of the extension
            preferences.set("asciidoctorlivepreview.enabled", enabled);

            // Reload the tab
            tabs.activeTab.reload();
        }
    });

    var enabled = preferences.get("asciidoctorlivepreview.enabled", true);
    updateWidgetIcon(enabled);
};