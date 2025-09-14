const db_url = 'http://127.0.0.1:3000/backend/data.php';
window.onload = function() {
    const logo = document.querySelector('.logo');
    
    // ابتدا لوگو را نمایش بده
    // logo.style.display = 'block';

    // بعد از 1 ثانیه لوگو محو شود و Stage 0 نمایش داده شود
    // setTimeout(() => {
    //     logo.style.display = 'none';
    //     showStage(0);
    // }, 1000); // 1 ثانیه

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
};

// setTimeout(() => {    
//     const line = document.querySelector('.angled-line');
//     fadeOutAndRemove(line, 800); // duration in ms
// }, 2000);


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
        load_particle()
        document.querySelectorAll('.stage').forEach(stage => stage.classList.remove('active'));
        logo.style.opacity = 0;
        logo.style.top = '50%';
        logo.style.left = '50%';
        logo.style.opacity = 1;
        logo.classList.add('fade-in');
        
        return
        // startCamera();  

    } else stopCamera();

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

function load_particle() {

}


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



let cameraStream;
function startCamera() {
    const video = document.getElementById('camera-preview');
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => { 
            video.srcObject = stream; 
        })
        .catch(err => {
            console.error("دوربین فعال نشد:", err);
        });
    }
}

function stopCamera() {
    const video = document.getElementById('camera-preview');
    if(video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
        video.srcObject = null;
    }
}
