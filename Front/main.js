
// const db_url = 'https://www.mml-dev.ir/wenodes/backend/data.php';
// const iframe_url = 'https://www.mml-dev.ir/wenodes/Particle';

// const db_url = 'https://wenodes.org/AV_Experience/backend/data.php';
// const iframe_url = 'https://wenodes.org/AV_Experience/Particle/index.html';

const db_url = 'http://127.0.0.1:3000/backend/data.php';
const iframe_url = 'http://127.0.0.1:5500/Front/Particle/index.html';
let isOpen = false;

function fadeOutAndRemove(el, duration = 800) {
    requestAnimationFrame(() => document.getElementById('logo').classList.add('at-50'));
  if (!el) return;
  // ensure the CSS duration matches, in case you want to set it dynamically
  el.style.transitionDuration = duration + 'ms';
  el.classList.add('fade-out_line');
  // once the fade finishes, remove from DOM
  el.addEventListener('transitionend', () => el.remove(), { once: true });
}
const updateIframe = () => {
    const heightValue = heightSlider.value;
    const thresholdValue = thresholdSlider.value;
    const noiseAmountValue = noiseAmountSlider.value;

    // Send data to the iframe
    const iframe = document.getElementById('particleFrame');
    iframe.contentWindow.postMessage({ type: 'setHeight', value: heightValue }, '*');
    iframe.contentWindow.postMessage({ type: 'setThreshold', value: thresholdValue }, '*');
    iframe.contentWindow.postMessage({ type: 'setNoiseAmount', value: noiseAmountValue }, '*'); // Set noise amount

};
const captureIframeFrame = () => {
    const iframe = document.getElementById('particleFrame');
    if (!iframe || !iframe.contentWindow) {
        alert('Iframe not ready');
        return;
    }

    // Listen for the captured frame
    const onMsg = (ev) => {
        if (ev.source !== iframe.contentWindow) return;
        if (!ev.data || ev.data.type !== 'frame') return;

        window.removeEventListener('message', onMsg);

        const { dataUrl } = ev.data;
        if (!dataUrl) {
            alert('No image returned');
            return;
        }

        // Download the image
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = 'iframe-frame.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        const galleryDiv = document.querySelector('#galleryContent .main_gallery_img_div');
        if (galleryDiv) {
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `capture-${Date.now()}.png`; // unique filename

            const img = document.createElement('img');
            img.src = dataUrl;
            img.alt = 'Captured frame';

            // Make image clickable (download on click)
            link.appendChild(img);
            galleryDiv.appendChild(link);
        }

    };

    window.addEventListener('message', onMsg);

    // Ask the iframe to capture its current frame
    iframe.contentWindow.postMessage({ type: 'captureFrame' }, '*');
};
function animateController(slider, startValue, endValue, duration, delay = 0) {
    const startTime = performance.now() + delay;  // Add delay to the start time
    const easeOutQuad = (t) => t * (2 - t); // Easing function for smooth transition

    function animate() {
        const elapsedTime = performance.now() - startTime;
        const progress = Math.min(elapsedTime / duration, 1); // Ensure the progress doesn't go beyond 1

        // Calculate the current value with easing
        const easedProgress = easeOutQuad(progress);
        const currentValue = startValue + (endValue - startValue) * easedProgress;

        slider.value = currentValue.toFixed(2); // Set the slider value
        updateIframe(); // Update the iframe with the new value

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }

    animate(); // Start the animation
}
function randomizeSliders() {
    // Random target values for sliders
    const heightSlider = document.getElementById("heightSlider");
    const thresholdSlider = document.getElementById("thresholdSlider");
    const noiseAmountSlider = document.getElementById("noiseAmountSlider");


    const heightRandom = (Math.random()-0.5) * 20;
    const thresholdRandom = (Math.random()+0.2)/1.2; // Between 0 and 1
    const noiseRandom = (Math.random())*0.9; // Between 0 and 1

    // Animate sliders to new random values
    animateController(heightSlider, parseFloat(heightSlider.value), heightRandom, 1000);
    animateController(thresholdSlider, parseFloat(thresholdSlider.value), thresholdRandom, 1000);
    animateController(noiseAmountSlider, parseFloat(noiseAmountSlider.value), noiseRandom, 1000);

}
// تابع نمایش Stage
function showStage(stageNumber) {
    document.querySelectorAll('.btn').forEach(btn => btn.disabled = true);
    // disable all btns to make sure user see every thing
    setTimeout(() => {
        document.querySelectorAll('.btn').forEach(btn => btn.disabled = false);
    }, 1200);
    
    const logo = document.querySelector('.logo'); // گرفتن لوگو

    // اضافه کردن یا حذف کلاس centered بر اساس stage
    if (stageNumber === 1 || stageNumber === 2) {
        logo.classList.add('centered'); // بالا وسط
    } else {
        logo.classList.remove('centered'); // برگرداندن به حالت اولیه
    }

    // مدیریت دوربین
    if (stageNumber === 3){
        // load_particle()
        document.querySelectorAll('.stage').forEach(stage => stage.classList.remove('active'));
        logo.style.opacity = 0;
        logo.style.top = '50%';
        logo.style.left = '50%';
        logo.style.opacity = 1;
        logo.classList.add('fade-in');
        document.querySelector('#logo img').classList.add('pulse-glow');   
        
        const iframe = document.getElementById('particleFrame');
        iframe.src = iframe_url;
        iframe.onload = () => {
            console.log('iframe loaded');
            
            document.querySelectorAll('.stage').forEach(stage => stage.classList.remove('active'));
            const current = document.getElementById(`stage-${stageNumber}`);
            if (current) current.classList.add('active');

            const footer = document.querySelector('.footer');
            const sponsored = document.querySelector('.sponsored');
            // footer.style.removeProperty('bottom');
            footer.style.setProperty('bottom', 'auto', 'important');
            footer.style.setProperty('top', '20px', 'important');
            // footer.style.setProperty('font', '20px', 'important');
            sponsored.style.setProperty('display', 'none', 'important');

            footer.querySelectorAll('.wenodes').forEach(el => {
            el.style.setProperty('font-weight', '100', 'important');})
            footer.querySelectorAll('p').forEach(p => {
                p.style.setProperty('font-size', '11px', 'important'); // pick any size you like
            });
            footer.querySelectorAll('span').forEach(p => {
                p.style.setProperty('font-size', '13px', 'important'); // pick any size you like
            });
            logo.style.display = 'none'
            setTimeout(() => {
                try {
                    animateController(heightSlider, 0.1, 2, 4000);
                    animateController(thresholdSlider, 0.1, 0.8, 3000);
                    const iframe = document.getElementById('particleFrame');
                    iframe.contentWindow.postMessage({ type: 'setNoiseAmount', value: 0.9 }, '*');
                } catch (error) {
                    setTimeout(() => {
                        animateController(heightSlider, 0.1, 2, 4000);
                        animateController(thresholdSlider, 0.1, 0.8, 3000);
                        const iframe = document.getElementById('particleFrame');
                        iframe.contentWindow.postMessage({ type: 'setNoiseAmount', value: 0.9 }, '*');
                    }, 4000);
                }
            }, 4000);

        };
        return
        // startCamera();  

    } 

    setTimeout(() => {
        document.querySelectorAll('.stage').forEach(stage => stage.classList.remove('active'));
        const current = document.getElementById(`stage-${stageNumber}`);
        if (current) current.classList.add('active');
    }, 700);
    
    if (stageNumber === 2){
        document.querySelectorAll('.card_stage_1').forEach(stage => stage.classList.add('fade-out'));
    } else  if (stageNumber === 3){
        document.querySelectorAll('.card_stage_2_fade').forEach(stage => stage.classList.add('fade-out'));
    }
    if (stageNumber === 0 || stageNumber === 1 ){
        // نمایش stage فعلی
        document.querySelectorAll('.stage').forEach(stage => stage.classList.remove('active'));
        const current = document.getElementById(`stage-${stageNumber}`);
        if (current) current.classList.add('active');
    }
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i].trim();
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}
window.onload = function() {
    const menuPanel = document.getElementById("menu-panel");
    const closeMenu = document.getElementById("close-menu");

    const heightSlider = document.getElementById("heightSlider");
    const thresholdSlider = document.getElementById("thresholdSlider");
    const downloadButton = document.getElementById("photo-btn");
    // const audioPlayer = document.getElementById("audioPlayer");
    const noiseAmountSlider = document.getElementById("noiseAmountSlider");
    
    downloadButton.addEventListener('click', captureIframeFrame);
        
    heightSlider.addEventListener('input', updateIframe);
    thresholdSlider.addEventListener('input', updateIframe);
    noiseAmountSlider.addEventListener('input', updateIframe);
    
    const userId = getCookie('user_id');
    // armaan menu
    const musicBtn = document.getElementById('music-btn');
    const overlay = document.getElementById('effects-overlay');
    const panel = document.getElementById('effects-panel');
    const genres = document.querySelectorAll('.genre-btn');
        
    let startBottom = null;
    const closeBtnSvg = document.getElementById('close-effects-svg');
    closeBtnSvg.addEventListener('click', closePanel);


    // armaan menu

    if (userId) {
        console.log(userId);
        // Fade out and remove the line (UI transition)
        showToast('logged in', { duration: 800 });
        const line = document.querySelector('.angled-line');
        fadeOutAndRemove(line, 800); // duration in ms
        showStage(1);
    } else {
        console.log('No user_id found in the cookie');
    }

    // const logo = document.querySelector('.logo');
    // انیمیشن گرادیانت
    let angle = 237;
    let direction = 1;
    let speed = 0.01;
    const gradientElement = document.querySelector('.background_c');
    const minAngle = angle - 60;
    const maxAngle = angle + 60;

    function animateGradient() {
        gradientElement.style.setProperty('--angle', `${angle}deg`);
        // gradientElement.style.background = `conic-gradient(from ${angle}deg at 60.94% 52.1%, #0048A0 0deg, #000000 229.21deg, #02002D 360deg)`;
        angle += direction * speed;

        if (angle >= maxAngle || angle <= minAngle) {
            speed = Math.max(0.001, speed * 0.99);
            direction *= -1; // برگرداندن جهت حرکت
        } else {
            if (speed < 0.05) speed += 0.001;
        }

        requestAnimationFrame(animateGradient); // smoother than setTimeout
    }
    animateGradient();
    document.getElementById('start-btn').addEventListener('click', function(e) {
        e.preventDefault(); 

        const form = document.getElementById('registration-form');
        
        if (!form.checkValidity()) {
            form.reportValidity(); // Shows the default “missing value” warning
            return; // stop if invalid
        }

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;

        const data = {
            name: name,
            email: email,
            phone: phone
        };

        fetch(db_url+'?action=register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {
            // Check if the response was successful
            if (data.status === 'success') {
                // Fade out and remove the line (UI transition)
                const line = document.querySelector('.angled-line');
                fadeOutAndRemove(line, 800); // duration in ms
                console.log('User ID:', data.user_id); // Log the user_id
                const userId = data.user_id;
                const expirationDate = new Date();
                expirationDate.setTime(expirationDate.getTime() + (24 * 60 * 60 * 1000)); // 1 day expiration
                
                document.cookie = `user_id=${userId}; expires=${expirationDate.toUTCString()}; path=/`;

                showStage(1);
            } else {
                console.error('Error:', data.message);
            }
        })
        .catch((error) => console.error('Error:', error));

    });


    document.getElementById('story-next-1')?.addEventListener('click', function(e){
        e.preventDefault();
        showStage(2);
    });
    document.getElementById('story-next-2')?.addEventListener('click', function(e){
        e.preventDefault();
        showStage(3);
    });

    const buttons = document.querySelectorAll('.menu_btn');
    document.addEventListener('click', () => {
    //   buttons.forEach(b => b.classList.remove('menu_btn_side_hover'));
    });

    // select all buttons with class menu_btn
    document.querySelectorAll('.menu_btn').forEach(btn => {
        btn.addEventListener('click', e => {
            document.querySelectorAll('.menu_btn').forEach(b => {
            b.classList.remove('menu_btn_side_hover');
        });
        const clicked = e.currentTarget;

        //  close music selection menu

        // add class only if it's not the photo button
        if (clicked.id !== 'photo-btn' && clicked.id !== 'camera-rotate-btn') {
            clicked.classList.add('menu_btn_side_hover');
        }
        switch (e.currentTarget.id) {
            case 'menu-btn':
                // close effects tab  if open
                if (videoOpen) closeVideoPanel();

                // close music if open
                if (isOpen) closePanel();

                console.log('Menu button clicked');
                menuPanel.classList.toggle("show");

                // do something
                break;

            case 'camera-rotate-btn':
                const iframe = document.getElementById('particleFrame');
                iframe.contentWindow.postMessage({ type: 'toggleCamera' }, '*');
                // close music if open
                if (isOpen) closePanel();

                console.log('Camera rotate clicked');
                const rotateBtn = document.getElementById('camera-rotate-btn');
                rotateBtn.classList.add('animate');
                // remove after animation ends so it can be reused
                setTimeout(() => {
                    rotateBtn.classList.remove('animate');
                }, 200); // match transition time
                // do something else
                const heightValue = heightSlider.value;
                const thresholdValue = thresholdSlider.value;
                const noiseAmountValue = noiseAmountSlider.value;
                animateController(heightSlider, 0.1, heightValue, 4000);
                animateController(thresholdSlider, 0.1, thresholdValue, 4000);
                // Send data to the iframe
                // iframe.contentWindow.postMessage({ type: 'setHeight', value: heightValue }, '*');
                // iframe.contentWindow.postMessage({ type: 'setThreshold', value: thresholdValue }, '*');
                // iframe.contentWindow.postMessage({ type: 'setNoiseAmount', value: noiseAmountValue }, '*'); // Set noise amount

                break;

            case 'photo-btn':
                const photoBtn = document.getElementById('photo-btn');
                console.log('Photo clicked');
                photoBtn.classList.add('animate');

                // remove after animation ends so it can be reused
                setTimeout(() => {
                    photoBtn.classList.remove('animate');
                }, 200); // match transition time
                // do something else
                break;

            case 'video-effect-btn':
                menuPanel.classList.remove("show");
                // close music if open
                if (isOpen) closePanel();
                if (!videoOpen) openVideoPanel();
                else closeVideoPanel();
                console.log('Video effect clicked');
                // do something else
                break;
            // music select   
            case 'music-btn':
                menuPanel.classList.remove("show");
                // close effects tab  if open
                if (videoOpen) closeVideoPanel();
                console.log('Music clicked'.isOpen);
                if (!isOpen) openPanelFromButton(musicBtn);
                else closePanel();
                break;

            default:
                console.log('Unknown button');
        }
    });
    });

    function openPanelFromButton(btn) {
    const rect = btn.getBoundingClientRect();
    const viewportH = window.innerHeight || document.documentElement.clientHeight;
    startBottom = Math.max(0, Math.round(viewportH - rect.top));
    panel.style.bottom = `${startBottom}px`;

    //   overlay.classList.add('show');
    //   overlay.setAttribute('aria-hidden', 'false');

    panel.classList.add('animating');
    void panel.offsetHeight; // force reflow
    requestAnimationFrame(() => {
        panel.style.bottom = `80px`;
    });

    function onEnd(e) {
        if (e.propertyName !== 'bottom') return;
        panel.classList.remove('animating');
        panel.classList.add('open');
        panel.style.bottom = '80px';
        panel.removeEventListener('transitionend', onEnd);
    }
    panel.addEventListener('transitionend', onEnd);

    isOpen = true;
    musicBtn.setAttribute('aria-expanded', 'true');
    panel.setAttribute('aria-hidden', 'false');
    }

    function closePanel() {
    const ph = panel.offsetHeight || (window.innerHeight * 0.5);
    panel.classList.add('animating');
    panel.style.bottom = `-${ph}px`;

    //   overlay.classList.remove('show');
    //   overlay.setAttribute('aria-hidden', 'true');

    function onCloseEnd(e) {
        if (e.propertyName !== 'bottom') return;
        panel.classList.remove('animating');
        panel.classList.remove('open');
        panel.style.bottom = '';
        panel.removeEventListener('transitionend', onCloseEnd);
    }
    panel.addEventListener('transitionend', onCloseEnd);

    isOpen = false;
    musicBtn.setAttribute('aria-expanded', 'false');
    panel.setAttribute('aria-hidden', 'true');
    }
    genres.forEach(btn => {
    btn.addEventListener('click', () => {
        genres.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
    });


const videoBtn = document.getElementById('video-effect-btn');
const videoPanel = document.getElementById('video-panel');
const closeVideoBtn = document.getElementById('close-video-panel');

let videoOpen = false;

function openVideoPanel() {
  videoPanel.style.bottom = '-100vh';
  videoPanel.classList.add('animating');
  void videoPanel.offsetHeight;
  requestAnimationFrame(() => {
    videoPanel.style.bottom = '50px';
  });
  videoPanel.addEventListener('transitionend', function onEnd(e) {
    if (e.propertyName !== 'bottom') return;
    videoPanel.classList.add('animating');
    videoPanel.style.bottom = '-100vh';
    void videoPanel.offsetHeight;
    videoPanel.style.bottom = '50px';
    videoPanel.removeEventListener('transitionend', onEnd);
  });
  videoPanel.setAttribute('aria-hidden', 'false');
  videoOpen = true;
}

function closeVideoPanel() {
  const ph = videoPanel.offsetHeight || (window.innerHeight * 0.5);
  videoPanel.classList.add('animating');
  videoPanel.style.bottom = `-${ph}px`;
  videoPanel.addEventListener('transitionend', function onCloseEnd(e) {
    if (e.propertyName !== 'bottom') return;
    videoPanel.classList.remove('animating');
    videoPanel.classList.remove('open');
    videoPanel.style.bottom = '';
    videoPanel.setAttribute('aria-hidden', 'true');
    videoPanel.removeEventListener('transitionend', onCloseEnd);
  });
  videoOpen = false;
}

closeMenu.addEventListener("click", () => {
    document.querySelectorAll('.menu_btn').forEach(b => {
      b.classList.remove('menu_btn_side_hover');
    });
  menuPanel.classList.remove("show");
});
closeVideoBtn.addEventListener('click',closeVideoPanel);


const randomBtn = document.getElementById('random_btn');

randomBtn.addEventListener('click', () => {
    randomizeSliders()
    randomBtn.classList.add('animate');

    // remove after animation ends so it can be reused
    setTimeout(() => {
        randomBtn.classList.remove('animate');
    }, 200); // match transition time
});


const avamelBtn = document.getElementById('avamel-btn');
const avamelList = document.getElementById('avamel-list');

avamelBtn.addEventListener('click', () => {
    if (avamelList.style.display === 'block') {
        avamelList.style.display = 'none';
    } else {
        avamelList.style.display = 'block';
        galleryContent.style.display = 'none';
        giftContent.style.display = 'none';
    }
});

// Gift toggle
const giftBtn = document.getElementById('giftBtn');
const giftContent = document.getElementById('giftContent');

giftBtn.addEventListener('click', () => {
  if (giftContent.style.display === 'block') {
    giftContent.style.display = 'none';
  } else {
    giftContent.style.display = 'flex';
    galleryContent.style.display = 'none';
    avamelList.style.display = 'none';

  }
});

// Gallery toggle
const galleryBtn = document.getElementById('galleryBtn');
const galleryContent = document.getElementById('galleryContent');

galleryBtn.addEventListener('click', () => {
  if (galleryContent.style.display === 'block') {
    galleryContent.style.display = 'none';
  } else {
    galleryContent.style.display = 'block';
    giftContent.style.display = 'none';
    avamelList.style.display = 'none';
    showToast('click to Download.', { duration: 1800 });
  }
});

// Gift code copy
const giftCopyBtn = document.getElementById('copyBtn');
const giftCode = document.getElementById('discountCode');

giftCode.addEventListener('click', () => {
  giftCode.select();
});

giftCopyBtn.addEventListener('click', async () => {
  const ok = await copyText(giftCode.value);
  showToast(ok ? 'Copied to clipboard' : 'Copy failed', { duration: 1800 });
});





let isBackHandled = false;  // Flag to track if back button is already handled

function closeAllElementsInStage3() {
    // Close all menu buttons and remove hover effects
    const buttons = document.querySelectorAll('.menu_btn');
    buttons.forEach(button => {
        button.classList.remove('menu_btn_side_hover');
    });

    // Close all menu panels inside stage 3
    const menuPanel = document.getElementById('menu-panel');
    if (menuPanel && menuPanel.classList.contains("show")) {
        menuPanel.classList.remove("show");
    }

    // Close video panel if open
    if (videoOpen) {
        closeVideoPanel();
    }

    // Close music selection panel if open
    if (isOpen) {
        closePanel();
    }

    // Close gallery, gift, and avamel list
    const galleryContent = document.getElementById('galleryContent');
    const giftContent = document.getElementById('giftContent');
    const avamelList = document.getElementById('avamel-list');

    if (galleryContent.style.display === 'block') galleryContent.style.display = 'none';
    if (giftContent.style.display === 'flex') giftContent.style.display = 'none';
    if (avamelList.style.display === 'block') avamelList.style.display = 'none';
    
    console.log('Closed all open elements in stage 3');
}

// Handle the Android back button press
function handleBackButton(e) {
    const currentStage = document.getElementById('stage-3');
    if (currentStage && currentStage.classList.contains('active')) {
        e.preventDefault(); // Prevent default back navigation behavior
        closeAllElementsInStage3(); // Close all elements in stage 3
        
        // Flag to prevent multiple triggers on subsequent presses
        isBackHandled = true;  
        
        return; // Don't navigate back
    }
}

// Listen to the popstate event
window.addEventListener('popstate', function (e) {
    if (isBackHandled) {
        // We handled the back button already, so push the state again to prevent further navigation
        history.pushState(null, null, window.location.href);
        isBackHandled = false; // Reset the flag for next time
    } else {
        // Default behavior if the back button isn't handled
        handleBackButton(e);
    }
});

// Push a new state to history to handle the back navigation (Android browser)
window.history.pushState(null, null, window.location.href);  // Adds a new history entry




// ===== helpers: get your existing slider elements =====

// required: your existing function
// function animateController(sliderEl, fromValue, toValue, durationMs) { ... }

// ===== core: simple audio-reactive engine =====
class AudioReactiveEngine {
  constructor({ onKick, onSnare, onLoudness, statusEl }) {
    this.onKick = onKick;
    this.onSnare = onSnare;
    this.onLoudness = onLoudness;
    this.statusEl = statusEl;



    // keep these properties in the constructor:
    this.mediaNodeMap = new WeakMap(); // HTMLMediaElement -> MediaElementAudioSourceNode
    this.currentMediaEl = null;



    this.ctx = null;
    this.src = null;
    this.analyser = null;
    this.freqData = null;
    this.timeData = null;
    this.raf = null;

    // detection state
    this.kickEnv = 0;
    this.snareEnv = 0;
    this.loudnessEnv = 0;
    this.kickHold = 0;
    this.snareHold = 0;

    this.sampleRate = 44100;
    this.fftSize = 2048;

    // thresholds (tweakable)
    this.kickThreshold = 0.3;
    this.snareThreshold = 0.25;
    this.loudSmooth = 0.9;   // 0..1, higher = smoother (EMA)
    this.envDecay = 0.75;    // beat envelope decay per frame
    this.holdFrames = 6;     // min frames between same-hit triggers
  }

  _ensureCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.sampleRate = this.ctx.sampleRate;
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = this.fftSize;
      this.analyser.smoothingTimeConstant = 0.75;
      this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
      this.timeData = new Uint8Array(this.analyser.fftSize);
    }
  }

// Inside class AudioReactiveEngine { ... }


// REPLACE your old useFile() with this:
async useFile(audioEl) {
  this._ensureCtx();
  if (this.ctx.state === 'suspended') await this.ctx.resume();

  // 1) Disconnect previous media node from analyser (leave destination alone)
  if (this.currentMediaEl && this.mediaNodeMap.has(this.currentMediaEl)) {
    try { this.mediaNodeMap.get(this.currentMediaEl).disconnect(); } catch {}
  }

  // 2) Get or create (once) a MediaElementSource for this element
  let srcNode = this.mediaNodeMap.get(audioEl);
  if (!srcNode) {
    srcNode = this.ctx.createMediaElementSource(audioEl);
    this.mediaNodeMap.set(audioEl, srcNode);
  }

  // 3) Route: element -> analyser  (analyser -> destination already set elsewhere)
  try { srcNode.disconnect(); } catch {}           // ensure clean
  srcNode.connect(this.analyser);

  // 4) Ensure analyser -> destination is connected exactly once
  // (safe to call repeatedly)
  try { this.analyser.disconnect(); } catch {}
  this.analyser.connect(this.ctx.destination);

  this.currentMediaEl = audioEl;

  if (!this.raf) this._startLoop();
  this._setStatus('file • ready');
}


  async useMic() {
    this.stop();
    this._ensureCtx();
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    this.src = this.ctx.createMediaStreamSource(stream);
    this.src.connect(this.analyser);
    this._startLoop();
    this._setStatus('mic • live');
  }

  stop() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
    try { this.src && this.src.disconnect(); } catch {}
    this.src = null;
    this._setStatus('idle');
  }

  _binForHz(hz) {
    // analyser frequencyBinCount = fftSize/2
    const nyquist = this.sampleRate / 2;
    return Math.max(0, Math.min(this.analyser.frequencyBinCount - 1, Math.round(hz / nyquist * this.analyser.frequencyBinCount)));
  }

  _bandEnergy(hzLo, hzHi) {
    const lo = this._binForHz(hzLo);
    const hi = this._binForHz(hzHi);
    let sum = 0;
    for (let i = lo; i <= hi; i++) sum += this.freqData[i] / 255;
    return sum / Math.max(1, (hi - lo + 1));
  }

  _fullbandRMS() {
    // quick RMS from time domain 0..255
    this.analyser.getByteTimeDomainData(this.timeData);
    let acc = 0;
    for (let i = 0; i < this.timeData.length; i++) {
      const v = (this.timeData[i] - 128) / 128;
      acc += v * v;
    }
    return Math.sqrt(acc / this.timeData.length); // ~0..1
  }

  _startLoop() {
    const loop = () => {
      this.analyser.getByteFrequencyData(this.freqData);

      // loudness (full-band RMS)
      const rms = this._fullbandRMS();
      this.loudnessEnv = this.loudnessEnv * this.loudSmooth + rms * (1 - this.loudSmooth);

      // kick: low band ~ 30–150 Hz
      const kickEnergy = this._bandEnergy(30, 150);
      this.kickEnv = Math.max(kickEnergy, this.kickEnv * this.envDecay);

      // snare: mid-high band ~ 1.5–4.5 kHz
      const snareEnergy = this._bandEnergy(1500, 4500);
      this.snareEnv = Math.max(snareEnergy, this.snareEnv * this.envDecay);

      // triggers with simple hysteresis + hold
      if (this.kickHold <= 0 && kickEnergy - this.kickEnv * 0.6 > this.kickThreshold) {
        this.kickHold = this.holdFrames;
        this.onKick && this.onKick(kickEnergy);
      } else {
        this.kickHold--;
      }

      if (this.snareHold <= 0 && snareEnergy - this.snareEnv * 0.6 > this.snareThreshold) {
        this.snareHold = this.holdFrames;
        this.onSnare && this.onSnare(snareEnergy);
      } else {
        this.snareHold--;
      }

      // continuous loudness callback (0..1)
      this.onLoudness && this.onLoudness(this.loudnessEnv);

      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  _setStatus(t) { if (this.statusEl) this.statusEl.textContent = t; }
}

// ===== mapping: randomly pair metrics -> controllers, reshuffle every N seconds =====
(function setupReactive() {
//   const audioEl = document.getElementById('songPlayer');
//   const fileInput = document.getElementById('songFile');
//   const playBtn = document.getElementById('playPauseBtn');
//   const micBtn = document.getElementById('useMicBtn');
  const statusEl = document.getElementById('reactiveStatus');

  // clamp + random helpers
  const rand = (min, max) => min + Math.random() * (max - min);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const mapRange = (v, inMin, inMax, outMin, outMax) => outMin + (clamp(v, inMin, inMax) - inMin) * (outMax - outMin) / (inMax - inMin);

  // controller ranges you asked for
  const ranges = {
    height:   { min: -10, max: 10, dur: 200 },
    threshold:{ min: 0.1, max: 0.9, dur: 300 },
    noise:    { min: 0.1, max: 0.9, dur: 100 },
  };

  // build three controller updaters
  const controllers = {
    height(val, fast=false) {
      const from = parseFloat(heightSlider?.value ?? 0);
      const to = clamp(val, ranges.height.min, ranges.height.max);
      animateController(heightSlider, from, to, fast ? 120 : ranges.height.dur);
    },
    threshold(val, fast=false) {
      const from = parseFloat(thresholdSlider?.value ?? 0.5);
      const to = clamp(val, ranges.threshold.min, ranges.threshold.max);
      animateController(thresholdSlider, from, to, fast ? 140 : ranges.threshold.dur);
    },
    noise(val, fast=false) {
      const from = parseFloat(noiseAmountSlider?.value ?? 0.5);
      const to = clamp(val, ranges.noise.min, ranges.noise.max);
      animateController(noiseAmountSlider, from, to, fast ? 100 : ranges.noise.dur);
    }
  };

  // metrics -> controllers mapping that reshuffles periodically
  const metrics = ['kick','snare','loudness'];
  const controllerKeys = ['height','threshold','noise'];
  let mapping = {};
  let lastShuffle = 0;
  const shuffleIntervalMs = 10000;

  function shuffleMapping() {
    const shuffled = controllerKeys.slice().sort(() => Math.random() - 0.5);
    mapping.kick = shuffled[0];
    mapping.snare = shuffled[1];
    mapping.loudness = shuffled[2];
    lastShuffle = performance.now();
    statusEl.textContent = `map: kick→${mapping.kick}, snare→${mapping.snare}, loudness→${mapping.loudness}`;
  }
  shuffleMapping();

  // beat to controller actions
  const onKick = (energy) => {
    if (performance.now() - lastShuffle > shuffleIntervalMs) shuffleMapping();
    const target = mapping.kick;
    const toVal = rand(ranges[target === 'height' ? 'height' : target].min, ranges[target === 'height' ? 'height' : target].max);
    controllers[target](toVal, true);
  };

  const onSnare = (energy) => {
    if (performance.now() - lastShuffle > shuffleIntervalMs) shuffleMapping();
    const target = mapping.snare;
    const toVal = rand(ranges[target === 'height' ? 'height' : target].min, ranges[target === 'height' ? 'height' : target].max);
    controllers[target](toVal, true);
  };

  const onLoudness = (lvl) => {
    // smooth follow: map 0..1 loudness into appropriate range
    const target = mapping.loudness;
    const r = ranges[target === 'height' ? 'height' : target];
    const toVal = mapRange(lvl, 0.05, 0.35, r.min, r.max);
    controllers[target](toVal, false);
  };

  const engine = new AudioReactiveEngine({ onKick, onSnare, onLoudness, statusEl });

  // ui wiring
//   fileInput.addEventListener('change', async (e) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     // play locally without “downloading”
//     audioEl.src = URL.createObjectURL(file);
//     audioEl.onloadedmetadata = () => { playBtn.disabled = false; statusEl.textContent = 'file • loaded'; };
//     await engine.useFile(audioEl);
//   });

//   playBtn.addEventListener('click', async () => {
//     if (audioEl.paused) {
//       try { await audioEl.play(); playBtn.textContent = 'Pause'; statusEl.textContent = 'playing'; }
//       catch (e) { console.warn(e); }
//     } else {
//       audioEl.pause(); playBtn.textContent = 'Play'; statusEl.textContent = 'paused';
//     }
//   });

//   micBtn.addEventListener('click', async () => {
//     try {
//       await engine.useMic();
//       playBtn.textContent = 'Play';
//       playBtn.disabled = true;
//       if (!audioEl.paused) audioEl.pause();
//     } catch (e) {
//       statusEl.textContent = 'mic denied';
//       console.warn('mic error', e);
//     }
//   });

  // optional: reshuffle mapping on spacebar
  window.addEventListener('keydown', (ev) => {
    // if (ev.code === 'Space') { ev.preventDefault(); shuffleMapping(); }
  });
})();







// ===== song libraries per genre (swap with your own links; must be CORS-allowed) =====
const SONGS = {
  techno: [
    'https://wenodes.org/AV_Experience/asset/Makan Ashgvari Ahvaz.mp3',
    // 'https://your.cdn/techno/track2.mp3',
  ],
  ambient: [
    'https://wenodes.org/AV_Experience/asset/Amir%20Darabi%20-%20Beraghs.mp3',
  ],
  electronic: [
    'https://wenodes.org/AV_Experience/asset/nima ramezan.mp3',
  ],
  house: [
    'https://wenodes.org/AV_Experience/asset/Roozbeh Fadavi Didar.9.wav',
    // 'https://testsong.b-cdn.net/Yechi Bede Dod konm (320).mp3',
  ],
};

// quick helpers
const randIdx = (arr) => Math.floor(Math.random() * arr.length);
const byId = (id) => document.getElementById(id);


// === Blob loader: prevents IDM intercepting direct MP3 links ===
async function toBlobUrl(fileUrl, mime = 'audio/mpeg') {
  const res = await fetch(fileUrl, { credentials: 'omit', cache: 'force-cache' });
  if (!res.ok) throw new Error(`Failed to fetch audio ${res.status}`);
  const buf = await res.arrayBuffer();
  const blob = new Blob([buf], { type: mime });
  return URL.createObjectURL(blob);
}

async function loadTrackToAudioEl(audioEl, fileUrl, mime='audio/mpeg') {
  if (audioEl._objectUrl) { try { URL.revokeObjectURL(audioEl._objectUrl); } catch {} }
  const objUrl = await toBlobUrl(fileUrl, mime);
  audioEl.src = objUrl;
  audioEl._objectUrl = objUrl;
  audioEl.setAttribute('controlslist', 'nodownload noplaybackrate');
  audioEl.preload = 'auto';
}

// helper to pick & set a random song for a genre
async function setRandomTrack(genre) {
  const el = audioEls[genre];
  const list = SONGS[genre] || [];
  if (!list.length) return;
  const url = list[Math.floor(Math.random() * list.length)];
  await loadTrackToAudioEl(el, url, 'audio/mpeg');
}



// link buttons and audio tags
const genreButtons = Array.from(document.querySelectorAll('#genre-controls .genre-btn'));
const audioEls = {
  techno: byId('audio-techno'),
  ambient: byId('audio-ambient'),
  electronic: byId('audio-electronic'),
  house: byId('audio-house'),
};

// status badge from previous UI (optional)
const statusEl = document.getElementById('reactiveStatus');

// make/keep one AudioReactiveEngine instance for these players
// if you already created `engine` earlier, reuse it; otherwise expose it:
window._audioReactiveEngine = window._audioReactiveEngine || (function () {
  // reuse the callbacks from earlier code:
  // if you kept them inside an IIFE, recreate minimal ones mapping to your sliders:
  const ranges = { height:{min:-10,max:10,dur:200}, threshold:{min:0.1,max:0.9,dur:300}, noise:{min:0.1,max:0.9,dur:100} };
  const clamp = (v,a,b)=>Math.min(b,Math.max(a,v));
  const mapRange=(v,i0,i1,o0,o1)=>o0+(Math.min(i1,Math.max(i0,v))-i0)*(o1-o0)/(i1-i0);

  const controllers = {
    height(val, fast=false){ animateController(heightSlider, parseFloat(heightSlider.value||0), clamp(val, ranges.height.min, ranges.height.max), fast?120:ranges.height.dur); },
    threshold(val, fast=false){ animateController(thresholdSlider, parseFloat(thresholdSlider.value||0.5), clamp(val, ranges.threshold.min, ranges.threshold.max), fast?140:ranges.threshold.dur); },
    noise(val, fast=false){ animateController(noiseAmountSlider, parseFloat(noiseAmountSlider.value||0.5), clamp(val, ranges.noise.min, ranges.noise.max), fast?100:ranges.noise.dur); },
  };
  const mapping = { kick:'height', snare:'threshold', loudness:'noise' };

  const onKick = () => {
    const r = ranges[mapping.kick]; const to = r.min + Math.random()*(r.max-r.min);
    controllers[mapping.kick](to, true);
  };
  const onSnare = () => {
    const r = ranges[mapping.snare]; const to = r.min + Math.random()*(r.max-r.min);
    controllers[mapping.snare](to, true);
  };
  const onLoudness = (lvl) => {
    const r = ranges[mapping.loudness];
    controllers[mapping.loudness](mapRange(lvl, 0.05, 0.35, r.min, r.max), false);
  };

  return new AudioReactiveEngine({ onKick, onSnare, onLoudness, statusEl });
})();

// wire each audio element into the engine when used
function connectAudioElToEngine(audioEl) {
  // if already connected once, just reuse; createMediaElementSource can only be used once per element
  if (!audioEl._connectedToEngine) {
    window._audioReactiveEngine.useFile(audioEl);
    audioEl._connectedToEngine = true;
  } else {
    // ensure analysis is running
    window._audioReactiveEngine.useFile(audioEl);
  }
}

// preload: assign one random track per genre (or the first if only one)
Object.entries(audioEls).forEach(([genre, el]) => {
  const list = SONGS[genre] || [];
  if (list.length) {
    el.src = list[randIdx(list)];
    // optional: advance to a new random track when one ends
    el.addEventListener('ended', () => {
      if (!SONGS[genre]?.length) return;
      el.src = SONGS[genre][randIdx(SONGS[genre])];
      el.play().catch(()=>{});
    });
  }
});

// state
let currentGenre = null;       // 'techno' | 'ambient' | 'electronic' | 'house' | null
let isPlaying = false;

// UI helpers
function setActiveButton(genre) {
  genreButtons.forEach(btn => {
    const g = btn.getAttribute('data-genre');
    if (g === genre && isPlaying) {
      btn.classList.add('btn-active'); // adjust to your CSS framework
      btn.textContent = btn.textContent.replace(/^(Play|Start|▶️)?/,'').trim();
      if (!/⏸/.test(btn.textContent)) btn.textContent = '⏸ ' + btn.textContent;
    } else {
      btn.classList.remove('btn-active');
      const label = btn.getAttribute('data-genre');
      const pretty = {
        techno: 'ماکان اشکواری ',
        ambient: 'امیر دارابی ',
        electronic: 'نیما رمضان ',
        house: 'روزبه فدوی '
      }[label] || label;
      btn.textContent = (currentGenre===g && !isPlaying ? '▶️ ' : '') + pretty;
    }
  });
}

// click logic: toggle play/stop; switch instantly when choosing a new genre
genreButtons.forEach(btn => {
  btn.addEventListener('click', async () => {
    const chosen = btn.getAttribute('data-genre');
    const chosenEl = audioEls[chosen];

    if (!SONGS[chosen]?.length) {
      if (statusEl) statusEl.textContent = `no tracks for ${chosen}`;
      return;
    }

    // if clicking the same genre: toggle play/pause
    if (currentGenre === chosen) {
      if (isPlaying) {
        chosenEl.pause();
        isPlaying = false;
        if (statusEl) statusEl.textContent = `${chosen} • paused`;
      } else {
        connectAudioElToEngine(chosenEl);
        try { await chosenEl.play(); isPlaying = true; if (statusEl) statusEl.textContent = `${chosen} • playing`; }
        catch(e){ console.warn(e); }
      }
      setActiveButton(chosen);
      return;
    }

    // switching genre: stop previous, start new instantly
    if (currentGenre) {
      const prevEl = audioEls[currentGenre];
      prevEl && prevEl.pause();
    }
    currentGenre = chosen;

    // if the chosen element has no src yet (lists can be dynamic), give it one
    if (!chosenEl.src) await setRandomTrack(chosen);

    connectAudioElToEngine(chosenEl);
    try {
      await chosenEl.play();
      isPlaying = true;
      if (statusEl) statusEl.textContent = `${chosen} • playing`;
    } catch (e) {
      isPlaying = false;
      if (statusEl) statusEl.textContent = `${chosen} • ready`;
      console.warn(e);
    }
    setActiveButton(chosen);
  });
});





};


