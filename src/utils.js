/**
 * SOURCE: https://addons.mozilla.org/en-US/firefox/addon/youtube-ad-accelerator/
 * CREDIT: David Schiller (davidschiller.net)
 */
let isDebugMode = true;
let isDebugModeOverride = false;

let video, moviePlayer;
let longPressTimer, longPressFlag = false;
let originalSpeed = 1, minSpeed = 1.25, slowSpeed = 1.5, mainSpeed = 2, fastSpeed = 3, maxSpeed = 5, periodKeySpeed = 5, commaKeySpeed = 2;
let setPersistentSpeed = false, speedPersisting = false, newPersistentSpeed;
let rewindInterval = null;
let extensionEnabled = true, hotkeysEnabled = true;
let speedWas = 1;
const tier1 = 50;
const tier2 = 180;
const tier3 = 330;
const verticalTier = 75;
let tierAdjustor = 1;
let isEmbeddedVideo = false;
let url = '';
let oldUrl = '';
let mouseIsDown = false;
let firstRewind = true;
let hotkeyIndicatorTimeout;
let lastSpeedChange;
let lastSpeedRelease;
let jumpbackSetting = true;
let persistentIndicatorSetting = false;
let leftHandIndicatorSetting = false;
let eventHandlersBound = false;
let boundEventHandlers = {};

const chromeControls = 'ytp-chrome-bottom';
const chromeControlsPadding = 'ytp-progress-bar-padding';
const YTAd = 'ytp-ad-preview-container';
const YTAdImage = 'ytp-ad-image';
const YTAdSkip = 'ytp-ad-skip-button-container';
const YTSettings = 'ytp-settings-menu';
const YTSuggestion = 'ytp-suggested-action-badge';
const YTInfoButton = 'ytp-cards-button-icon';
const YTPaidContent = 'ytp-paid-content-overlay';

const overlayDiv = document.querySelector('.ytp-doubletap-ui-legacy');


//  ----- UNCOMMENT FOR DEBUG -----
// isDebugModeOverride = true;

function log(...args) {
    if (isDebugMode) {
        console.log(...args);
    }
}

function newSpeed(rate) {
    log('newSpeed', rate);
    video.playbackRate = rate;
    indicator.style.paddingTop = '0.03em';

    // indicator.innerText = `${rate}x\u00A0\u00A0▸▸▶︎▶︎`;
    indicator.innerHTML = `${rate}x\u00A0<svg display="inline" position="relative" top="0.2em" width="24px" height="18px" version="1.1" viewBox="0 0 24 24" style="position: relative; top: -0.05em;"><use class="ytp-svg-shadow" xlink:href="#ytp-id-${rate}"></use><path class="ytp-svg-fill" d="M 10,24 18.5,18 10,12 V 24 z M 19,12 V 24 L 27.5,18 19,12 z" id="ytp-id-${rate}"></path></svg>${rate === 16 ? ' (max)' : ''}`;

    // ▹▸»⟩❯››▶︎▷▶︎▶︎⊳⦊⧐>>≫⏩️
    clearInterval(rewindInterval);
    rewindInterval = null;
    
    // keeping track of the last time the speed was changed for jumpback purposes
    if (speedWas !== rate){
        lastSpeedChange = video.currentTime;
    }
    speedWas = rate;
}

function updateIndicator(rate, indicator) {
    try {
        log('updateIndicator', rate);
        //video.playbackRate = rate;
        indicator.style.paddingTop = '0.03em';

        // indicator.innerText = `${rate}x\u00A0\u00A0▸▸▶︎▶︎`;
        indicator.innerHTML = `${rate}x\u00A0<svg display="inline" position="relative" top="0.2em" width="24px" height="18px" version="1.1" viewBox="0 0 24 24" style="position: relative; top: -0.05em;"><use class="ytp-svg-shadow" xlink:href="#ytp-id-${rate}"></use><path class="ytp-svg-fill" d="M 10,24 18.5,18 10,12 V 24 z M 19,12 V 24 L 27.5,18 19,12 z" id="ytp-id-${rate}"></path></svg>${rate === 16 ? ' (max)' : ''}`;

        // ▹▸»⟩❯››▶︎▷▶︎▶︎⊳⦊⧐>>≫⏩️
        clearInterval(rewindInterval);
        rewindInterval = null;

        // keeping track of the last time the speed was changed for jumpback purposes
        if (speedWas !== rate){
            //lastSpeedChange = video.currentTime;
            log('speedWas', speedWas);
        }
        speedWas = rate;
    } catch (err) {
        console.error(err);
    }
}

