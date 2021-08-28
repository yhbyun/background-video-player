export default {
    isYoutubeUrl(url) {
        const regExp =
            /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
        return !!url.match(regExp);
    },

    /**
     * Normalize string : ñ -> n
     */
    normalizeStr(str) {
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    },
};
