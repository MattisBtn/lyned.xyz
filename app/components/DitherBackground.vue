<template>
  <canvas
    ref="canvas"
    class="dither-bg"
  />
</template>

<script setup lang="ts">
const canvas = ref<HTMLCanvasElement | null>(null)

// --- Shader sources ---

const cloudsFragSrc = `#version 300 es
precision highp float;

uniform vec2 uResolution;
uniform float uTime;

out vec4 fragColor;

const float PI = acos(-1.0);
const float TAU = PI * 2.0;
const mat2 m2 = mat2(0.80, -0.60, 0.60, 0.80);

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 x) {
  vec2 p = floor(x);
  vec2 f = fract(x);
  f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = hash(p);
  float b = hash(p + vec2(1.0, 0.0));
  float c = hash(p + vec2(0.0, 1.0));
  float d = hash(p + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 uv) {
  float f = 0.0;
  f += 0.5000 * noise(uv); uv = m2 * uv * 2.02;
  f += 0.2500 * noise(uv); uv = m2 * uv * 2.03;
  f += 0.1250 * noise(uv); uv = m2 * uv * 2.01;
  f += 0.0625 * noise(uv);
  return f / 0.9375;
}

vec3 clouds(vec2 uv) {
  float t = uTime * 0.75;
  vec2 q, r;
  q.x = fbm(uv + t * 0.25);
  q.y = fbm(uv + vec2(1.0));
  r.x = fbm(uv + q + vec2(1.7, 9.2) + 0.31 * t * 0.25);
  r.y = fbm(uv + q + vec2(8.3, 2.8) + 0.21 * t * 0.25);
  float f = fbm(uv + r);

  vec3 color = mix(vec3(1.0, 1.0, 1.0), vec3(0.3, 1.6, 1.6), clamp((f * f) * 2.0, 0.0, 1.0));
  color = mix(color, vec3(0.4, 0.2, 0.16), clamp(length(q), 0.0, 1.0));
  color = mix(color, vec3(0.4, 0.7, 3.0), clamp(length(r.x), 0.0, 1.0));

  return color * color * color;
}

void main(void) {
  vec2 uv = gl_FragCoord.xy / uResolution.y;
  uv.y *= (uResolution.x / uResolution.y) * -0.0625 - 1.0;
  vec2 p = -1.0 + 2.0 * uv;
  p.x -= uTime * 0.0125;

  vec2 ps = vec2(1.0) / uResolution.xy;
  vec2 guv = gl_FragCoord.xy * ps;
  float seed = dot(guv, vec2(12.9898, 78.233));
  float n = fract(sin(seed) * 43758.5453 + uTime);
  float PI2 = acos(-1.0) * 2.0;
  float g = (1.0 / (0.5 * sqrt(PI2))) * exp(-((n * n) / (2.0 * 0.25)));
  vec3 grain = vec3(g) * 0.04;

  vec3 col = clouds(p * 3.0) - grain;
  fragColor = vec4(col, 1.0);
}
`

const ditherFragSrc = `#version 300 es
precision highp float;

uniform sampler2D uCloudTexture;
uniform vec2 uResolution;

out vec4 fragColor;

const int bayerMatrix[64] = int[64](
   0, 32,  8, 40,  2, 34, 10, 42,
  48, 16, 56, 24, 50, 18, 58, 26,
  12, 44,  4, 36, 14, 46,  6, 38,
  60, 28, 52, 20, 62, 30, 54, 22,
   3, 35, 11, 43,  1, 33,  9, 41,
  51, 19, 59, 27, 49, 17, 57, 25,
  15, 47,  7, 39, 13, 45,  5, 37,
  63, 31, 55, 23, 61, 29, 53, 21
);

void main(void) {
  float pixelSize = 4.0;
  vec2 pPixel = floor(gl_FragCoord.xy / pixelSize);
  vec2 pRes = floor(uResolution.xy / pixelSize);
  vec2 pUV = pPixel / pRes;

  vec4 color = texture(uCloudTexture, pUV);

  ivec2 bayerCoord = ivec2(mod(floor(gl_FragCoord.xy), 8.0));
  float dither = float(bayerMatrix[bayerCoord.y * 8 + bayerCoord.x]) / 64.0;

  vec4 lum = vec4(0.299, 0.587, 0.114, 0.0);
  float gs = dot(color, lum) * 0.38;
  gs = (gs - 0.5) * 1.2 + 0.5;
  vec3 col = vec3(step(dither, gs));

  fragColor = vec4(col, 1.0);
}
`

