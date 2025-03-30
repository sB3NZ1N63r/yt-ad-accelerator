const selectors = {
    skipButton: [
        "ytp-ad-skip-button-modern",
        "ytp-ad-skip-button",
        "ytp-ad-skip-button-modern ytp-button",
        "ytp-ad-skip-button ytp-button",
        "ytp-ad-skip-button-container",
        "ytp-skip-ad-button",
    ],
    dislikeButton: [
        '#top-level-buttons-computed > ytd-toggle-button-renderer:nth-child(2) yt-icon-button',
        '#top-level-buttons-computed > ytd-toggle-button-renderer:nth-child(2) button',
        '#segmented-dislike-button button',
        'dislike-button-view-model button',
    ],
};

export default class YT_AdAccelerator {
    /**
     * @param {Object} options
     * @param {Object} log
     */
    constructor({options, log}) {
        this.options = options;
        this.status = 'idle';
        this.log = log ? log : () => {};
        this.cache = {};
        this.start = this.start.bind(this);

        // Bail if we don't need to do anything
        if (this.options.disabled) {
            this.log('YT_AdAccelerator is disabled');
            return this.pause();
        }

        /*
        We're hooking into YouTube's custom events to determine when the page changes.
         */
        document
            .querySelector('ytd-app')
            .addEventListener('yt-page-data-updated', this.start);

        this.start();
    }

    /**
     * Just helpful for debugging at the moment
     */
    pause() {
        this.log('status: idle');
        this.status = 'idle';

        if (typeof this.onPause === 'function') {
            this.onPause();
        }
    }

    /**
     * Clears data for another round of slick liking action
     */
    reset() {
        this.cache = {};
    }

    /**
     * Detects when the video player has loaded
     */
    waitForVideo() {
        this.log('waiting for video...');

        return new Promise((resolve) => {
            const interval = setInterval(() => {
                this.cache.video = document.querySelector('.video-stream');
                // Does the video exist?
                if (this.cache.video) {
                    this.log('...video ready');
                    clearInterval(interval);
                    resolve();
                }
            }, 1000);
        });
    }

    isAdPlaying() {
        return (
            this.cache.video &&
            ['ad-showing', 'ad-interrupting'].every((c) => {
                return this.cache.video
                    .closest('.html5-video-player')
                    .classList.contains(c);
            })
        );
    }

    /**
     * Detects when skip button have loaded (so we can press them)
     */
    waitForButtons() {
        this.log('waiting for buttons...');

        return new Promise((resolve) => {
            const interval = setInterval(() => {
                const skipButton = document.querySelectorAll(selectors.skipButton)[0];
                const dislikeButton = document.querySelectorAll(
                    selectors.dislikeButton
                )[0];
                // Make sure both buttons exist
                if (skipButton && dislikeButton) {
                    // Store buttons
                    this.cache.skipButton = skipButton;
                    this.cache.dislikeButton = dislikeButton;

                    this.log('...buttons ready');
                    clearInterval(interval);
                    resolve();
                }
            }, 1000);
        });
    }

    /**
     * Make sure we can & should skip the ad,
     * then clickity click the button
     */
    async clickSkip(enabled) {
        await this.waitForButtons();

        if (!this.cache.skipButton.checkVisibility()) {
            this.log('skip button not visible');
            return;
        }
        if (!enabled) {
            this.log('skip ad by button', enabled);
            return;
        }

        this.cache.skipButton.click();
        this.log('like button clicked');
        this.pause();
    }

    /**
     * Starts the liking magic.
     * The liker won't do anything unless this method is called.
     */
    async start() {
        this.log('status: running');
        this.status = 'running';
        this.cache = {};

        const playbackRateMin = parseFloat(this.options.playbackRateMin);
        const playbackRateMax = parseFloat(this.options.playbackRateMax);
        const adDurationStart = parseFloat(this.options.skipAdDurationStart);
        const adDurationEnd = 8;

        await this.waitForVideo();
        const { video } = this.cache;

        const onVideoTimeUpdate = (e) => {
            if (!this.isAdPlaying()) return;
            //if (!video.muted) {
                video.volume = 0;
                video.muted = true;
            //}

            let playbackRate_ = playbackRateMin;
            video.playbackRate = playbackRate_;

            this.clickSkip(this.options.skipAdByClick);

            if (this.cache.skipButton && this.cache.skipButton.checkVisibility()) {
                //log("video.duration", video.duration);
                //log("video.currentTime", video.currentTime)
                if (video.duration !== null && video.currentTime !== null) {
                    if (video.duration > adDurationStart && video.currentTime < video.duration - adDurationEnd) {
                        playbackRate_ = playbackRateMax;
                    } else if (video.currentTime > video.duration - adDurationEnd){
                        video.removeEventListener('timeupdate', onVideoTimeUpdate);
                    }
                } else {
                    //handleProgressBar();
                }
            }

            if (video.playbackRate !== playbackRate_) {
                log('set playback rate to ' + playbackRate_);
                video.playbackRate = playbackRate_;
            }
        };
        video.addEventListener('timeupdate', onVideoTimeUpdate);
    }
}
