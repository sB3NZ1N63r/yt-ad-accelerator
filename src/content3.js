(() => {

    /**
    * GLOBAL VARIABLES
    */

    const playbackRate = 2;
    let currentVideoTime = 0;
    let obs1 = null;
    let obs2 = null;
    let obs3 = null;
    let obs4 = null;

    let skipAdByClick = false;
    let skipBtnCurrent = null;
    let skipBtnActive = false;

    let indicator = null
    /**
    * MAIN FUNCTIONS
    */

    const sourceCode = () => {
        // check if exist
        if (obs1) return;
        // check for element
        const condition1 = getElementByXpath('/html/body/ytd-app');
        if (!condition1) return;

        obs1 = new MutationObserver(() => {
            // check if exist
            if (obs2) return;
            // check for element
            const condition2 = getElementByXpath('//*[@id="page-manager"]');
            if (!condition2) return;

            obs2 = new MutationObserver(() => {
                // check if exist
                if (obs3) return;
                // check for element
                const condition3 = getElementByXpath('//*[@id="page-manager"]/ytd-watch-flexy');
                if (!condition3) return;

                obs3 = new MutationObserver(() => {
                    // check if exist
                    if (obs4) return;
                    // check for element
                    const condition4 = getElementByXpath('//*[@id="ytd-player"]');
                    if (!condition4) return;

                    // reload on ad blocker warnings
                    refreshOnEnforcementMessage();
                    obs4 = new MutationObserver(() => {
                        skipBtnClick();
                        adVideoManipulation();
                        actualVideoListener();
                        closeEnforcementMessage();
                        refreshOnEnforcementMessage();
                    })
                    obs4.observe(condition4, {
                        childList: true,
                        subtree: true,
                    });
                });
                obs3.observe(condition3, {
                    childList: true,
                    subtree: true,
                });
            })
            obs2.observe(condition2, {
                childList: true,
                subtree: true,
            });
        })
        obs1.observe(condition1, {
            childList: true,
            subtree: true,
        });
    }

    /**
    * HELPER FUNCTIONS
    */

    const getElementByXpath = (path) => {
        return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    }

    const skipBtnClick = () => {
        try {
            skipBtnCurrent = null;

            const skipBtn1 = getElementByXpath('//span[@class="ytp-ad-skip-button-container"]/button');
            if (skipBtn1) {
                skipBtnCurrent = skipBtn1; //skipBtn1.click();
                log('skip button found by XPath successful');
                //skipBtnInfo();
            }
            const skipBtnList = [];
            const targetClassNames = [
                "ytp-ad-skip-button-modern",
                "ytp-ad-skip-button",
                "ytp-ad-skip-button-modern ytp-button",
                "ytp-ad-skip-button ytp-button",
                "ytp-ad-skip-button-container",
                "ytp-skip-ad-button"
            ];
            targetClassNames.forEach((className) => {
                skipBtnList.push(...document.getElementsByClassName(className));
            });
            skipBtnList.push(document.querySelector('[id^="skip-button"]'));
            skipBtnList.forEach((btn) => {
                if (btn) {
                    skipBtnCurrent = btn; //btn.click();
                    log('skip button found by ClassName/ID successful');
                    //skipBtnInfo();
                }
            });

            if (skipBtnCurrent !== null) {
                //setTimeout(() => {
                    if (skipAdByClick && skipBtnCurrent.checkVisibility()) {
                        skipBtnCurrent.click();
                        console.info('skip button clicked');
                    }
                //}, 500);
            }
        } catch (err) {
            console.error(err);
        }

    }

    const skipBtnInfo = () => {
        try {
            if (skipBtnCurrent !== null) {
                //skipBtn1.click();
                console.info('skip button Information, ...');
                console.info('className = ' + skipBtnCurrent.className);
                console.info('checkVisibility = ' + skipBtnCurrent.checkVisibility());
                console.info('disabled = ' + skipBtnCurrent.disabled);
                console.info('draggable = ' + skipBtnCurrent.draggable);
                console.info('outerText = ' + skipBtnCurrent.outerText);

                //console.info('getAttributeNames = ' + skipBtnCurrent.getAttributeNames());
                console.info('getAttribute("style") = ' + skipBtnCurrent.getAttribute("style"));
                // 'display: none;' 'opacity: 0.5;'
                
            }
        } catch (err) {
            console.error(err);
        }
    }

    const adVideoManipulation = () => {
        setTimeout(() => {
            const videoElement = getElementByXpath('//*[@id="movie_player" and contains(@class, "ad-showing")]/div[1]/video');
            if (indicator && !videoElement) {
                //indicator.style.display = 'none';
                log("indicator.style.display = none")
            }

            if (!videoElement) return;

            if (!videoElement.muted) {
                videoElement.volume = 0;
                videoElement.muted = true;
            }

            let playbackRate_ = playbackRate;
            if (skipBtnCurrent !== null && skipBtnCurrent.checkVisibility()) {
                //log("videoElement.duration", videoElement.duration);
                //log("videoElement.currentTime", videoElement.currentTime)
                if (videoElement.duration !== null && videoElement.currentTime !== null) {
                    if (videoElement.duration > 20 && videoElement.currentTime < videoElement.duration - 10) {
                        playbackRate_ = playbackRate + 4;
                    }
                } else {
                    handleProgressBar();
                }
            }

            if (videoElement.playbackRate !== playbackRate_) {
                log('set playback rate to ' + playbackRate_);
                videoElement.playbackRate = playbackRate_;
            }

            let videoParentElement = videoElement.parentElement;
            //log('videoParentElement', videoParentElement.className);
            const indicator_ = videoParentElement.querySelector(':scope > .indicator');
            //log('.indicator', indicator_);
            if (indicator_) {
                //updateIndicator(playbackRate_, indicator_);
            }
        }, 100);
    }

    const actualVideoListener = () => {
        setTimeout(() => {
            const videoElement = getElementByXpath('//*[@id="movie_player" and not(contains(@class, "ad-showing"))]/div[1]/video');
            if (!videoElement) return;

            videoElement.addEventListener("timeupdate", () => {
                if (!!parseInt(videoElement.currentTime)) {
                    currentVideoTime = parseInt(videoElement.currentTime);
                }
            });
        }, 500);
    }

    const closeEnforcementMessage = () => {
        setTimeout(() => {
            const adElement = getElementByXpath('//*[@id="container" and contains(@class, "ytd-enforcement-message-view-model")]//*[@id="header" and contains(@class, "ytd-enforcement-message-view-model")]//*[@id="dismiss-button" and contains(@class, "ytd-enforcement-message-view-model")]/button-view-model/button');
            if (!adElement) return;
            adElement.click();

            console.info('enforcement message clicked');
        }, 500);
    }

    const refreshOnEnforcementMessage = () => {
        const adElement = getElementByXpath('//*[@id="container" and contains(@class, "ytd-enforcement-message-view-model")]');
        if (!adElement) return;

        const currentURL = window.location.href ?? document.URL;
        const timestamp = currentVideoTime ?? 0;
        if (currentURL && timestamp) {
            let url = new URL(currentURL);
            let params = new URLSearchParams(url.search);
            params.set("t", `${timestamp}s`);
            let newURL = new URL(`${url.origin}${url.pathname}?${params}`);
            window.location.href = newURL;

            console.info('enforcement message parameters set');
        } else {
            window.location.reload();
            console.info('enforcement message window reloaded');
        }
    }

    const handleProgressBar = () => {
        const progressBarContainer = getElementByXpath('//*[@class="ytp-progress-bar-container"]');
        if (progressBarContainer !== null) {
            //console.info('progress bar container found by Xpath');
            //console.info('className = ' + progressBarContainer.className);
            //console.info('childNodes = ' + progressBarContainer.childNodes);

            const progressBar = progressBarContainer.querySelector("div.ytp-progress-bar")
            if (progressBar !== null) {
                //console.info('progress bar container found by querySelector');
                console.info('className = ' + progressBar.className);
                //console.info('childNodes = ' + progressBar.childNodes);

                //console.info('getAttributeNames = ' + progressBar.getAttributeNames());
                console.info('getAttribute("aria-valuenow") = ' + progressBar.getAttribute("aria-valuenow"));
                console.info('getAttribute("aria-valuenow") = ' + progressBar.getAttribute("aria-valuemax"));
            }
        }
    }

    const resetCurrentVideoTime = () => { if (currentVideoTime) currentVideoTime = 0; }

    const waitForMoviePlayerAndInit = () => {
        // Check if the element already exists
        let moviePlayerElement = document.getElementById('movie_player');
        if (moviePlayerElement) {
            init(moviePlayerElement); // Call init if it's there already
            return;
        }

        // Otherwise, use a mutation observer to wait for it
        const observer = new MutationObserver((mutations, obs) => {
            moviePlayerElement = document.getElementById('movie_player');
            if (moviePlayerElement) {
                observer.disconnect(); // Stop observing once we find it
                init(moviePlayerElement); // And call init
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }

    async function findPlayerContainer() {
        return new Promise((resolve, reject) => {
            const timeout = 5000; // if it's not found within 5 seconds, it's not coming
            const searchInterval = 100;
            let elapsed = 0;

            const initInterval = setInterval(() => {
                log('Searching for #movie_player');
                const playerContainerElement = document.getElementById('ytd-player');
                if (playerContainerElement) {
                    clearInterval(initInterval);
                    resolve(playerContainerElement);
                }
                elapsed += searchInterval;
                if (elapsed >= timeout) {
                    log('#movie_player not found within 5 seconds');
                    clearInterval(initInterval);
                    resolve(false);
                }
            }, searchInterval);
        });
    }

    async function init(fMoviePlayer) {
        console.log("YAA init");

        if (!fMoviePlayer) {
            log("Movie player not passed, just needed to sync speeds");
            return;
        }

        // hide the original 2x speed overlay - we will be replacing it with our own overlay to avoid confusion
        // but if the extension is disabled, clean up after ourselves and put the native overlay back
        const overlay = document.querySelector('.ytp-speedmaster-overlay.ytp-overlay');
        if (!extensionEnabled && overlay !== null) {
            overlay?.classList.remove('hidden');
            return;
        } else {
            overlay?.classList.add('hidden');
        }

        //log("adSkipEnabled", adSkipEnabled);

        url = window.location.href;

        isEmbeddedVideo = url.includes('embed');
        video = document.querySelector('video');
        //log("video", video);

        // remove pause overlay for embedded videos as it causes inconsistent pausing behavior
        const pauseOverlay = document.querySelector('.ytp-pause-overlay');
        pauseOverlay?.remove();

        if (video !== null) {
            log("video exists");

            let videoParentElement = video.parentElement;
            if (!videoParentElement.querySelector(':scope > .indicator')) {
                log("adding NEW indicator")
                indicator = document.createElement('div');
                indicator.classList.add('indicator');
                video.parentElement.appendChild(indicator);
            } else {
                log("indicator already here");
            }

            // We observe this container because that's where the ads are injected
            const playerContainer = await findPlayerContainer();
            if (playerContainer) {
                log("observing playerContainer");
                //overlayObserver.observe(playerContainer, { childList: true, subtree: true });
                //buttonObserver.observe(playerContainer, { childList: true, subtree: true });
            } else {
                log("playerContainer not found");
            }

            const titleNode = document.querySelector('#title yt-formatted-string');
            /*
                        if (!titleNode) {
                            log('Target node not found');
                        } else {
                            const callback = function(mutationsList, observer) {
                                for(let mutation of mutationsList) {
                                    if (mutation.type === 'childList' || mutation.type === 'characterData') {
                                        log('***** Title changed *****');
                                        if (indicator) {
                                            indicator.style.display = 'none';
                                        }
                                        break;
                                    }
                                }
                            };

                            const titleObserver = new MutationObserver(callback);

                            titleObserver.observe(titleNode, { childList: true, subtree: true, characterData: true });
                        }
            */
        }
    }

    /**
    * INIT FUNCTIONS
    */

    // Initial setup and check
    waitForMoviePlayerAndInit();

    window.addEventListener("load", () => {
        sourceCode();
    })

    document.addEventListener("load", () => {
        sourceCode();
    })

    window.addEventListener('locationchange', resetCurrentVideoTime);

    window.addEventListener('popstate', resetCurrentVideoTime);

})();
