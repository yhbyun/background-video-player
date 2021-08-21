<template>
    <div class="radial-wrap">
        <div
            class="radial-btn"
            :class="{ 'btn-rotate': expanded }"
            title="Toggle"
            ref="radialBtn"
            @click="toggleMenus"
        >
            <div>+</div>
        </div>
        <ul
            class="radial"
            :class="{
                'radial-init': neverExanpded,
                fade: menuClicked,
                expand: expanded,
            }"
            ref="radial"
        >
            <li>
                <a href="#" @click="handleMenuClicked($event, 'YouTube')">
                    <span
                        ><font-awesome-icon :icon="['fab', 'youtube']"
                    /></span>
                </a>
            </li>
            <li>
                <a href="#" @click="handleMenuClicked($event, 'Netflix')">
                    <span>
                        <icon-base
                            viewBox="0 0 512 512"
                            width="24"
                            height="24"
                            icon-name="netflix"
                        >
                            <icon-netflix />
                        </icon-base>
                    </span>
                </a>
            </li>
            <li>
                <a href="#" @click="handleMenuClicked($event, 'history-back')">
                    <span><font-awesome-icon icon="arrow-left" /></span>
                </a>
            </li>
            <li>
                <a href="#" @click="handleMenuClicked"><span></span></a>
            </li>
            <li>
                <a href="#" @click="handleMenuClicked"><span></span></a>
            </li>
            <li>
                <a href="#" @click="handleMenuClicked"><span></span></a>
            </li>
        </ul>
    </div>
</template>

<script>
import IconNetflix from '@/components/icons/IconNetflix.vue';
import EventBus from '../EventBus';

export default {
    name: 'RadialMenu',
    props: {
        reset: Boolean,
    },
    components: {
        IconNetflix,
    },
    data() {
        return {
            expanded: false,
            neverExanpded: true,
            menuClicked: false,
        };
    },
    watch: {
        reset(reset) {
            if (reset) {
                this.resetMenu();
            }
        },
    },
    methods: {
        toggleMenus() {
            this.expanded = !this.expanded;
            this.neverExanpded = false;
            this.menuClicked = false;

            Array.from(document.querySelectorAll('.radial li a')).forEach(
                (el) => el.classList.remove('clicked')
            );
        },
        handleMenuClicked({ currentTarget }, service) {
            this.expanded = !this.expanded;
            this.menuClicked = true;
            currentTarget.classList.add('clicked');

            setTimeout(() => this.resetMenu(), 500);

            if (service === 'history-back') {
                EventBus.$emit('history-back');
            } else {
                EventBus.$emit('change-service', service);
            }
        },
        resetMenu() {
            this.expanded = false;
            this.menuClicked = false;
            this.neverExanpded = true;
        },
    },
};
</script>

<style lang="scss">
$n: 4;
$r: 108deg / $n;
$button-width: 50px;
$item-width: 40px;

$d1: ($r * 0);
$d2: ($r * 1);
$d3: ($r * 2);
$d4: ($r * 3);
$d5: ($r * 4);
$d6: ($r * 5);

.hovering .radial-wrap .radial-btn {
    display: flex;
}

