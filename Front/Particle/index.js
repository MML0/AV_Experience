
window.addEventListener("message", (event) => {
  if (event.data.type === "setHeight") {
    PARTICLE_HEIGHT_SCALE = event.data.value;
    // console.log("Height scale set to:", PARTICLE_HEIGHT_SCALE);
  }

  // Update threshold uniform
  if (event.data.type === "setThreshold") {

    if (material?.uniforms?.threshold) {
      material.uniforms.threshold.value = event.data.value;
      // console.log("Threshold set to:", event.data.value);
    }
  }
  // Update noise amount uniform
  if (event.data.type === "setNoiseAmount") {
    NOISE_AMOUNT = event.data.value; // Update the global noise amount value
    if (material?.uniforms?.noiseAmount) {
      material.uniforms.noiseAmount.value = NOISE_AMOUNT;
      // console.log("Noise amount set to:", NOISE_AMOUNT);
    }
  }


});


// Listen for capture requests from parent
window.addEventListener('message', (e) => {
  if (!e.data || e.data.type !== 'captureFrame') return;

  requestAnimationFrame(() => {
    try {
      // Flush GPU if possible
      const gl = renderer.getContext();
      if (gl && gl.finish) gl.finish();
    } catch (_) {}

    const src = renderer.domElement;

    // Composite on white to avoid transparent/black output
    const out = document.createElement('canvas');
    out.width = src.width;
    out.height = src.height;
    const ctx = out.getContext('2d');

    ctx.fillStyle = '#ffffff';      // set your desired background
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(src, 0, 0);

    const dataUrl = out.toDataURL('image/png');

    // Send the PNG back to the parent
    window.parent.postMessage({ type: 'frame', dataUrl }, '*');
  });
});


let renderMode = 2;
let NOISE_AMOUNT = 0.1; // Default noise amount
let PARTICLE_HEIGHT_SCALE = 0.1; // can now be changed live
const PARTICLE_SPACING = 0.03;
const PARTICLE_SIZE = 1.0;
const CAMERA_FOV = 55;
const LINE_THICKNESS = 2; // Note: not used without MeshLine
const RENDER_MODE_COUNT = 4;
const MODE_SWITCH_INTERVAL = 920000;
const ORBIT_DAMPING = 0.05;
const USE_TIME_UNIFORM = true;

const isPhone = window.innerWidth < 1768; // simple check

const CAMERA_POSITION = isPhone
  ? { x: 0, y: 10, z: 25 }  // closer for phone
  : { x: 0, y: 20, z: 10 }; // original

let time = 0;  // You can replace this with an actual time variable from your animation loop or system time.
const NOISE_AMPLITUDE = 30.5;  // Adjust the amplitude of the noise (you can experiment with this value).
const NOISE_FREQUENCY = 1 / 15;  // Frequency to repeat every 5 seconds






let lastFrameTime = performance.now();
let frameCount = 0;
let fps = 0;

function updateFPS() {
  const now = performance.now();
  frameCount++;
  const deltaTime = now - lastFrameTime;

  // Calculate FPS every second
  if (deltaTime >= 1000) {
    fps = frameCount;
    frameCount = 0;
    lastFrameTime = now;
    console.log("FPS: ", fps);
  }
}





//=============================
// 🎬 MAIN SETUP
//=============================

let renderer, scene, camera;
let webCam;
let particles;
let material; // declare globally

window.addEventListener('load', init);
window.addEventListener('resize', onResize);

function init() {
  renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#myCanvas'),
    preserveDrawingBuffer: true,
    // alpha: true
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  // renderer.toneMapping = THREE.ACESFilmicToneMapping; // Tone mapping algorithm
  // renderer.toneMappingExposure = 10.1; // Adjust exposure to control brightness
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(CAMERA_FOV, window.innerWidth / window.innerHeight, 1, 10000);
  camera.position.set(CAMERA_POSITION.x, CAMERA_POSITION.y, CAMERA_POSITION.z);
  scene.add(camera);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = ORBIT_DAMPING;

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
  scene.add(directionalLight);

  initWebCam();

  const render = () => {
    drawParticles();
    updateFPS(); // Track and display FPS

    if (USE_TIME_UNIFORM && particles && particles.material.uniforms.time) {
      particles.material.uniforms.time.value = performance.now() * 0.001;
    }



    // if (material?.uniforms?.threshold) {
    //   material.uniforms.threshold.value = 0.5 + 0.2 * Math.sin(time); // sin of time

    // }

    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  };
  render();
}

function onResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  // Divide by device pixel ratio to set the correct canvas size
  const scaledWidth = width * window.devicePixelRatio;
  const scaledHeight = height * window.devicePixelRatio;

  renderer.setSize(scaledWidth, scaledHeight);  // Set the internal resolution with scaling
  camera.aspect = width / height;  // Update the aspect ratio based on CSS size
  camera.updateProjectionMatrix();  // Recalculate the projection matrix
  resetCameraPosition();  // Center the camera when orientation changes

}


function initWebCam() {
  webCam = document.createElement('video');
  webCam.autoplay = true;
  webCam.muted = true;  // ✅ iOS requires mute for autoplay
  webCam.setAttribute("playsinline", ""); 
  webCam.setAttribute("webkit-playsinline", ""); // ✅ Safari hint
  webCam.width = 640;
  webCam.height = 480;

  const option = { video: true, audio: false };

  navigator.mediaDevices.getUserMedia(option).then(function (stream) {
    webCam.srcObject = stream;

    // ✅ Explicitly call play() for iOS
    webCam.play().catch(err => {
      console.warn("Autoplay failed, waiting for user interaction:", err);
    });

    // Wait until we actually have video frames
    webCam.addEventListener('loadeddata', () => {
      const w = webCam.videoWidth;
      const h = webCam.videoHeight;
      if (w && h) {
        createParticles();
      }
    });
  }).catch(function (e) {
    alert("ERROR: " + e.message);
  });
}


