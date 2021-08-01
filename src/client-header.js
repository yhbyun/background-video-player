const body = document.querySelector('body');
body.addEventListener('mouseover', mouseOver, false);
body.addEventListener('mouseout', mouseLeave, false);

function mouseOver() {
    window.ipcRenderer.send('mouseOver', 'over');
}

function mouseLeave() {
    window.ipcRenderer.send('mouseOver', 'leave');
}
