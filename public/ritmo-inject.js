const { ipcRenderer } = require('electron');

console.log('ritmo-inject');

const STATUS_ONLINE = 'Escuchando la radio';

onload = () => {
    console.log('ritmo-inject onload');
    // Options for the observer (which mutations to observe)
    const config = { childList: true, subtree: true };

    // Callback function to execute when mutations are observed
    const callback = function (mutationsList) {
        for (const mutation of mutationsList) {
            if (mutation.type == 'childList') {
                const text = mutation.target.textContent.trim();
                console.log(text);

                if (
                    mutation.target.id === 'titletext' ||
                    (mutation.target.id === 'status' && text === STATUS_ONLINE)
                ) {
                    const msg = songMessage(
                        artistElement.textContent,
                        titleElement.textContent
                    );
                    notifySongChanged(msg);
                }
            }
        }
    };

    // Detect song change
    const titleElement = document.querySelector('#titletext');
    const artistElement = document.querySelector('#artisttext');
    const statusElement = document.querySelector('#status');

    // Create an observer instance linked to the callback function
    let observer = new MutationObserver(callback);
    // Start observing the target node for configured mutations
    observer.observe(titleElement, config);
    observer.observe(statusElement, config);

    console.log(statusElement.textContent.trim());
    if (statusElement.textContent.trim() === STATUS_ONLINE) {
        const msg = songMessage(
            artistElement.textContent,
            titleElement.textContent
        );
        notifySongChanged(msg);
    }

    // mouse right button click
    document.addEventListener(
        'contextmenu',
        () => ipcRenderer.send('radio-contextmenu'),
        false
    );
};

const songMessage = function (artist, title) {
    return {
        artist,
        title,
    };
};

const notifySongChanged = function (msg) {
    ipcRenderer.send('songChanged', msg);
};

ipcRenderer.on('play', () => {
    document.querySelector('#playButton').click();
    // document.querySelector('button.close').click();
});

ipcRenderer.on('pause', () => {
    document.querySelector('#pauseButton').click();
});
