
window.addEventListener("message",async  (event) => {
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

  // ✅ new: camera switching
  if (event.data.type === "setCamera") {
    const v = String(event.data.value || '').toLowerCase();
    const facing = (v === 'back' || v === 'environment') ? 'environment' : 'user';
    if (facing !== currentFacingMode) await startCamera(facing);
  }

  if (event.data.type === "toggleCamera" || event.data.type === "rotateCamera") {
    const next = currentFacingMode === 'user' ? 'environment' : 'user';
    await startCamera(next);
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
let NOISE_AMOUNT = 0.2; // Default noise amount
let PARTICLE_HEIGHT_SCALE = 0.1; // can now be changed live
const PARTICLE_SPACING = 0.03;
const PARTICLE_SIZE = 1.0;
const CAMERA_FOV = 55;
const LINE_THICKNESS = 2; // Note: not used without MeshLine
const RENDER_MODE_COUNT = 4;
const MODE_SWITCH_INTERVAL = 2020000;
const ORBIT_DAMPING = 0.08;
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
// --- add globals
let currentFacingMode = 'user'; // 'user' (front) or 'environment' (back)
let shouldMirror = currentFacingMode === 'user';

let renderer, scene, camera;
let webCam;
let particles;
let material; // declare globally

window.addEventListener('load', () => setTimeout(init, 2000));
// window.addEventListener('resize', onResize); 


// =====================
// Camera utils (add these once)
// =====================
let deviceCache = { user: null, environment: null };

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function stopCurrentStream() {
  try {
    if (webCam) {
      const s = webCam.srcObject;
      webCam.srcObject = null;         // detach first (helps iOS)
      if (s) s.getTracks().forEach(t => t.stop());
    }
  } catch(_) {}
}

async function ensureDeviceCache() {
  // Already learned both? done.
  if (deviceCache.user && deviceCache.environment) return;

  // Need labels -> requires prior permission (you’ll have at least one stream already)
  const devices = await navigator.mediaDevices.enumerateDevices();
  const cams = devices.filter(d => d.kind === 'videoinput');
  if (!cams.length) return;

  // fast guess from labels
  for (const d of cams) {
    const L = d.label || '';
    if (!deviceCache.user && /front|user/i.test(L)) deviceCache.user = d.deviceId;
    if (!deviceCache.environment && /back|rear|environment/i.test(L)) deviceCache.environment = d.deviceId;
  }

  // If still missing, probe a couple devices cheaply to read facingMode
  for (const d of cams) {
    if (deviceCache.user && deviceCache.environment) break;
    if ((deviceCache.user && deviceCache.environment) || !d.deviceId) continue;

    let probe;
    try {
      probe = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: d.deviceId }, width: { ideal: 320 }, height: { ideal: 240 } },
        audio: false
      });
      const track = probe.getVideoTracks()[0];
      const facing = track?.getSettings?.().facingMode;
      if (facing) {
        if (facing === 'user' && !deviceCache.user) deviceCache.user = d.deviceId;
        if (facing === 'environment' && !deviceCache.environment) deviceCache.environment = d.deviceId;
      }
    } catch(_) {
      // ignore
    } finally {
      try { probe?.getTracks().forEach(t => t.stop()); } catch(_) {}
    }
  }

  // Fallbacks if platform doesn’t expose facingMode
  if (!deviceCache.user) deviceCache.user = cams[0]?.deviceId || null;
  if (!deviceCache.environment) deviceCache.environment = cams[cams.length - 1]?.deviceId || deviceCache.user;
}

