const db_url = 'http://127.0.0.1:3000/backend/data.php';
const iframe_url = 'http://127.0.0.1:5501/Front/Particle/index.html';
function fadeOutAndRemove(el, duration = 800) {
    requestAnimationFrame(() => document.getElementById('logo').classList.add('at-50'));
  if (!el) return;
  // ensure the CSS duration matches, in case you want to set it dynamically
  el.style.transitionDuration = duration + 'ms';
  el.classList.add('fade-out_line');
  // once the fade finishes, remove from DOM
  el.addEventListener('transitionend', () => el.remove(), { once: true });
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
    const userId = getCookie('user_id');
    // armaan menu
    const musicBtn = document.getElementById('music-btn');
    const overlay = document.getElementById('effects-overlay');
    const panel = document.getElementById('effects-panel');
    const genres = document.querySelectorAll('.genre-btn');
        
    let isOpen = false;
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
    if (isOpen) closePanel(musicBtn);

    // add class only if it's not the photo button
    if (clicked.id !== 'photo-btn') {
        clicked.classList.add('menu_btn_side_hover');
    }
    switch (e.currentTarget.id) {
      case 'menu-btn':
        console.log('Menu button clicked');
        // do something
        break;

      case 'camera-rotate-btn':
        console.log('Camera rotate clicked');
        // do something else
        break;

      case 'photo-btn':
        console.log('Photo clicked');
        // do something else
        break;

      case 'video-effect-btn':
        console.log('Video effect clicked');
        // do something else
        break;

      case 'music-btn':
        console.log('Music clicked');
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
    panel.style.bottom = `100px`;
  });

  function onEnd(e) {
    if (e.propertyName !== 'bottom') return;
    panel.classList.remove('animating');
    panel.classList.add('open');
    panel.style.bottom = '100px';
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

};

// setTimeout(() => {    
//     const line = document.querySelector('.angled-line');
//     fadeOutAndRemove(line, 800); // duration in ms
// }, 2000);