// Toast utility
(function () {
  // ensure a single root
  function getToastRoot() {
    let root = document.getElementById('toast-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'toast-root';
      document.body.appendChild(root);
    }
    return root;
  }

  // Create and show a toast
  window.showToast = function (message, {
    duration = 2000,
    dark = false,
    id = null, // set to avoid duplicates if you want
  } = {}) {
    const root = getToastRoot();

    // optional: prevent duplicate by id
    if (id && root.querySelector(`.toast[data-id="${id}"]`)) {
      return;
    }

    const el = document.createElement('div');
    el.className = 'toast';
    if (dark) el.classList.add('dark');
    if (id) el.dataset.id = id;
    el.textContent = message;

    root.appendChild(el);

    // fade in
    requestAnimationFrame(() => el.classList.add('show'));

    // fade out + remove
    const hide = () => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 220);
    };
    setTimeout(hide, duration);

    return el;
  };
})();

// Clipboard helper (modern API with fallback)
async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // fallback: temp input + execCommand
      const tmp = document.createElement('textarea');
      tmp.value = text;
      tmp.style.position = 'fixed';
      tmp.style.opacity = '0';
      document.body.appendChild(tmp);
      tmp.select();
      document.execCommand('copy');
      tmp.remove();
      return true;
    }
  } catch (e) {
    return false;
  }
}
