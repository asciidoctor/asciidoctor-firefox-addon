window.addEventListener('load', function load() {
    window.removeEventListener('load', load, false);
    asciidoctorpreview.load();
}, false);

if (typeof asciidoctorpreview === 'undefined') {

    var ASCIIDOCTOR_OPTIONS = Opal.hash2([ 'attributes' ], {
        'attributes':[ 'notitle!' ]
    });

    var asciidoctorpreview = {

        load:function () {
            var addEventListener;
            if (window.BrowserApp) {
                // We are running in Firefox Mobile
                addEventListener = window.BrowserApp.deck.addEventListener;
            } else {
                var appcontent = document.getElementById("appcontent");
                if (appcontent) {
                    addEventListener = appcontent.addEventListener;
                }
            }
            if (addEventListener) {
                addEventListener('DOMContentLoaded', this.onPageLoad, true);
            }
            var prefs = getAddonPrefs();
            var enabled = isAddonEnabled(prefs);
            updateAddonIcon(enabled);
        },

        onPageLoad:function (aEvent) {
            var document = aEvent.originalTarget;
            var regexpAdFile = /\.a(sciidoc|doc|d)$/i;
            if (regexpAdFile.test(document.location)) {
                var contentType = document.contentType;
                if (isAddonEnabled()) {
                    if (contentType && (contentType.indexOf('html') > -1)) {
                        return;
                    }
                    appendStyles(document);
                    render(document);
                }
            }
        },

        onMenuItemCommand:function (e) {
            var prefs = getAddonPrefs();
            var enabled = isAddonEnabled(prefs);

            // Switch enabled <> disabled
            enabled = !enabled;

            // Update the extension icon
            updateAddonIcon(enabled);

            // Save the new status of the extension
            prefs.setBoolPref("enabled", enabled);

            // Reload the page
            reloadPage();
        },

        onToolbarButtonCommand:function (e) {
            asciidoctorpreview.onMenuItemCommand(e);
        }
    };

    function updateAddonIcon(enabled) {
        // Update the extension icon
        var iconName = enabled ? "enabled.png" : "disabled.png";
        // There is no toolbar in Firefox Mobile
        if (document.getElementById('asciidoctorpreview-toolbar-button')) {
            document.getElementById('asciidoctorpreview-toolbar-button').style.listStyleImage = 'url("chrome://asciidoctorpreview/skin/' + iconName + '")';
        }
    }

    function reloadPage() {
        var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
            .getService(Components.interfaces.nsIWindowMediator);
        var mainWindow = wm.getMostRecentWindow("navigator:browser");
        mainWindow.gBrowser.selectedTab.linkedBrowser.reload();
    }

    function getAddonPrefs() {
        var prefs = Components.classes["@mozilla.org/preferences-service;1"]
            .getService(Components.interfaces.nsIPrefService)
            .getBranch("extensions.asciidoctorpreview.");
        prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
        return prefs;
    }

    function isAddonEnabled(prefs) {
        if (typeof prefs === 'undefined') {
            prefs = getAddonPrefs();
        }
        var enabled = prefs.getBoolPref("enabled");
        return enabled;
    }

    /**
     * Render AsciiDoc content as HTML
     */
    function render(document) {
        var content = document.firstChild;
        var data = content.textContent;
        document.body.innerHTML = '';
        var generatedHtml = Opal.Asciidoctor.$render(data, ASCIIDOCTOR_OPTIONS);
        document.body.innerHTML = "<div id='content'>" + generatedHtml + "</div>";
    }

    /**
     * Append css files
     */
    function appendStyles(document) {
        var asciidoctorLink = document.createElement('link');
        asciidoctorLink.rel = 'stylesheet';
        asciidoctorLink.id = 'asciidoctor-style';
        asciidoctorLink.href = "resource://asciidoctorpreview/asciidoctor.css";
        document.head.appendChild(asciidoctorLink);
    }
}
