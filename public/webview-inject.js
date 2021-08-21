const { ipcRenderer } = require('electron');

let hover = false,
    mouseMoved = false;

console.log('webview-inject.js');

document.addEventListener('mouseenter', mouseEnter);
document.addEventListener('mouseleave', mouseLeave);
document.addEventListener('mousemove', mouseMove);

// Assume mouseLeave when no mousemove for 0.5 seconds
setInterval(function () {
    if (!hover) return;

    if (!mouseMoved) {
        console.log('Force mouseLeave');
        hover = false;
        ipcRenderer.send('mouseLeave');
    } else {
        mouseMoved = false;
    }
}, 250);

function mouseEnter() {
    console.log('mouseEnter');
    hover = true;
    ipcRenderer.send('mouseEnter');
}

function mouseLeave() {
    console.log('mouseLeave');
    hover = false;
    ipcRenderer.send('mouseLeave');
}

function mouseMove(event) {
    mouseMoved = true;
    if (!hover) {
        hover = true;
        ipcRenderer.send('mouseEnter');
    }
}
