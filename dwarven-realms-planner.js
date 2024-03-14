document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.querySelector('canvas');
    const ctx = canvas.getContext("2d");

    loadAndDrawBackdrop(canvas, ctx);
});

function loadAndDrawBackdrop(canvas, ctx) {
    const backdrop = new Image();
    backdrop.onload = image => drawBackground(image, canvas, ctx);
    backdrop.src = './resources/tree_blank.png';
}

function drawBackground(image, canvas, ctx) {
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    ctx.drawImage(image, 0, 0);
}