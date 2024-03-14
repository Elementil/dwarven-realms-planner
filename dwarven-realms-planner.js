document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.querySelector('canvas');
    const ctx = canvas.getContext("2d");

    loadAndDrawBackdrop();
});

function loadAndDrawBackdrop() {
    const backdrop = new Image();
    backdrop.onload = drawBackground;
    backdrop.src = './resources/tree_blank.png';
}

function drawBackground() {
    canvas.width = this.naturalWidth;
    canvas.height = this.naturalHeight;
    ctx.drawImage(this, 0, 0);
}