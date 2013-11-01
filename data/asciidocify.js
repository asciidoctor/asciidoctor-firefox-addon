var asciidocify = {

    load:function () {
        var contentType = document.contentType;
        var regexpAdFile = /\.a(sciidoc|doc|d)$/i;
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
    asciidoctorLink.href = "resource://asciidoctor-firefox-addon-at-asciidoctor-dot-org/asciidoctorjslivepreview/data/asciidoctor.css";
    document.head.appendChild(asciidoctorLink);
}