// =====================
// Robust camera starter (replace your startCamera with this)
// =====================
async function startCamera(facing = 'user') {
  if (!webCam) {
    webCam = document.createElement('video');
    webCam.autoplay = true;
    webCam.muted = true;
    webCam.setAttribute('playsinline', '');
    webCam.setAttribute('webkit-playsinline', '');
    webCam.width = 640;
    webCam.height = 480;
  }

  switchingCam = true;
  hasFrame = false;

  // 1) fully stop the old stream and give iOS a moment
  stopCurrentStream();
  await delay(120);

  // 2) fast path: try applyConstraints on current track if available (some Androids)
  // (only works if there’s an active stream; we just stopped it, so skip this path)

  // 3) learn deviceIds for front/back deterministically
  try { await ensureDeviceCache(); } catch(_) {}

  // 4) request by deviceId first (most reliable on mobile Safari)
  const targetId = deviceCache[facing] || null;
  let stream;

  async function getByFacing() {
    // fallback when we don’t have deviceId
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: facing } }, audio: false
      });
    } catch {
      return await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facing } }, audio: false
      });
    }
  }

  try {
    if (targetId) {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: targetId } }, audio: false
      });
    } else {
      stream = await getByFacing();
    }
  } catch (e) {
    // last resort: try the other heuristic
    stream = await getByFacing();
  }

  // 5) verify we actually got the requested facing; if not, try to find a matching device
  let track = stream.getVideoTracks()[0];
  let gotFacing = track?.getSettings?.().facingMode;
  if (gotFacing && gotFacing !== facing) {
    // try the other cached device explicitly
    try {
      stopCurrentStream();
      await delay(80);
      const altId = facing === 'user' ? deviceCache.user : deviceCache.environment;
      if (altId) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: altId } }, audio: false
        });
        track = stream.getVideoTracks()[0];
        gotFacing = track?.getSettings?.().facingMode || gotFacing;
      }
    } catch(_) { /* keep stream as-is */ }
  }

  // 6) attach and play
  webCam.srcObject = stream;
  try { await webCam.play(); } catch(_) {}

  // 7) mark first real frame, rebuild particles for correct resolution
  const onReady = () => {
    hasFrame = true;
    if (particles) {
      scene.remove(particles);
      particles.geometry.dispose();
      particles.material.dispose();
      particles = null;
    }
    createParticles();
    switchingCam = false;

    // learn & cache deviceId <-> facing from the live track
    try {
      const t = webCam.srcObject?.getVideoTracks?.()[0];
      const s = t?.getSettings?.();
      if (s?.facingMode && s?.deviceId) deviceCache[s.facingMode] = s.deviceId;
    } catch(_) {}
  };

  if ('requestVideoFrameCallback' in webCam) {
    webCam.requestVideoFrameCallback(() => onReady());
  } else {
    webCam.addEventListener('loadeddata', onReady, { once: true });
  }

  currentFacingMode = facing;


// inside startCamera(...) after the stream is live
try {
  const s = webCam.srcObject?.getVideoTracks?.()[0]?.getSettings?.();
  // if browser tells us the actual facingMode, trust it; otherwise use the requested one
  const facing = s?.facingMode || facing /* from your function arg */;
  currentFacingMode = facing;
  shouldMirror = (facing === 'user');
} catch (_) {
  currentFacingMode = facing;
  shouldMirror = (facing === 'user');
}


  window.parent?.postMessage?.({ type: 'cameraChanged', facing: currentFacingMode }, '*');
}



// window.addEventListener('orientationchange', () => {
//   resetCameraPosition();
//   startCamera(currentFacingMode); // rebuild geometry for new video size
// });



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

  startCamera();

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
  window.addEventListener('resize', onResize);
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


function initWebCamlast() {
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

let hasFrame = false;
let switchingCam = false;

function getImageData(video) {
  if (!video) return null;
  // must have current frame + real dimensions
  const ready = video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
                video.videoWidth > 0 && video.videoHeight > 0;
  if (!ready) return null;

  const w = video.videoWidth;
  const h = video.videoHeight;
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

const mirrorSign = shouldMirror ? -1 : 1;

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const posX = PARTICLE_SPACING * (mirrorSign * x - mirrorSign * (width / 2));
    const posY = 0;
    const posZ = PARTICLE_SPACING * (y - height / 2);
    vertices_base.push(posX, posY, posZ);

    colors_base.push(1.0, 1.0, 1.0);
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
  // skip while switching or before first frame
  if (switchingCam || !hasFrame || !particles) return;

  const imageData = getImageData(webCam);
  if (!imageData) return; // still no frame? bail safely

  const length = particles.geometry.attributes.position.count;
  // geometry was made for width*height; after a camera change we recreate it
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