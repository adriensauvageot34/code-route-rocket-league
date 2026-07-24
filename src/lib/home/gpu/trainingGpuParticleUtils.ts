import {
  TRAINING_GPU_PARTICLE_COMPONENT,
  TRAINING_GPU_PARTICLE_COMPONENTS_PER_PARTICLE,
  TRAINING_GPU_PARTICLE_DEPTHS,
  TRAINING_GPU_PARTICLE_INSTANCE_FLOATS,
  TRAINING_GPU_PARTICLE_KIND,
  TRAINING_GPU_PARTICLE_PASS_CAPACITY,
  type TrainingGpuParticleDepth,
} from "@/lib/home/gpu/trainingGpuParticleConstants";
import {
  getTrainingGpuParticleFragmentShader,
  TRAINING_GPU_PARTICLE_VERTEX_SHADER,
} from "@/lib/home/gpu/trainingGpuParticleShaders";
import {
  trainingParticlePresets,
  type TrainingParticle,
} from "@/lib/home/trainingParticlePresets";
import { getTrainingParticleBirthDelayMs } from "@/lib/home/trainingParticleTiming";

export type TrainingGpuParticleUniforms = {
  viewportCss: WebGLUniformLocation;
  passElapsedMs: WebGLUniformLocation;
  passValid: WebGLUniformLocation;
};

export type TrainingGpuParticleResources = {
  instanceBuffer: WebGLBuffer;
  instanceCount: number;
  program: WebGLProgram;
  quadBuffer: WebGLBuffer;
  uniforms: TrainingGpuParticleUniforms;
  vertexArray: WebGLVertexArrayObject;
};

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
) {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error("Unable to create a Training particle shader.");
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ?? "Unknown particle shader error.";
    gl.deleteShader(shader);
    throw new Error(message);
  }

  return shader;
}

function createProgram(
  gl: WebGL2RenderingContext,
  depth: TrainingGpuParticleDepth,
) {
  const vertexShader = compileShader(
    gl,
    gl.VERTEX_SHADER,
    TRAINING_GPU_PARTICLE_VERTEX_SHADER,
  );
  const fragmentShader = compileShader(
    gl,
    gl.FRAGMENT_SHADER,
    getTrainingGpuParticleFragmentShader(
      TRAINING_GPU_PARTICLE_DEPTHS.indexOf(depth),
    ),
  );
  const program = gl.createProgram();

  if (!program) {
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    throw new Error("Unable to create the Training particle program.");
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message =
      gl.getProgramInfoLog(program) ?? "Unknown particle program link error.";
    gl.deleteProgram(program);
    throw new Error(message);
  }

  return program;
}

function getRequiredUniform(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  name: string,
) {
  const location = gl.getUniformLocation(program, name);
  if (location === null) {
    throw new Error(`Missing Training particle uniform: ${name}.`);
  }
  return location;
}

function writeParticleInstance(
  target: Float32Array,
  offset: number,
  particle: TrainingParticle,
  component: number,
  passSlot: number,
) {
  target[offset] = particle.x;
  target[offset + 1] = particle.y;
  target[offset + 2] = particle.size;
  target[offset + 3] = particle.opacity;
  target[offset + 4] = particle.durationMs;
  target[offset + 5] = particle.rise;
  target[offset + 6] = particle.driftX;
  target[offset + 7] = (particle.rotation * Math.PI) / 180;
  target[offset + 8] = particle.blur;
  target[offset + 9] = particle.glow;
  target[offset + 10] = getTrainingParticleBirthDelayMs(particle);
  target[offset + 11] = TRAINING_GPU_PARTICLE_KIND[particle.kind];
  target[offset + 12] = component;
  target[offset + 13] = passSlot;
}

