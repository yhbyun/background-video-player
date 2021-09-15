<template>
    <div ref="tooltipContainer"></div>
</template>

<script>
import { getTranslation2 } from '@/services/translate';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';

export default {
    props: {
        listenMouseMove: {
            type: Boolean,
            default: true,
        },
        detectType: {
            type: String,
            default: 'word',
        },
    },
    data() {
        return {
            clientX: 0,
            clientY: 0,
            mouseMoved: false,
            activatedWord: null,
            mousemoveEventListener: null,
            timer: null,
            tooltip: null,
        };
    },
    watch: {
        listenMouseMove(listenMouseMove) {
            listenMouseMove
                ? this.addMouseMoveListener
                : this.removeMouseMoveListener;
        },
    },
    mounted() {
        this.tooltip = tippy(this.$refs.tooltipContainer, {
            trigger: 'manual',
            theme: 'custom',
        });

        if (this.listenMouseMove) {
            this.addMouseMoveListener();
        }

        this.setTimer();
    },
    destroyed() {
        this.removeMouseMoveListener();
        this.clearTimer();
        if (this.tooltip) {
            this.tooltip.destroy();
        }
    },
    methods: {
        addMouseMoveListener() {
            console.log('addMouseMoveListener');
            document.addEventListener('mousemove', this.handleMouseMove);
        },
        removeMouseMoveListener() {
            console.log('removeMouseMoveListener');
            document.removeEventListener('mousemove', this.handleMouseMove);
        },
        handleMouseMove({ clientX, clientY }) {
            this.mouseMoved = true;
            this.clientX = clientX;
            this.clientY = clientY;

            if (this.tooltip) {
                // Change tooltip position
                this.tooltip.setProps({
                    getReferenceClientRect: () => ({
                        width: 0,
                        height: 0,
                        top: clientY,
                        bottom: clientY,
                        left: clientX,
                        right: clientX,
                    }),
                });
            }
        },
        showTooltip() {
            if (this.tooltip) {
                this.tooltip.show();
            }
        },
        hideTooltip() {
            if (this.tooltip) {
                this.tooltip.hide();
            }
        },
        setTooltipContent(content) {
            if (this.tooltip) {
                this.tooltip.setContent(content);
            }
        },
        setTimer() {
            //determineTooltipShowHide : word detection, show & hide
            this.timer = setInterval(async () => {
                if (!this.mouseMoved) return;

                //only work when tab is activated and when mousemove
                let word = this.getMouseOverWord(this.clientX, this.clientY); //get mouse positioned text
                word = this.filterWord(word); //filter out one that is url,over 1000length,no normal char

                if (word.length && this.activatedWord !== word) {
                    //show tooltip, if current word is changed and word is not none
                    const response = await this.translateSentence(word);
                    console.log('translate response', response);
                    this.activatedWord = word;

                    //if empty
                    //if tooltip is not on and activation key is not pressed,
                    //then, hide
                    if (response.translatedText === '') {
                        this.hideTooltip();
                    } else {
                        this.setTooltipContent(response.translatedText);
                        this.showTooltip();
                    }

                    // //if use_tts is on or activation key is pressed
                    // if (
                    //     currentSetting['translateTarget'] !=
                    //         response.lang &&
                    //     (currentSetting['useTTS'] == 'true' ||
                    //         keyDownList[currentSetting['keyDownTTS']])
                    // ) {
                    //     tts(word, response.lang);
                    // }
                } else if (word.length === 0 && this.activatedWord) {
                    //hide tooltip, if activated word exist and current word is none
                    this.activatedWord = null;
                    this.hideTooltip();
                }
            }, 700);
        },
        clearTimer() {
            if (this.timer) {
                clearInterval(this.timer);
            }
        },
        getMouseOverWord(clientX, clientY) {
            //get mouse positioned char
            const range = document.caretRangeFromPoint(clientX, clientY);
            //if no range or is not text, give null
            if (!range || range.startContainer.nodeType !== Node.TEXT_NODE) {
                return '';
            }

            //expand char to get word,sentence,
            range.expand(this.detectType);

            //check mouse is actually in text bound rect
            const rect = range.getBoundingClientRect(); //mouse in word rect
            if (
                rect.left > clientX ||
                rect.right < clientX ||
                rect.top > clientY ||
                rect.bottom < clientY
            ) {
                return '';
            }
            return range.toString();
        },
        filterWord(word) {
            word = word.replace(/\s+/g, ' ').trim(); //replace whitespace as single space
            if (
                word.length > 1000 || //filter out text that has over 1000length
                !/[^\s\d»«…~`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?\$\xA2-\xA5\u058F\u060B\u09F2\u09F3\u09FB\u0AF1\u0BF9\u0E3F\u17DB\u20A0-\u20BD\uA838\uFDFC\uFE69\uFF04\uFFE0\uFFE1\uFFE5\uFFE6]/g.test(
                    word
                )
            ) {
                // filter one that only include num,space and special char(include currency sign) as combination
                word = '';
            }
            return word;
        },
        async translateSentence(word) {
            console.log('translateSentence', word);

            return getTranslation2(word, { from: 'es', to: 'en' });
        },
    },
};
</script>

<style>
.tippy-box[data-theme~='custom'] {
    background-color: #10b981;
    font-size: 16px;
}

.tippy-box[data-theme~='custom'] .tippy-arrow {
    color: #10b981;
}
</style>
