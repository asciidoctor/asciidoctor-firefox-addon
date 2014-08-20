exports.main = function () {

  var widgets = require("sdk/widget");
  var tabs = require("sdk/tabs");
  var self = require("sdk/self");
  var data = self.data;
  var preferences = require("sdk/preferences/service");

  tabs.on("ready", renderAsciidoc);

  function renderAsciidoc(tab) {
    if (preferences.get("asciidoctorlivepreview.enabled", true)) {
      var worker = tab.attach({
        contentScriptFile:[data.url("opal.js"),
          data.url("asciidoctor.js"),
          data.url("asciidocify.js")],
        contentScript:'asciidocify.load();'
      });
      worker.on('message', function (message) {
        // process "unsafe" HTML
        var html = sanitizeHTML(message.html, true);
        // send back safe HTML
        worker.port.emit("asciidoctorCleanHtml", {data: html});
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

var {Cc, Ci} = require("chrome");

/**
 * Parses a string into an HTML document, sanitizes the document,
 * and returns the result serialized to a string.
 * @param {string} html The HTML fragment to parse.
 * @param {boolean} allowStyle If true, allow <style> nodes and
 *     style attributes in the parsed fragment. Gecko 14+ only.
 */
function sanitizeHTML(html, allowStyle) {
  var parser = Cc["@mozilla.org/parserutils;1"].getService(Ci.nsIParserUtils);
  return parser.sanitize(html, allowStyle ? parser.SanitizerAllowStyle : 0);
}

/**
 * Safely parse an HTML fragment, removing any executable
 * JavaScript, and return a document fragment.
 *
 * @param {Document} doc The document in which to create the
 *     returned DOM tree.
 * @param {string} html The HTML fragment to parse.
 * @param {boolean} allowStyle If true, allow <style> nodes and
 *     style attributes in the parsed fragment. Gecko 14+ only.
 * @param {nsIURI} baseURI The base URI relative to which resource
 *     URLs should be processed. Note that this will not work for
 *     XML fragments.
 * @param {boolean} isXML If true, parse the fragment as XML.
 * @see https://developer.mozilla.org/en-US/Add-ons/Overlay_Extensions/XUL_School/DOM_Building_and_HTML_Insertion
 */
function parseHTML(doc, html, allowStyle, baseURI, isXML) {
  const PARSER_UTILS = "@mozilla.org/parserutils;1";
  // User the newer nsIParserUtils on versions that support it.
  if (PARSER_UTILS in Cc) {
    let parser = Cc[PARSER_UTILS].getService(Ci.nsIParserUtils);
    if ("parseFragment" in parser)
      return parser.parseFragment(html, allowStyle ? parser.SanitizerAllowStyle : 0,
          !!isXML, baseURI, doc.documentElement);
  }
  return Cc["@mozilla.org/feed-unescapehtml;1"]
      .getService(Ci.nsIScriptableUnescapeHTML)
      .parseFragment(html, !!isXML, baseURI, doc.documentElement);
}

/**
 * @see https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIURI
 */
function makeURI(aURL, aOriginCharset, aBaseURI) {
  var ioService = Cc["@mozilla.org/network/io-service;1"]
      .getService(Ci.nsIIOService);
  return ioService.newURI(aURL, aOriginCharset, aBaseURI);
}