function createParticleInstanceData(depth: TrainingGpuParticleDepth) {
  const particles = trainingParticlePresets[depth];
  const instanceCount =
    particles.length *
    TRAINING_GPU_PARTICLE_COMPONENTS_PER_PARTICLE *
    TRAINING_GPU_PARTICLE_PASS_CAPACITY;
  const data = new Float32Array(
    instanceCount * TRAINING_GPU_PARTICLE_INSTANCE_FLOATS,
  );
  const components = [
    TRAINING_GPU_PARTICLE_COMPONENT.core,
    TRAINING_GPU_PARTICLE_COMPONENT.birthFlash,
    TRAINING_GPU_PARTICLE_COMPONENT.fragment,
  ] as const;
  let offset = 0;

  for (
    let passSlot = 0;
    passSlot < TRAINING_GPU_PARTICLE_PASS_CAPACITY;
    passSlot += 1
  ) {
    for (const particle of particles) {
      for (const component of components) {
        writeParticleInstance(data, offset, particle, component, passSlot);
        offset += TRAINING_GPU_PARTICLE_INSTANCE_FLOATS;
      }
    }
  }

  return { data, instanceCount };
}

function configureInstanceAttribute(
  gl: WebGL2RenderingContext,
  location: number,
  size: number,
  offsetFloats: number,
) {
  gl.enableVertexAttribArray(location);
  gl.vertexAttribPointer(
    location,
    size,
    gl.FLOAT,
    false,
    TRAINING_GPU_PARTICLE_INSTANCE_FLOATS * Float32Array.BYTES_PER_ELEMENT,
    offsetFloats * Float32Array.BYTES_PER_ELEMENT,
  );
  gl.vertexAttribDivisor(location, 1);
}

export function createTrainingGpuParticleResources(
  gl: WebGL2RenderingContext,
  depth: TrainingGpuParticleDepth,
): TrainingGpuParticleResources {
  let program: WebGLProgram | null = null;
  let vertexArray: WebGLVertexArrayObject | null = null;
  let quadBuffer: WebGLBuffer | null = null;
  let instanceBuffer: WebGLBuffer | null = null;

  try {
    program = createProgram(gl, depth);
    vertexArray = gl.createVertexArray();
    quadBuffer = gl.createBuffer();
    instanceBuffer = gl.createBuffer();

    if (!vertexArray || !quadBuffer || !instanceBuffer) {
      throw new Error("Unable to create Training particle buffers.");
    }

    const { data, instanceCount } = createParticleInstanceData(depth);

    gl.bindVertexArray(vertexArray);
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -0.5, -0.5,
        0.5, -0.5,
        -0.5, 0.5,
        -0.5, 0.5,
        0.5, -0.5,
        0.5, 0.5,
      ]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    configureInstanceAttribute(gl, 1, 4, 0);
    configureInstanceAttribute(gl, 2, 4, 4);
    configureInstanceAttribute(gl, 3, 4, 8);
    configureInstanceAttribute(gl, 4, 2, 12);

    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    gl.useProgram(program);
    const uniforms: TrainingGpuParticleUniforms = {
      viewportCss: getRequiredUniform(gl, program, "u_viewport_css"),
      passElapsedMs: getRequiredUniform(gl, program, "u_pass_elapsed_ms"),
      passValid: getRequiredUniform(gl, program, "u_pass_valid"),
    };
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(null);

    return {
      instanceBuffer,
      instanceCount,
      program,
      quadBuffer,
      uniforms,
      vertexArray,
    };
  } catch (error) {
    gl.deleteBuffer(instanceBuffer);
    gl.deleteBuffer(quadBuffer);
    gl.deleteVertexArray(vertexArray);
    gl.deleteProgram(program);
    throw error;
  }
}

export function destroyTrainingGpuParticleResources(
  gl: WebGL2RenderingContext,
  resources: TrainingGpuParticleResources | null,
) {
  if (!resources) return;

  gl.deleteBuffer(resources.instanceBuffer);
  gl.deleteBuffer(resources.quadBuffer);
  gl.deleteVertexArray(resources.vertexArray);
  gl.deleteProgram(resources.program);
}
