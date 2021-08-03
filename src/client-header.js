const body = document.querySelector('body');
body.addEventListener('mouseenter', mouseEnter, false);
body.addEventListener('mouseleave', mouseLeave, false);

function mouseEnter() {
    window.ipcRenderer.send('mouseEnter');
}

function mouseLeave() {
    window.ipcRenderer.send('mouseLeave');
}
