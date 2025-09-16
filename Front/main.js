const db_url = 'http://127.0.0.1:3000/backend/data.php';
const iframe_url = 'http://127.0.0.1:5501/Front/Particle/index.html';
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
        setTimeout(() => {
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
        }, 4000);
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
    // const downloadButton = document.getElementById("downloadButton");
    // const audioPlayer = document.getElementById("audioPlayer");
    const noiseAmountSlider = document.getElementById("noiseAmountSlider");

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
        // const line = document.querySelector('.angled-line');
        // fadeOutAndRemove(line, 800); // duration in ms
        // showStage(1);
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
    }
});

};

// setTimeout(() => {    
//     const line = document.querySelector('.angled-line');
//     fadeOutAndRemove(line, 800); // duration in ms
// }, 2000);