.radial-wrap {
    position: relative;
    height: 191px;

    .radial {
        position: relative;
        margin: 0 0 1px 6px;
        line-height: 0;

        & > li {
            position: absolute;
            display: block;
            height: 170px;
            background: yellow;
            // rotate 중심
            // transform-origin: (25px / 2) bottom;
            transform-origin: 19px bottom;

            // Transform loop
            // 일정한 각도로 원호에 배치함
            @for $i from 1 through $n {
                &:nth-of-type(#{$i}) {
                    transform: rotate($r * ($i - 1));
                }
            }

            a {
                position: absolute;
                display: block;
                width: $item-width;
                height: $item-width;
                //overflow: hidden;
                //text-indent: -99999px;
                color: white;
                font-size: 20px;
                background: #444;
                border: 3px solid #fff;
                border-radius: 50%;
                box-shadow: rgba(0, 0, 0, 0.4) 0 0 5px 0,
                    rgba(0, 0, 0, 0.2) 0 0 0 1px,
                    inset rgba(0, 0, 0, 0.5) 0 0 2px 0;

                &:active {
                    background: #000;
                    border-color: #555;

                    span {
                        opacity: 0.3;
                    }
                }

                span {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    width: 100%;
                    height: 100%;
                    // width: 26px;
                    // height: 26px;
                    // background: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='16px' height='16px'><path fill='#fff' d='M11.045,9.879l1.906,6.114l-4.949-3.791L3.059,16l1.9-6.117L0,6.114l6.123,0.013L7.998,0l1.879,6.12L16,6.104L11.045,9.879z'/></svg>")
                    //     no-repeat center center;
                    // background-size: 16px 16px;
                    // mask-image: url(star.svg);
                }
            }
        }
    }

    // Triggers
    .radial-init li {
        display: none;
    }

    // 6개 중 안 사용하는 나머지는 hidden
    .radial li {
        @for $i from $n + 1 through 6 {
            &:nth-of-type(#{$i}) {
                display: none;
            }
        }
    }

    // Normal
    .radial li a {
        top: 150px;
        opacity: 0;
        animation: contract 0.35s ease-out 1 backwards;
    }

    // Active
    // radial 버튼 클릭시 메뉴 아이템의 위치
    .radial.expand li {
        @for $i from 1 through $n {
            &:nth-of-type(#{$i}) a {
                top: 10px;
                opacity: 1;
                animation: expand 0.6s ease 1 backwards;
            }
        }
    }

    // Clicked
    .radial.fade li a.clicked {
        top: 10px;
        animation: clicked 0.5s ease-out 1 forwards;
    }

    .radial.fade li a:not(.clicked) {
        top: 10px;
        animation: fade 0.5s ease-out 1 forwards;

        span {
            opacity: 0.1;
            transition: opacity 0.5s ease;
        }
    }

    // Animation loop
    @for $i from 1 through $n {
        .radial li:nth-of-type(#{$i}) a {
            animation-delay: (0.2s - 0.04s * ($i - 1));
        }
        .radial li:nth-of-type(#{$i}) a:not(.clicked) span {
            animation: 'spin#{$i}-contract .9s ease-out 1 backwards';
        }
        .radial.expand li:nth-of-type(#{$i}) a {
            animation-delay: (0.04s * ($i - 1));
        }
        .radial.expand li:nth-of-type(#{$i}) a span {
            transform: rotate(-($r * ($i - 1)));
            animation: 'spin#{$i}-expand .6s ease-out 1 backwards';
        }
        .radial.fade li:nth-of-type(#{$i}) a.clicked span {
            transform: rotate(-($r * ($i - 1)));
        }

        &:nth-of-type(#{$i}) {
            transform: rotate($r * ($i - 1));
        }
    }

    .radial-btn {
        display: none;
        position: absolute;
        bottom: 0;
        left: 0;
        z-index: 9999;
        width: $button-width;
        height: $button-width;
        overflow: hidden;
        // background: #f76f54;
        // background: linear-gradient(
        //     top,
        //     #f76f54 0,
        //     #dd3535 49%,
        //     #d32121 51%,
        //     #c61f1f 100%
        // );
        border: 1px solid #fff;
        border-radius: 50%;
        outline: none;
        opacity: 0.45;
        z-index: 11111;
        // box-shadow: rgba(0, 0, 0, 0.3) 0 3px 8px 0, rgba(0, 0, 0, 0.2) 0 0 0 1px,
        //     inset rgba(0, 0, 0, 0.3) 0 0 0 1px,
        //     inset rgba(255, 255, 255, 0.3) 0 1px 0 1px;
        cursor: pointer;
        justify-content: center;
        align-items: center;

        &:hover {
            opacity: 1;
            background-color: black;
        }

        > div {
            text-align: center;
            width: $button-width - 14;
            height: $button-width - 14;
            font-size: 22px;
            font-weight: bold;
            color: white;
            transition: transform 0.4s ease;
        }

        &.btn-rotate div {
            transform: rotate(135deg);
        }
    }

    @keyframes expand {
        0% {
            opacity: 0;
            top: 150px;
        }
        10% {
            opacity: 1;
        }
        50% {
            top: -10px;
        }
        70% {
            top: 15px;
        }
        100% {
            top: 10px;
        }
    }

    @keyframes contract {
        0% {
            opacity: 1;
            top: 10px;
        }
        40% {
            opacity: 1;
            top: -25px;
        }
        100% {
            opacity: 0;
            top: 150px;
        }
    }

    // A small trick
    // A small trick
    @keyframes clicked {
        0% {
            transform: scale(1);
            opacity: 1;
            top: 10px;
        }
        90% {
            top: 10px;
        }
        99% {
            transform: scale(6);
            opacity: 0;
            top: 150px;
        }
        100% {
            transform: scale(0);
        }
    }

    @keyframes fade {
        0% {
            transform: scale(1);
            opacity: 1;
            top: 10px;
        }
        90% {
            opacity: 0;
            top: 10px;
        }
        99% {
            transform: scale(0);
            top: 150px;
        }
        100% {
            transform: scale(0);
        }
    }

    $list: #{$d1} #{$d2} #{$d3} #{$d4} #{$d5} #{$d6};

    @mixin get-from-list1($index) {
        transform: rotate((0 - nth($list, $index)));
    }

    @mixin get-from-list2($index) {
        transform: rotate((-360deg - nth($list, $index)));
    }

    // Item animation loop
    @for $i from 1 through $n {
        @keyframes spin#{$i}-expand {
            0% {
                @include get-from-list1($i);
            }
            60% {
                @include get-from-list2($i);
            }
            100% {
                @include get-from-list2($i);
            }
        }

        @keyframes spin#{$i}-contract {
            0% {
                @include get-from-list1($i);
            }
            50% {
                transform: rotate(360deg);
            }
            100% {
                transform: rotate(360deg);
            }
        }
    }
}
</style>
