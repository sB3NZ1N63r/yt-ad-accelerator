const selectors = {
    skipButton: [
        ".ytp-ad-skip-button-modern",
        ".ytp-ad-skip-button",
        "#ytp-ad-skip-button-modern ytp-button",
        ".ytp-ad-skip-button ytp-button",
        ".ytp-ad-skip-button-container",
        ".ytp-skip-ad-button",
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
                    this.log('...video ready', this.cache.video.baseURI);
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
                //const dislikeButton = document.querySelectorAll(selectors.dislikeButton)[0];

                // Make sure buttons exist and visible
                if (skipButton && skipButton.checkVisibility()) { //(skipButton && dislikeButton) {
                    // Store buttons
                    this.cache.skipButton = skipButton;
                    //this.cache.dislikeButton = dislikeButton;

                    this.log('...buttons ready');
                    clearInterval(interval);
                    resolve();
                } else {
                    this.cache.skipButton = null;
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

        if (!this.cache.skipButton) {
            this.log('buttons are lost');
            return;
        }

        if (!enabled) {
            this.log('skip ad by button', enabled);
            return;
        }

        this.cache.skipButton.click();
        this.log('skip button clicked');
        this.pause();
    }

    waitAdVideoEnd(video) {
        this.log('waiting for end ad video...');

        return new Promise((resolve) => {
            const interval = setInterval(() => {
                if (video.currentTime >= video.duration - 1.0 || video.ended) {
                    this.log('...ad video finished');
                    clearInterval(interval);
                    resolve();
                }
            }, 1000);
        });
    }

    async manipulateAdVideo(adVideo, button) {
        if (!adVideo) { return; }
        if (!adVideo.muted) {
            adVideo.volume = 0;
            adVideo.muted = true;
            adVideo.defaultMuted = true;
        }

        const rateMin = parseFloat(this.options.playbackRateMin);
        const rateMax = parseFloat(this.options.playbackRateMax);
        let rate = rateMin;

        if (button) { //(button && button.checkVisibility()) {
            if (adVideo.duration !== null && adVideo.currentTime !== null) {
                this.log("adVideo.duration", adVideo.duration);
                //this.log("adVideo.currentTime", adVideo.currentTime)

                const durationTrigger = parseFloat(this.options.durationTrigger);
                const currentTimeStart = 10;
                const currentTimeEnd = adVideo.duration - 8;

                if (
                    adVideo.duration > durationTrigger &&
                    adVideo.currentTime > currentTimeStart &&
                    adVideo.currentTime < currentTimeEnd
                ) {
                    rate = rateMax;
                }
            } else if (!adVideo.duration || adVideo.duration == 'NaN') {
                this.log('adVideo.duration are lost');
            }
        } else {
            this.log('test progress bar');
            //handleProgressBar();
        }

        if (adVideo.playbackRate !== rate) {
            this.log('set playback rate to ', rate);
            adVideo.playbackRate = rate;
            adVideo.defaultPlaybackRate = rate;
        }
    }

    /**
     * Starts the liking magic.
     * The liker won't do anything unless this method is called.
     */
    async start() {
        this.log('YT_AdAccelerator status: running');
        this.status = 'running';
        this.cache = {};

        await this.waitForVideo();
        const { video } = this.cache;
        let onVideoTimeUpdateAdded = false;
        let lastVideoBaseURI = '';
        let skipButtonReady = false;
        let videoCurrentTime = -1;

        const onVideoTimeUpdate = (e) => {
            if (!this.isAdPlaying()) {
                if (video) { videoCurrentTime = video.currentTime; }
                return;
            }

            this.log("videoCurrentTime: ", videoCurrentTime);
            if (video) { this.log("adVideoCurrentTime: ", video.currentTime); }

            if (!skipButtonReady) {
                this.manipulateAdVideo(video, null);
            } 

            this.clickSkip(this.options.skipAdByClick);
            skipButtonReady = this.cache.skipButton !== null;

            if (skipButtonReady) {
                this.manipulateAdVideo(video, this.cache.skipButton);
            }

            if (!lastVideoBaseURI.startsWith(video.baseURI, 0)) {
                this.log("remove onVideoTimeUpdate", video.baseURI);
                video.removeEventListener('timeupdate', onVideoTimeUpdate);
            }
        };

        if (video.baseURI.startsWith("https://www.youtube.com/watch", 0) && !lastVideoBaseURI.startsWith(video.baseURI, 0)) {
            lastVideoBaseURI = video.baseURI;

            this.log("add onVideoTimeUpdate");
            video.addEventListener('timeupdate', onVideoTimeUpdate);
        }
    }
}
