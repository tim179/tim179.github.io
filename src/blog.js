// Set alt of figure image to figure title
let figures = document.getElementsByClassName("blog-post-figure");
for (let figure of figures) {
    let images = figure.getElementsByTagName("img");
    if (images.length === 0) continue;
    let title = figure.getElementsByTagName("span")[0];
    images[0].alt = title.textContent;
}