function addIndicator(moviePlayer, video, rate, isHotkey) {
    clearTimeout(hotkeyIndicatorTimeout);
    hotkeyIndicatorTimeout = null;

    let offsetTop = video.clientHeight / 60;
    let offsetLeft = 15; // Default left offset
    if (isEmbeddedVideo) {
        offsetTop *= 3;
    }

    const moviePlayerWidth = moviePlayer.clientWidth;
    const moviePlayerHeight = moviePlayer.clientHeight;
    const videoWidth = video.clientWidth;
    const videoHeight = video.clientHeight;
    const widthDifference = moviePlayerWidth - videoWidth;
    const heightDifference = moviePlayerHeight - videoHeight;

    offsetTop = offsetTop + (heightDifference/2);

    if (leftHandIndicatorSetting) {
        log('IF rightHandIndcatorSetting', leftHandIndicatorSetting);
        // If there are black bars (video is narrower than its parent), adjust the left offset
        if (widthDifference > 0) {
            offsetLeft = Math.max(30, offsetLeft + (widthDifference / 2));
        }
    } else {
        log('ELSE: leftHandIndicatorSetting', leftHandIndicatorSetting);
        offsetLeft = ((video.parentElement.clientWidth/2) - 37);
    }
    // END offest calculation stuff

    indicator.innerHTML = `${rate}x\u00A0<svg display="inline" position="relative" top="0.2em" width="24px" height="18px" version="1.1" viewBox="0 0 24 24" style="position: relative; top: -0.05em;"><use class="ytp-svg-shadow" xlink:href="#ytp-id-${rate}"></use><path class="ytp-svg-fill" d="M 10,24 18.5,18 10,12 V 24 z M 19,12 V 24 L 27.5,18 19,12 z" id="ytp-id-${rate}"></path></svg>${rate === 16 ? ' (max)' : ''}`;

    indicator.style.paddingTop = '0.03em';
    indicator.style.fontWeight = 'normal';
    indicator.style.backgroundColor = 'rgba(35, 35, 35, 0.6)';
    indicator.style.display = 'block';
    indicator.style.top = `${offsetTop}px`;
    indicator.style.left = `${offsetLeft}px`;
    // indicator.style.left = `0px`;

    if (isHotkey) {
    indicator.style.backgroundColor = 'rgba(25, 25, 25, 0.8)';
    indicator.style.fontWeight = 'bold';

        if (!persistentIndicatorSetting) {
            hotkeyIndicatorTimeout = setTimeout(() => {
                if (!persistentIndicatorSetting) {
                    indicator.style.display = 'none';
                }
            }, 1250);
        }
    }
}

function findOriginalSpeed() {
    return new Promise(resolve => {
        const label = Array.from(document.querySelectorAll('.ytp-menuitem-label'))
            .find(el => el.textContent === 'Playback speed');
        const content = label ? label.nextElementSibling.textContent.toLowerCase() : '1';
        const originalSpeed = content === 'normal' ? '1' : content;
        resolve(originalSpeed);
    });
}

function simulateLeftArrowKeyPress() {
    if (!extensionEnabled) return;

    video.focus();
    const leftArrowKeyCode = 37;
    const downEvent = new KeyboardEvent('keydown', {
        key: 'ArrowLeft',
        code: 'ArrowLeft',
        keyCode: leftArrowKeyCode,
        which: leftArrowKeyCode,
        bubbles: true,
        cancelable: true
    });
    video.dispatchEvent(downEvent);

    const upEvent = new KeyboardEvent('keyup', {
        key: 'ArrowLeft',
        code: 'ArrowLeft',
        keyCode: leftArrowKeyCode,
        which: leftArrowKeyCode,
        bubbles: true,
        cancelable: true
    });
    video.dispatchEvent(upEvent);
}

// Wrapper function to add event listeners and increment counter
function addEventListenerWithCount(target, type, listener, options) {
    target.addEventListener(type, listener, options);
    eventListenerCount++;
    log(`ESD listeners: ${eventListenerCount}`);
}

function manageEventListeners(target, handlers, add) {
    const method = add ? 'addEventListener' : 'removeEventListener';
    Object.entries(handlers).forEach(([event, handler]) => {
        const options = event === 'mousemove' || event === 'mousedown' || event === 'mouseup' || event === 'click' || event === 'mouseleave' ? { capture: true } : {};
        target[method](event, handler, options);
    });

    // Adjust the eventListenerCount accordingly
    eventListenerCount = add ? Object.keys(handlers).length : 0;
    log(`ESD listeners: ${eventListenerCount}`);
}