function getImageData(video) {
  const w = video.videoWidth;   // ✅ use videoWidth/Height, not width/height
  const h = video.videoHeight;
  if (!w || !h) return null;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h);
}
function createParticles() {
  const imageData = getImageData(webCam);
  const geometry = new THREE.BufferGeometry();
  const vertices_base = [];
  const colors_base = [];

  const width = imageData.width;
  const height = imageData.height;

  // for (let y = 0; y < height; y++) {
  //   for (let x = 0; x < width; x++) {
  //     const posX = PARTICLE_SPACING * (-x + width / 2);
  //     const posY = 0;
  //     const posZ = PARTICLE_SPACING * (y - height / 2);
  //     vertices_base.push(posX, posY, posZ);

  //     const r = 1.0, g = 1.0, b = 1.0;
  //     colors_base.push(r, g, b);
  //   }
  // }


  for (let y = 0; y < height; y++ ) {
    for (let x = 0; x < width; x++) {
      const posX = PARTICLE_SPACING * (-x + width / 2);
      let posY = 0;  // Base height

      // Apply the noise to the y position (height) based on the sine of the passing time
      const noise = Math.sin(time * Math.PI * 2 * NOISE_FREQUENCY) * NOISE_AMPLITUDE;
      // posY += noise;

      const posZ = PARTICLE_SPACING * (y - height / 2);
      vertices_base.push(posX, posY, posZ);

      const r = 1.0, g = 1.0, b = 1.0;
      colors_base.push(r, g, b);
    }
  }

  // Increment the time in your animation loop
  time += 0.01;
  const vertices = new Float32Array(vertices_base);
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  const colors = new Float32Array(colors_base);
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  material = new THREE.ShaderMaterial({
    uniforms: {
      time: { type: 'f', value: USE_TIME_UNIFORM ? performance.now() * 0.001 : 0.0 },
      size: { type: 'f', value: PARTICLE_SIZE },
      color: 0xffffff,
      linewidth: LINE_THICKNESS,
      threshold: { value: 0.1 }, // initial
      noiseAmount: { value: NOISE_AMOUNT }  // Add noiseAmount as uniform
    },
    vertexShader: vertexSource,
    fragmentShader: fragmentSource,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  switch (renderMode) {
    case 0:
      particles = new THREE.Line(geometry, material);
      break;
    case 1:
      particles = new THREE.LineLoop(geometry, material);
      break;
    case 2:
      particles = new THREE.LineSegments(geometry, material);
      break;
    case 3:
      particles = new THREE.Points(geometry, material);
      break;
    default:
      particles = new THREE.LineSegments(geometry, material);
  }

  scene.add(particles);
}

function drawParticles() {
  if (particles) {
    const imageData = getImageData(webCam);
    const length = particles.geometry.attributes.position.count;
    for (let i = 0; i < length; i++) {
      const index = i * 4;
      const r = imageData.data[index] / 255;
      const g = imageData.data[index + 1] / 255;
      const b = imageData.data[index + 2] / 255;
      const gray = (r + g + b) / 3;

      particles.geometry.attributes.position.setY(i, gray * PARTICLE_HEIGHT_SCALE);
      particles.geometry.attributes.color.setXYZ(i, r, g, b);
    }
    particles.geometry.attributes.position.needsUpdate = true;
    particles.geometry.attributes.color.needsUpdate = true;
  }
}

setInterval(() => {
  if (particles) {
    scene.remove(particles);
    particles.geometry.dispose();
    particles.material.dispose();
  }
  renderMode = (renderMode + 1) % RENDER_MODE_COUNT;
  createParticles();
  console.log("Switched to render mode:", renderMode);
}, MODE_SWITCH_INTERVAL);

//=============================
// 🧠 SHADERS
//=============================

const vertexSource = `
    attribute vec3 color;
    uniform float time;
    uniform float size;
    uniform float noiseAmount; // Add this uniform for dynamic control of noise
    varying vec3 vColor;
    varying float vGray;

    // Noise function to create pseudo-random noise based on input
    float random(vec3 seed) {
        return fract(sin(dot(seed.xyz, vec3(12.9898, 78.233, 37.719)) * 43758.5453));
    }

    void main() {
        // Generate a unique random value for each vertex based on its position
        vec3 noise = vec3(
            random(vec3(position.x, position.y, 0.0)),    // No time variable here
            random(vec3(position.y, position.z, 0.0)),    // Remove time dependency
            random(vec3(position.z, position.x, 0.0))     // Keep randomness for each vertex based on its position
        );

        // Apply noise and scale based on noiseAmount uniform
        vec3 jitter = noise * noiseAmount;  // Apply dynamic noise

        // Apply the jitter to the particle's position
        vec3 noisyPosition = position + jitter;

        // Pass color and calculate gray value
        vColor = color;
        vGray = (vColor.x + vColor.y + vColor.z) / 3.0;

        // Set the point size based on grayscale value
        gl_PointSize = size * vGray;

        // Apply the modified position with jitter to gl_Position
        gl_Position = projectionMatrix * modelViewMatrix * vec4(noisyPosition, 1.0);
    }
`;


const fragmentSource = `
  varying vec3 vColor;
  varying float vGray;
  uniform float threshold;  // <- new uniform
  void main() {
    float gray = vGray;
    if (gray > threshold) {
      gray = 0.0;
    } else {
      gray = 1.0;
    }
    gl_FragColor = vec4(vColor, gray);
  }
`;

const fragmentSource2 = `
    varying vec3 vColor;
    varying float vGray;
    void main() {
      float gray = vGray;
      if (gray > 0.7) {
        gray = 0.0;
      } else {
        gray = 1.0;
      }
      gl_FragColor = vec4(vColor, gray);
    }
  `;
function resetCameraPosition() {
  camera.position.set(CAMERA_POSITION.x, CAMERA_POSITION.y, CAMERA_POSITION.z);
  camera.rotation.set(0, 0, 0); // Reset camera rotation
}
window.addEventListener('orientationchange', () => {
  resetCameraPosition();  // Center the camera when orientation changes
});