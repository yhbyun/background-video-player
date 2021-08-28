import fetch from 'node-fetch';
import cheerio from 'cheerio';

export const getLyric = async (song) => {
    console.log('getLyrics', song);
    let query = song + ' site:https://www.letras.com';
    let url = 'https://www.google.com/search?q=' + encodeURIComponent(query);
    let lyricUrl;

    // Cannot parse google search result page using cheerio. Don't know why???
    fetch(url)
        .then((res) => res.text())
        .then((html) => {
            let start = html.indexOf('<a href="/url?q=');
            if (start > 0) {
                let end = html.indexOf('&amp;', start + 9);
                lyricUrl = html.substring(start + 16, end - 1);
                console.log('lyric ur', lyricUrl);
            }

            if (!lyricUrl) {
                throw Error('Lyrics not found');
            }

            return fetch(lyricUrl);
        })
        .then((res) => res.text())
        .then((html) => {
            let $ = cheerio.load(html);
            const data = $('.cnt-letra');

            let lyricHtml = data.html();
            if (!lyricHtml) {
                throw Error('Lyrics div not found');
            }
            lyricHtml = `<div class="text-blue-500 font-bold mb-4">${song}</div>${lyricHtml}`;
            return lyricHtml;
        });
};
