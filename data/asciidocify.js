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
    'attributes':[ 'notitle!' ]
});

/**
 * Render AsciiDoc content as HTML
 */
function render(document) {
    var data = document.firstChild.textContent;
    document.body.innerHTML = "";
    var generatedHtml = undefined;
    try {
        generatedHtml = Opal.Asciidoctor.$render(data, ASCIIDOCTOR_OPTIONS);
    }
    catch (e) {
        showErrorMessage(e.name + " : " + e.message);
        return;
    }
    document.body.innerHTML = "<div id='content'>" + generatedHtml + "</div>";
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