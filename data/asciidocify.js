var asciidocify = {

    load:function () {
        var contentType = document.contentType;
        var regexpAdFile = /\.a(sciidoc|doc|d|sc)$/i;
        var isAdFile = regexpAdFile.test(document.location);
        var isHtmlContent = contentType && (contentType.indexOf('html') > -1);
        if (isAdFile && !isHtmlContent) {
            appendStyles(document);
            render(document);
        }
    }
};

var ASCIIDOCTOR_OPTIONS = Opal.hash2([ 'attributes' ], {
    'attributes':[ 'showtitle', 'toc!', 'toc2!' ]
});

/**
 * Render AsciiDoc content as HTML
 */
function render(document) {
    var data = document.firstChild.textContent;
    document.body.innerHTML = '';
    var generatedHtml = undefined;
    try {
        try {
            // if charset is not UTF-8, try techniques to coerce it to UTF-8
            // likely used only for local files
            if (document.characterSet.toUpperCase() != 'UTF-8') {
                try {
                    // this technique works if all characters are in standard ASCII set
                    // see: http://www.ascii-code.com
                    data = decodeURIComponent(escape(data));
                } catch (decodeError) {
                    // XMLHttpRequest responseText is UTF-8 encoded by default
                    try {
                        var xhr = new XMLHttpRequest();
                        xhr.open('GET', window.location.href, false);
                        xhr.addEventListener('load', function() {
                            data = xhr.responseText;
                        });
                        xhr.send();
                    } catch (xhrError) {}
                }
            }
        } catch (e) {}
        generatedHtml = Opal.Asciidoctor.$render(data, ASCIIDOCTOR_OPTIONS);
    }
    catch (e) {
        showErrorMessage(e.name + " : " + e.message);
        return;
    }
    document.body.innerHTML = '<div id="content">' + generatedHtml + '</div>';
}

/**
 * Append css files
 */
function appendStyles(document) {
    var asciidoctorLink = document.createElement('link');
    asciidoctorLink.rel = 'stylesheet';
    asciidoctorLink.id = 'asciidoctor-style';
    asciidoctorLink.href = "resource://asciidoctor-firefox-addon-at-asciidoctor-dot-org/asciidoctorjslivepreview/data/asciidoctor.css";
    document.head.appendChild(asciidoctorLink);
}

/**
 * Show error message
 * @param message The error message
 */
function showErrorMessage(message) {
    var messageText = "<p>" + message + "</p>";
    document.body.innerHTML = "<div id='content'><h4>Error</h4>" + messageText + "</div>";
}
