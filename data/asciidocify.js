var asciidocify = {
  load: function() {
    var contentType = document.contentType;
    // ending with .asciidoc, .adoc, .ad or .asc OR containing .asciidoc?, .adoc?, .ad? or .asc?
    var regexpAdFile = /\.a(sciidoc|doc|d|sc)$|\.a(sciidoc|doc|d|sc)\?|/i;
    var isAsciiDocFile = regexpAdFile.test(document.location);
    var isHTMLContent = contentType && (contentType.indexOf('html') > -1);
    if (isAsciiDocFile && !isHTMLContent) {
      convertSanitizeAndRender();
    }
  }
};

/**
 * Build Asciidoctor options
 */
function buildAsciidoctorOptions() {
  // Preferences
  var preferences = self.options.preferences;
  var customAttributes = preferences.customAttributes;
  var safeMode = preferences.safeMode;
  // Default attributes
  var attributes = 'showtitle icons=font@ platform=opal platform-opal env=browser env-browser chart-engine=chartist data-uri!';
  var href = window.location.href;
  var fileName = href.split('/').pop();
  var fileExtension = fileName.split('.').pop();
  if (customAttributes) {
    attributes = attributes.concat(' ').concat(customAttributes);
  }
  if (fileExtension !== '') {
    attributes = attributes.concat(' ').concat('outfilesuffix=.').concat(fileExtension);
  }
  var pwd = Opal.File.$dirname(href);
  Opal.ENV['$[]=']("PWD", pwd);
  return Opal.hash2(['base_dir', 'safe', 'backend', 'attributes'], {
    'base_dir': pwd,
    'safe': safeMode,
    // Force backend to html5
    'backend': 'html5',
    'attributes': attributes
  });
}

/**
 * Convert AsciiDoc content as HTML and render in web view
 */
function convertSanitizeAndRender() {
  // If charset is not UTF-8, try techniques to coerce it to UTF-8 (likely used only for local files)
  // Maybe one day this will be the default behavior https://bugzilla.mozilla.org/show_bug.cgi?id=1071816
  if (document.characterSet.toUpperCase() != 'UTF-8') {
    try {
      // This technique works if all characters are in standard ASCII set
      // see: http://www.ascii-code.com
      showHTML(convertToHTML(decodeURIComponent(escape(document.firstChild.textContent))));
    } catch (decodeError) {
      // XMLHttpRequest responseText is UTF-8 encoded by default
      var xhr = new XMLHttpRequest();
      xhr.open('GET', window.location.href, true);
      xhr.onload = function (evt) {
        if (xhr.readyState === 4) {
          // NOTE status is 0 for local files (i.e., file:// URIs)
          if (xhr.status === 200 || xhr.status === 0) {
            showHTML(convertToHTML(xhr.responseText));
          } else {
            console.error('Could not read AsciiDoc source. Reason: [' + xhr.status + '] ' + xhr.statusText);
          }
        }
      };
      xhr.onerror = function (evt) {
        console.error(xhr.statusText);
      };
      xhr.send();
    }
  } else {
    showHTML(convertToHTML(document.firstChild.textContent));
  }
}

/**
 * Convert AsciiDoc to HTML
 * @param content
 * @return {*}
 */
function convertToHTML(content) {
  var asciidoctorDocument = Opal.Asciidoctor.$load(content, buildAsciidoctorOptions());
  document.title = asciidoctorDocument.$doctitle(Opal.hash({sanitize: true}));
  document.body.className = asciidoctorDocument.$doctype();
  var maxWidth = asciidoctorDocument.$attr('max-width');
  if (maxWidth) {
    document.body.style.maxWidth = maxWidth;
  }
  return asciidoctorDocument.$convert();
}

/**
 * Show the HTML.
 *
 * @param html The sanitized HTML to show in the web view.
 */
function showHTML(html) {
  // Save <script> before updating document body
  var scripts = document.querySelectorAll('script');
  // Empty document body
  emptyBody();
  appendStyles();
  // Append to document body
  var contentDiv = createContentDiv();
  contentDiv.innerHTML = html;
  document.body.appendChild(contentDiv);
  // Append saved <script> to document body
  appendScripts(scripts);
}

/**
 * Show error message
 * @param message The error message
 */
function showErrorMessage(message) {
  // Create a title
  var title = document.createElement("h2");
  title.textContent = 'AsciiDoc conversion failed!';
  // Create a paragraph with the error message
  var paragraph = document.createElement("p");
  paragraph.appendChild(document.createTextNode(message));
  // Empty document body
  emptyBody();
  // Append to document body
  var contentDiv = createContentDiv();
  contentDiv.appendChild(title);
  contentDiv.appendChild(paragraph);
  document.body.appendChild(contentDiv);
}

/**
 * Clear all nodes from body of document.
 */
function emptyBody() {
  var node = document.body;
  while (node.hasChildNodes()) {
    node.removeChild(node.lastChild);
  }
}

/**
 * Append CSS files for styling the generated HTML.
 */
function appendStyles() {
  var asciidoctorLink = document.createElement('link');
  asciidoctorLink.rel = 'stylesheet';
  asciidoctorLink.id = 'asciidoctor-style';
  asciidoctorLink.href = 'resource://asciidoctor-firefox-addon-at-asciidoctor/data/css/asciidoctor.css';
  document.head.appendChild(asciidoctorLink);

  var fontAwesomeLink = document.createElement('link');
  fontAwesomeLink.rel = 'stylesheet';
  fontAwesomeLink.id = 'fontawesome-style';
  fontAwesomeLink.href = 'resource://asciidoctor-firefox-addon-at-asciidoctor/data/css/font-awesome.min.css';
  document.head.appendChild(fontAwesomeLink);
}

/**
 * Create a div element with id 'content'
 */
function createContentDiv() {
  var contentDiv = document.createElement('div');
  contentDiv.id = 'content';
  return contentDiv;
}

/**
 * Append <script> to document body.
 */
function appendScripts(scripts) {
  var length = scripts.length;
  for (var i = 0; i < length; i++) {
    var script = scripts[i];
    document.body.appendChild(script);
  }
}
