self.port.on('asciidoctorCleanHtml', function (message) {
  // create a wrapper to append the "safe html" to the DOM.
  var wrapper = document.createElement('div');
  wrapper.id = "content";
  wrapper.innerHTML = message.data;
  clearBody();
  document.body.appendChild(wrapper);
});

var asciidocify = {

  load:function () {
    var contentType = document.contentType;
    var regexpAdFile = /\.a(sciidoc|doc|d|sc)$/i;
    var isAsciiDocFile = regexpAdFile.test(document.location);
    var isHTMLContent = contentType && (contentType.indexOf('html') > -1);
    if (isAsciiDocFile && !isHTMLContent) {
      appendStyles();
      convert();
    }
  }
};

var ASCIIDOCTOR_OPTIONS = Opal.hash2([ 'attributes' ], {
  'attributes':[ 'showtitle', 'toc!', 'toc2!' ]
});

/**
 * Convert AsciiDoc content as HTML
 */
function convert() {
  try {
    try {
      // if charset is not UTF-8, try techniques to coerce it to UTF-8
      // likely used only for local files
      if (document.characterSet.toUpperCase() != 'UTF-8') {
        try {
          // this technique works if all characters are in standard ASCII set
          // see: http://www.ascii-code.com
          showGeneratedHTML(convertAsHTML(decodeURIComponent(escape(document.firstChild.textContent))));
        } catch (decodeError) {
          // XMLHttpRequest responseText is UTF-8 encoded by default
          var xhr = new XMLHttpRequest();
          xhr.open("GET", window.location.href, true);
          xhr.onload = function (e) {
            if (xhr.readyState === 4) {
              if (xhr.status === 200) {
                showGeneratedHTML(convertAsHTML(xhr.responseText));
              } else {
                console.error(xhr.statusText);
              }
            }
          };
          xhr.onerror = function (e) {
            console.error(xhr.statusText);
          };
        }
      } else {
        showGeneratedHTML(convertAsHTML(document.firstChild.textContent));
      }
    } catch (e) {
    }
  }
  catch (e) {
    showErrorMessage(e.name + ' : ' + e.message);
  }
}

/**
 * Append css files
 */
function appendStyles() {
  var asciidoctorLink = document.createElement('link');
  asciidoctorLink.rel = 'stylesheet';
  asciidoctorLink.id = 'asciidoctor-style';
  asciidoctorLink.href = 'resource://asciidoctor-firefox-addon-at-asciidoctor-dot-org/asciidoctorjslivepreview/data/asciidoctor.css';
  document.head.appendChild(asciidoctorLink);
}

/**
 * Convert AsciiDoc as HTML
 * @param data
 * @return {*}
 */
function convertAsHTML(data) {
  return Opal.Asciidoctor.$convert(data, ASCIIDOCTOR_OPTIONS);
}

/*
 * Show generated HTML
 * @param generatedHTML The generated HTML
 */
function showGeneratedHTML(html) {
  appendBody(html);
}

/**
 * Show error message
 * @param message The error message
 */
function showErrorMessage(message) {
  var html = '<h4>Error</h4><p>' + message + '</p>';
  appendBody(html);
}

function appendBody(html) {
  // send a message to the privileged add-on script main.js with "unsafe" html for sanitize/parse
  self.postMessage({url: window.location.href, html: html});
}

function clearBody() {
  var node = document.body;
  while (node.hasChildNodes()) {
    node.removeChild(node.lastChild);
  }
}