const vertSrc = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`

function createShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  return shader
}

function createProgram(gl: WebGL2RenderingContext, vs: string, fs: string) {
  const vert = createShader(gl, gl.VERTEX_SHADER, vs)
  const frag = createShader(gl, gl.FRAGMENT_SHADER, fs)
  if (!vert || !frag) return null
  const program = gl.createProgram()
  if (!program) return null
  gl.attachShader(program, vert)
  gl.attachShader(program, frag)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program))
    return null
  }
  return program
}

// --- Top-level state for cleanup (M6 fix) ---
let raf: number | null = null
let glCtx: WebGL2RenderingContext | null = null
let resources: {
  cloudsProg: WebGLProgram
  ditherProg: WebGLProgram
  fb: WebGLFramebuffer
  fbTex: WebGLTexture
  quadBuf: WebGLBuffer
  quadVAO: WebGLVertexArrayObject
} | null = null

function stopRendering() {
  if (raf !== null) {
    cancelAnimationFrame(raf)
    raf = null
  }
}

function cleanup() {
  stopRendering()
  if (glCtx && resources) {
    glCtx.deleteProgram(resources.cloudsProg)
    glCtx.deleteProgram(resources.ditherProg)
    glCtx.deleteFramebuffer(resources.fb)
    glCtx.deleteTexture(resources.fbTex)
    glCtx.deleteBuffer(resources.quadBuf)
    glCtx.deleteVertexArray(resources.quadVAO)
    resources = null
  }
}

onMounted(() => {
  const cvs = canvas.value
  if (!cvs) return

  const gl = cvs.getContext('webgl2', { alpha: false, antialias: false })
  if (!gl) {
    console.error('WebGL2 not supported')
    return
  }
  glCtx = gl

  // Programs (with null guards)
  const cloudsProg = createProgram(gl, vertSrc, cloudsFragSrc)
  const ditherProg = createProgram(gl, vertSrc, ditherFragSrc)
  if (!cloudsProg || !ditherProg) {
    console.error('Shader programs failed to compile')
    return
  }

  // Fullscreen quad
  const quadVAO = gl.createVertexArray()!
  gl.bindVertexArray(quadVAO)
  const quadBuf = gl.createBuffer()!
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)

  const aPos1 = gl.getAttribLocation(cloudsProg, 'aPosition')
  const aPos2 = gl.getAttribLocation(ditherProg, 'aPosition')

  // Framebuffer
  let fbTex: WebGLTexture = gl.createTexture()!
  let fb: WebGLFramebuffer = gl.createFramebuffer()!

  resources = { cloudsProg, ditherProg, fb, fbTex, quadBuf, quadVAO }

  function setupFramebuffer(w: number, h: number) {
    gl.deleteTexture(fbTex)
    gl.deleteFramebuffer(fb)

    fbTex = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, fbTex)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    fb = gl.createFramebuffer()!
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fbTex, 0)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)

    if (resources) {
      resources.fb = fb
      resources.fbTex = fbTex
    }
  }

  // Uniforms
  const uResCloud = gl.getUniformLocation(cloudsProg, 'uResolution')
  const uTimeCloud = gl.getUniformLocation(cloudsProg, 'uTime')
  const uResDither = gl.getUniformLocation(ditherProg, 'uResolution')
  const uTexDither = gl.getUniformLocation(ditherProg, 'uCloudTexture')

  let w = 0, h = 0
  const isMobile = window.innerWidth < 768
  const FRAME_INTERVAL = isMobile ? 67 : 0 // ~15fps on mobile, uncapped on desktop
  let lastFrameTime = 0

  function resize() {
    // C1: Lower DPR on mobile — dither pixelates anyway (4x4 blocks)
    const dpr = isMobile ? 0.5 : Math.min(window.devicePixelRatio, 1.5)
    const newW = Math.floor(cvs.clientWidth * dpr)
    const newH = Math.floor(cvs.clientHeight * dpr)
    if (newW !== w || newH !== h) {
      w = newW
      h = newH
      cvs.width = w
      cvs.height = h
      setupFramebuffer(w, h)
    }
  }

  const startTime = performance.now()

  function render(now?: number) {
    // C3: Throttle to ~15fps on mobile
    if (FRAME_INTERVAL && now && now - lastFrameTime < FRAME_INTERVAL) {
      raf = requestAnimationFrame(render)
      return
    }
    lastFrameTime = now || 0
    resize()
    const time = (performance.now() - startTime) * 0.001

    // Pass 1: Clouds → framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
    gl.viewport(0, 0, w, h)
    gl.useProgram(cloudsProg)
    gl.uniform2f(uResCloud, w, h)
    gl.uniform1f(uTimeCloud, time)
    gl.bindVertexArray(quadVAO)
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf)
    gl.enableVertexAttribArray(aPos1)
    gl.vertexAttribPointer(aPos1, 2, gl.FLOAT, false, 0, 0)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

    // Pass 2: Dither → screen
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, w, h)
    gl.useProgram(ditherProg)
    gl.uniform2f(uResDither, w, h)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, fbTex)
    gl.uniform1i(uTexDither, 0)
    gl.enableVertexAttribArray(aPos2)
    gl.vertexAttribPointer(aPos2, 2, gl.FLOAT, false, 0, 0)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

    raf = requestAnimationFrame(render)
  }

  // C1: Pause/resume on tab visibility
  function onVisibilityChange() {
    if (document.hidden) {
      stopRendering()
    } else {
      if (raf === null) raf = requestAnimationFrame(render)
    }
  }
  document.addEventListener('visibilitychange', onVisibilityChange)

  // C2: WebGL context loss/restore
  function onContextLost(e: Event) {
    e.preventDefault()
    stopRendering()
  }
  function onContextRestored() {
    // Re-init would require re-creating everything — for now just reload
    window.location.reload()
  }
  cvs.addEventListener('webglcontextlost', onContextLost)
  cvs.addEventListener('webglcontextrestored', onContextRestored)

  // Start
  render()

  // Store extra cleanup refs
  onUnmounted(() => {
    document.removeEventListener('visibilitychange', onVisibilityChange)
    cvs.removeEventListener('webglcontextlost', onContextLost)
    cvs.removeEventListener('webglcontextrestored', onContextRestored)
  })
})

// M6: Top-level cleanup — always runs even if onMounted bailed early
onUnmounted(cleanup)
</script>

<style scoped>
.dither-bg {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  pointer-events: none;
}
</style>
