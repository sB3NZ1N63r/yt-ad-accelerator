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
                        //skipBtnTest();
                        handleProgressBar();

                        skipBtnClick();
                        adVideoManipulation();
                        actualVideoListenser();
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
                console.info('skip button click by XPath successful');
                skipBtnInfo();
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
                    console.info('skip button click by ClassName/ID successful');
                    skipBtnInfo();
                }
            });

            if (skipBtnCurrent != null) {
                setTimeout(() => {
                    if (skipAdByClick && skipBtnCurrent.checkVisibility()) {
                        skipBtnCurrent.click();
                    }
                }, 500);
            }
        } catch (err) {
            console.error(err);
        }

    }

    const skipBtnInfo = () => {
        try {
            if (skipBtnCurrent != null) {
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
            if (!videoElement) return;
            videoElement.volume = 0;
            videoElement.muted = true;

            var playbackRate_ = playbackRate;
            if (skipBtnCurrent != null && skipBtnCurrent.checkVisibility()) {
                //playbackRate_ = 16;
                playbackRate_ = playbackRate + 4;
                console.info('set playback rate to ' + playbackRate_);
            }

            videoElement.playbackRate = playbackRate_;
        }, 500);
    }

    const actualVideoListenser = () => {
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
        } else {
            window.location.reload();
        }
    }

    const handleProgressBar = () => {
        const progressBarContainer = getElementByXpath('//*[@id="container" and contains(@class, "ytp-progress-bar-container")]');
        if (progressBarContainer != null) {
            console.info('progress bar container found by Xpath');
            console.info('className = ' + progressBarContainer.className);
            console.info('childNodes = ' + progressBarContainer.childNodes);

            const progressBar = progressBarContainer.querySelector("div.ytp-progress-bar")
            if (progressBar != null) {
                console.info('progress bar container found by querySelector');
                console.info('className = ' + progressBar.className);
                console.info('childNodes = ' + progressBar.childNodes);

                //console.info('getAttributeNames = ' + progressBar.getAttributeNames());
                console.info('getAttribute("aria-valuenow") = ' + progressBar.getAttribute("aria-valuenow"));
                console.info('getAttribute("aria-valuenow") = ' + progressBar.getAttribute("aria-valuemax"));
            }
        }
    }
    
    const resetCurrentVideoTime = () => { if (currentVideoTime) currentVideoTime = 0; }

    /**
    * INIT FUNCTIONS
    */

    // Initial setup and check
    window.addEventListener("load", () => {
        sourceCode();
    })

    document.addEventListener("load", () => {
        sourceCode();
    })


    window.addEventListener('locationchange', resetCurrentVideoTime);

    window.addEventListener('popstate', resetCurrentVideoTime);



})();