import fetch from 'node-fetch';
import cheerio from 'cheerio';

export const getLyric = async (artist, title) => {
    console.log('getLyrics', artist, title);

    title = title.replace(/ *\([^)]*\) */g, '');

    const url =
        'https://search.azlyrics.com/search.php?q=' +
        encodeURIComponent(title + ' ' + artist);

    return (async () => {
        try {
            let response = await fetch(url);
            let html = await response.text();

            let $ = cheerio.load(html);
            let elem = $(
                '.col-xs-12.col-sm-10.col-sm-offset-1.col-md-8.col-md-offset-2.text-center table .text-left a'
            )[0];
            if (!elem) return;

            const lyricUrl = $(elem).attr('href');
            console.log('lyric url', lyricUrl);
            response = await fetch(lyricUrl);
            html = await response.text();

            $ = cheerio.load(html);
            elem = $('.col-xs-12.col-lg-8.text-center div:not([class])')[0];
            if (!elem) return;

            console.log('Found lyric');
            return $(elem).html();
        } catch (error) {
            console.log(error);
        }
    })();
};
