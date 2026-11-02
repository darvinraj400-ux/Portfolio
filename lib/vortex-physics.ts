import { Quaternion, Vector3 } from "three";
import {
  CARD_PROFILES,
  VORTEX_CARD,
  buildFullCardProfile,
  type CardProfile,
  type VortexEnvironment,
} from "./vortex-config";
import {
  buildInitialBodies,
  buildPresentationBodies,
  cardHalfExtents,
  type SeededBody,
} from "./vortex-distribution";
import {
  addTurbulenceWind,
  heightFraction,
  sampleAir,
  vortexRadiusAt,
} from "./vortex-forces";
import type {
  Vec3Tuple,
  VortexCollisionSnapshot,
  VortexContactSnapshot,
  VortexDistributionSnapshot,
  VortexHealth,
  VortexInput,
  VortexInventoryEntry,
  VortexProject,
  VortexScenarioName,
  VortexSnapshot,
  VortexWorldState,
} from "./vortex-types";

type RapierApi = typeof import("@dimforge/rapier3d-compat");
type RapierWorld = import("@dimforge/rapier3d-compat").World;
type RapierRigidBody = import("@dimforge/rapier3d-compat").RigidBody;
type RapierCollider = import("@dimforge/rapier3d-compat").Collider;

export type VortexBody = {
  index: number;
  project: VortexProject;
  profile: CardProfile;
  mass: number;
  inverseMass: number;
  inertia: Vector3;
  halfExtents: Vector3;
  surfaceArea: number;
  position: Vector3;
  velocity: Vector3;
  orientation: Quaternion;
  angularVelocity: Vector3;
  force: Vector3;
  torque: Vector3;
  wind: Vector3;
  corners: Vector3[];
  axes: [Vector3, Vector3, Vector3];
  seed: SeededBody;
  selected: boolean;
  selectionBlend: number;
  crowding: number;
  rigidBody: RapierRigidBody;
  collider: RapierCollider;
};

// wasm-bindgen's init() has no in-flight guard: two concurrent calls each
// instantiate the wasm module, and the last one replaces the global binding,
// invalidating every object built against the other instance. Keep it single.
let rapierLoader: Promise<RapierApi> | null = null;

function loadRapier(): Promise<RapierApi> {
  if (!rapierLoader) {
    rapierLoader = import("@dimforge/rapier3d-compat")
      .then(async (rapier) => {
        await rapier.init();
        return rapier;
      })
      .catch((error) => {
        rapierLoader = null;
        throw error;
      });
  }
  return rapierLoader;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const damp = (current: number, target: number, rate: number, delta: number) =>
  current + (target - current) * (1 - Math.exp(-rate * delta));

const smoothstep = (edge0: number, edge1: number, value: number) => {
  const amount = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return amount * amount * (3 - 2 * amount);
};

function quaternionFromYawPitchRoll(yaw: number, pitch: number, roll: number) {
  const cy = Math.cos(yaw / 2);
  const sy = Math.sin(yaw / 2);
  const cp = Math.cos(pitch / 2);
  const sp = Math.sin(pitch / 2);
  const cr = Math.cos(roll / 2);
  const sr = Math.sin(roll / 2);
  return new Quaternion(
    sr * cp * cy - cr * sp * sy,
    cr * sp * cy + sr * cp * sy,
    cr * cp * sy - sr * sp * cy,
    cr * cp * cy - sr * sp * sy,
  );
}

const STAGE_POSITIONS: Vec3Tuple[] = [
  [-3.4, 3.2, -1.4],
  [3.3, 3.1, -1.6],
  [-3.3, -3.0, 0.9],
  [3.2, -3.2, 0.6],
  [0.2, 4.1, -1.8],
];

const STAGE_YAWS = [0.6, -0.9, 2.2, -2.5, 1.6];

function extentAlong(axes: [Vector3, Vector3, Vector3], normal: Vector3, halfExtents: Vector3) {
  return (
    Math.abs(normal.dot(axes[0])) * halfExtents.x +
    Math.abs(normal.dot(axes[1])) * halfExtents.y +
    Math.abs(normal.dot(axes[2])) * halfExtents.z
  );
}

function spread(values: number[]) {
  if (values.length === 0) return 0;
  const mean = values.reduce((total, value) => total + value, 0) / values.length;
  const variance =
    values.reduce((total, value) => total + (value - mean) ** 2, 0) /
    values.length;
  return Math.sqrt(variance);
}

export class VortexWorld {
  readonly environment: VortexEnvironment;
  readonly bodies: VortexBody[] = [];
  time = 0;
  windLevel = 1;
  spinDirection = 1;
  turbulenceLevel = 0;
  fps = 60;
  stepMs = 0;
  peakStepMs = 0;
  stepsLastFrame = 0;
  restoredState: VortexWorldState | null = null;
  frozen = false;

  private readonly rapier: RapierApi;
  private readonly simulation: RapierWorld;
  private selected: number | null = null;
  private scrollEnergy = 0;
  private accumulator = 0;
  private resumeFrame = false;
  private reduced: boolean;
  private disposed = false;
  private diagnostics = false;

  private contactStepCount = 0;
  private contactActiveSteps = 0;
  private overlapStepCount = 0;
  private maxPenetration = 0;
  private minClearance = 99;
  private contacts: VortexContactSnapshot[] = [];

  private selectionTarget = new Vector3();
  private selectionOrientation = new Quaternion();
  private tempA = new Vector3();
  private tempB = new Vector3();
  private tempC = new Vector3();
  private tempD = new Vector3();
  private tempE = new Vector3();
  private pointVelocity = new Vector3();
  private relative = new Vector3();
  private normal = new Vector3();
  private cornerWorld = new Vector3();
  private forceTemp = new Vector3();
  private torqueTemp = new Vector3();
  private quaternionA = new Quaternion();
  private quaternionB = new Quaternion();
  private centroids = [
    new Vector3(),
    new Vector3(),
    new Vector3(),
    new Vector3(),
    new Vector3(),
  ];
  private crowdWeights = [0, 0, 0, 0, 0];
  private radialRatios = [0, 0, 0, 0, 0];
  private radialHeights = [0, 0, 0, 0, 0];

  private constructor(
    rapier: RapierApi,
    projects: VortexProject[],
    environment: VortexEnvironment,
    reduced: boolean,
  ) {
    this.rapier = rapier;
    this.environment = environment;
    this.reduced = reduced;

    this.simulation = new rapier.World({ x: 0, y: 0, z: 0 });
    this.simulation.timestep = environment.physics.fixedStep;
    this.simulation.numSolverIterations = environment.collision.solverIterations;
    this.simulation.numInternalPgsIterations =
      environment.collision.internalPgsIterations;
    this.simulation.maxCcdSubsteps = environment.collision.ccdSubsteps;
    this.simulation.integrationParameters.normalizedAllowedLinearError =
      environment.collision.allowedLinearError;

    const seeded = buildInitialBodies(projects, environment);
    this.centroids = seeded.map(() => new Vector3());
    this.crowdWeights = seeded.map(() => 0);
    this.radialRatios = seeded.map(() => 0);
    this.radialHeights = seeded.map(() => 0);
    const halfExtents = cardHalfExtents(environment);
    const scale = environment.cardScale;
    const width = VORTEX_CARD.width * scale;
    const height = VORTEX_CARD.height * scale;
    const depth = VORTEX_CARD.depth * scale;
    const padding = environment.collision.padding;
    const collision = environment.collision;

    projects.forEach((project, index) => {
      const profile =
        environment.population === 5
          ? CARD_PROFILES[index % CARD_PROFILES.length]
          : buildFullCardProfile(project, index);
      const state = seeded[index];
      const mass = profile.mass;
      const inertia = new Vector3(
        (mass / 12) * (height * height + depth * depth) * profile.inertia,
        (mass / 12) * (width * width + depth * depth) * profile.inertia,
        (mass / 12) * (width * width + height * height) * profile.inertia,
      );
      const corners: Vector3[] = [];
      for (const x of [-1, 1]) {
        for (const y of [-1, 1]) {
          corners.push(new Vector3(x * halfExtents.x, y * halfExtents.y, 0));
        }
      }

      const rigidBody = this.simulation.createRigidBody(
        rapier.RigidBodyDesc.dynamic()
          .setTranslation(
            state.position.x,
            state.position.y,
            state.position.z,
          )
          .setRotation({
            x: state.quaternion.x,
            y: state.quaternion.y,
            z: state.quaternion.z,
            w: state.quaternion.w,
          })
          .setLinvel(state.velocity.x, state.velocity.y, state.velocity.z)
          .setAngvel({
            x: state.angularVelocity.x,
            y: state.angularVelocity.y,
            z: state.angularVelocity.z,
          })
          .setLinearDamping(environment.aerodynamics.linearDamping)
          .setAngularDamping(profile.angularDrag)
          .setCcdEnabled(true)
          .setCanSleep(false),
      );

      const collider = this.simulation.createCollider(
        rapier.ColliderDesc.cuboid(
          halfExtents.x + padding,
          halfExtents.y + padding,
          halfExtents.z + padding,
        )
          .setMassProperties(
            mass,
            { x: 0, y: 0, z: 0 },
            { x: inertia.x, y: inertia.y, z: inertia.z },
            { x: 0, y: 0, z: 0, w: 1 },
          )
          .setFriction(collision.friction)
          .setRestitution(collision.restitution)
          .setContactSkin(collision.contactSkin),
        rigidBody,
      );

      this.bodies.push({
        index,
        project,
        profile,
        mass,
        inverseMass: 1 / mass,
        inertia,
        halfExtents,
        surfaceArea: width * height,
        position: state.position.clone(),
        velocity: state.velocity.clone(),
        orientation: state.quaternion.clone(),
        angularVelocity: state.angularVelocity.clone(),
        force: new Vector3(),
        torque: new Vector3(),
        wind: new Vector3(),
        corners,
        axes: [new Vector3(1, 0, 0), new Vector3(0, 1, 0), new Vector3(0, 0, 1)],
        seed: {
          position: state.position.clone(),
          quaternion: state.quaternion.clone(),
          velocity: state.velocity.clone(),
          angularVelocity: state.angularVelocity.clone(),
        },
        selected: false,
        selectionBlend: 0,
        crowding: 0,
        rigidBody,
        collider,
      });
    });

    if (reduced) this.applyReducedPose();
  }

  static async create(
    projects: VortexProject[],
    environment: VortexEnvironment,
    reduced: boolean,
  ) {
    const rapier = await loadRapier();
    return new VortexWorld(rapier, projects, environment, reduced);
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.simulation.free();
  }

  get reducedMotion() {
    return this.reduced;
  }

  setDiagnostics(enabled: boolean) {
    if (this.diagnostics === enabled) return;
    this.diagnostics = enabled;
    this.resetCollisionMetrics();
  }

  /** QA-only: hold the simulation still so captures share one exact pose. */
  setFrozen(frozen: boolean) {
    this.frozen = frozen;
  }

  setReduced(reduced: boolean) {
    if (this.reduced === reduced) return;
    this.reduced = reduced;
    this.accumulator = 0;
    if (reduced) {
      this.applyReducedPose();
    } else {
      this.bodies.forEach((body) => {
        this.placeBody(
          body,
          body.seed.position,
          body.seed.quaternion,
          this.tempA.copy(body.seed.velocity).multiplyScalar(0.55),
          this.tempB.copy(body.seed.angularVelocity).multiplyScalar(0.6),
        );
        body.selectionBlend = 0;
      });
      this.time = 0;
      this.windLevel = 1;
      this.spinDirection = 1;
      this.scrollEnergy = 0;
      this.resetCollisionMetrics();
    }
  }

  private applyReducedPose() {
    const presentation = buildPresentationBodies(
      this.bodies.length,
      this.environment,
    );
    this.bodies.forEach((body, index) => {
      const pose = presentation[index];
      this.placeBody(
        body,
        pose.position,
        pose.quaternion,
        this.tempA.set(0, 0, 0),
        this.tempB.set(0, 0, 0),
      );
      body.selectionBlend = 0;
      body.selected = false;
    });

    if (this.selected !== null) {
      const body = this.bodies[this.selected];
      if (body) {
        const orientation = quaternionFromYawPitchRoll(
          this.environment.selection.yaw,
          this.environment.selection.pitch,
          this.environment.selection.roll,
        );
        this.placeBody(
          body,
          this.tempC.fromArray(this.environment.selection.target),
          orientation,
          this.tempA.set(0, 0, 0),
          this.tempB.set(0, 0, 0),
        );
        body.selected = true;
        body.selectionBlend = 1;
      }
    }
    this.windLevel = 1;
    this.spinDirection = 1;
    this.scrollEnergy = 0;
  }

  select(index: number | null) {
    if (index !== null && (index < 0 || index >= this.bodies.length)) {
      return;
    }
    this.selected = index;
    this.bodies.forEach((body) => {
      body.selected = body.index === index;
    });
    if (this.reduced) this.applyReducedPose();
  }

  get selectedProjectIndex() {
    return this.selected;
  }

  /** Scroll wind normalised to the environment's peak energy, 0..1. */
  get energyLevel() {
    return clamp(
      this.scrollEnergy / this.environment.wind.maxEnergy,
      0,
      1,
    );
  }

  captureState(): VortexWorldState {
    return {
      time: this.time,
      windLevel: this.windLevel,
      spinDirection: this.spinDirection,
      turbulenceLevel: this.turbulenceLevel,
      scrollEnergy: this.scrollEnergy,
      selected: this.selected,
      bodies: this.bodies.map((body) => ({
        id: body.project.index,
        position: [body.position.x, body.position.y, body.position.z],
        quaternion: [
          body.orientation.x,
          body.orientation.y,
          body.orientation.z,
          body.orientation.w,
        ],
        velocity: [body.velocity.x, body.velocity.y, body.velocity.z],
        angularVelocity: [
          body.angularVelocity.x,
          body.angularVelocity.y,
          body.angularVelocity.z,
        ],
        selectionBlend: body.selectionBlend,
      })),
    };
  }

  /**
   * Resumes a captured state in place: every card keeps its exact pose,
   * velocity and selection blend. The accumulator starts clean and the first
   * frame after restore renders without stepping, so the captured pose is what
   * the first resumed frame shows; collision metrics restart from zero.
   */
  restoreState(state: VortexWorldState): boolean {
    if (this.disposed || this.reduced) return false;
    if (state.bodies.length !== this.bodies.length) return false;
    for (let index = 0; index < this.bodies.length; index += 1) {
      if (state.bodies[index].id !== this.bodies[index].project.index) {
        return false;
      }
    }

    const selected =
      state.selected !== null && state.selected < this.bodies.length
        ? state.selected
        : null;
    this.selected = selected;
    this.time = Math.max(0, state.time);
    this.windLevel = clamp(state.windLevel, 1, 4);
    this.spinDirection = clamp(state.spinDirection, -1, 1);
    this.turbulenceLevel = Math.max(0, state.turbulenceLevel);
    this.scrollEnergy = clamp(
      state.scrollEnergy,
      0,
      this.environment.wind.maxEnergy,
    );
    this.accumulator = 0;
    this.stepsLastFrame = 0;
    this.stepMs = 0;
    this.peakStepMs = 0;
    this.resetCollisionMetrics();

    this.bodies.forEach((body, index) => {
      const saved = state.bodies[index];
      body.selected = index === selected;
      body.selectionBlend = clamp(saved.selectionBlend, 0, 1);
      this.placeBody(
        body,
        this.tempA.fromArray(saved.position),
        this.quaternionA
          .set(
            saved.quaternion[0],
            saved.quaternion[1],
            saved.quaternion[2],
            saved.quaternion[3],
          )
          .normalize(),
        this.tempB.fromArray(saved.velocity),
        this.tempC.fromArray(saved.angularVelocity),
      );
    });

    this.resumeFrame = true;
    this.restoredState = this.captureState();
    return true;
  }

  advance(delta: number, input: VortexInput) {
    if (this.disposed) return;
    this.reportFrame(delta);
    if (this.reduced) {
      this.stepsLastFrame = 0;
      return;
    }
    if (this.resumeFrame) {
      this.resumeFrame = false;
      this.stepsLastFrame = 0;
      return;
    }
    if (this.frozen) {
      this.stepsLastFrame = 0;
      return;
    }

    const frameDelta = Math.min(delta, this.environment.physics.maxFrameDelta);
    this.scrollEnergy = clamp(
      this.scrollEnergy + input.scrollImpulse,
      0,
      this.environment.wind.maxEnergy,
    );
    input.scrollImpulse = 0;
    this.scrollEnergy *= Math.exp(
      -frameDelta / this.environment.wind.energyDecay,
    );
    const targetLevel =
      1 + this.scrollEnergy * this.environment.wind.boostPerEnergy;
    this.windLevel = damp(
      this.windLevel,
      targetLevel,
      targetLevel > this.windLevel
        ? this.environment.wind.levelRate
        : this.environment.wind.levelRelaxRate,
      frameDelta,
    );
    this.spinDirection = damp(
      this.spinDirection,
      input.scrollDirection,
      this.environment.wind.directionRate,
      frameDelta,
    );
    this.turbulenceLevel =
      this.environment.turbulence.strength * this.windLevel;

    this.accumulator += frameDelta;
    const fixedStep = this.environment.physics.fixedStep;
    const maxSubsteps = this.environment.physics.maxSubsteps;
    let steps = Math.floor(this.accumulator / fixedStep);
    if (steps > maxSubsteps) {
      steps = maxSubsteps;
      this.accumulator = fixedStep * maxSubsteps;
    }
    this.stepsLastFrame = steps;

    if (steps > 0) {
      const start = performance.now();
      for (let step = 0; step < steps; step += 1) {
        this.step(fixedStep, input);
      }
      const elapsed = performance.now() - start;
      const perStep = elapsed / steps;
      this.stepMs =
        this.stepMs === 0 ? perStep : this.stepMs * 0.9 + perStep * 0.1;
      this.peakStepMs = Math.max(perStep, this.peakStepMs * 0.995);
      this.accumulator -= steps * fixedStep;
      if (this.accumulator > fixedStep * maxSubsteps) {
        this.accumulator = 0;
      }
    }
  }

  private reportFrame(delta: number) {
    if (!Number.isFinite(delta) || delta <= 0 || delta > 0.2) return;
    const instant = 1 / delta;
    this.fps = this.fps * 0.92 + instant * 0.08;
  }

  private updateSelectionTargets(time: number) {
    const selection = this.environment.selection;
    const wobble = selection.targetWobble;
    this.selectionTarget.set(
      selection.target[0] + Math.sin(time * 0.27 + 0.6) * wobble,
      selection.target[1] + Math.sin(time * 0.21 + 1.9) * wobble * 0.6,
      selection.target[2] + Math.sin(time * 0.19 + 2.4) * wobble * 0.5,
    );
    this.selectionOrientation.copy(
      quaternionFromYawPitchRoll(
        selection.yaw + Math.sin(time * 0.31 + 0.4) * 0.025,
        selection.pitch + Math.sin(time * 0.23 + 2.2) * 0.018,
        selection.roll,
      ),
    );
  }

  private updateAxes(body: VortexBody) {
    body.axes[0].set(1, 0, 0).applyQuaternion(body.orientation);
    body.axes[1].set(0, 1, 0).applyQuaternion(body.orientation);
    body.axes[2].set(0, 0, 1).applyQuaternion(body.orientation);
  }

  private step(delta: number, input: VortexInput) {
    const env = this.environment;
    this.time += delta;
    const time = this.time;
    this.updateSelectionTargets(time);

    for (const body of this.bodies) {
      const targetBlend = body.selected ? 1 : 0;
      body.selectionBlend = damp(
        body.selectionBlend,
        targetBlend,
        env.selection.blendRate,
        delta,
      );
      body.force.set(0, 0, 0);
      body.torque.set(0, 0, 0);
      this.updateAxes(body);

      sampleAir(
        env,
        body.wind,
        body.position.x,
        body.position.y,
        body.position.z,
        time,
        this.windLevel,
        this.spinDirection,
        input,
      );

      const windResponse =
        body.profile.windResponse *
        (1 - body.selectionBlend * (1 - env.selection.windScale));
      const dragScale =
        body.profile.drag *
        (1 + body.selectionBlend * (env.selection.dragScale - 1));

      const omegaWorld = body.angularVelocity;
      const normal = this.normal
        .set(0, 0, 1)
        .applyQuaternion(body.orientation);
      const pointArea = body.surfaceArea / body.corners.length;
      const aeroGain = env.aerodynamics.gain;

      for (const corner of body.corners) {
        const lever = this.cornerWorld
          .copy(corner)
          .applyQuaternion(body.orientation);
        const pointX = body.position.x + lever.x;
        const pointY = body.position.y + lever.y;
        const pointZ = body.position.z + lever.z;

        sampleAir(
          env,
          this.tempA,
          pointX,
          pointY,
          pointZ,
          time,
          this.windLevel,
          this.spinDirection,
          input,
        );
        this.tempA.multiplyScalar(windResponse);

        const pointVelocity = this.pointVelocity
          .copy(omegaWorld)
          .cross(lever)
          .add(body.velocity);
        const relative = this.relative.copy(this.tempA).sub(pointVelocity);
        const speed = Math.min(relative.length(), 24);
        if (speed < 0.0005) continue;

        const alignment = Math.abs(normal.dot(relative)) / speed;
        const projected = 0.12 + 0.88 * alignment;
        const magnitude = aeroGain * dragScale * pointArea * projected * speed;
        this.forceTemp.copy(relative).multiplyScalar(magnitude);
        body.force.add(this.forceTemp);
        this.torqueTemp.crossVectors(lever, this.forceTemp);
        body.torque.add(this.torqueTemp);
      }

      // Unsteady pressure torque: coherent curl noise, not per-frame random.
      this.tempB.set(0, 0, 0);
      addTurbulenceWind(
        env,
        this.tempB,
        body.position.x * 1.45 + 11.2,
        body.position.y * 1.45 + 3.6,
        body.position.z * 1.45 - 7.3,
        time + 9.7,
        this.windLevel,
      );
      const torqueGain =
        env.turbulence.torque *
        env.turbulence.torqueScale *
        body.profile.torqueResponse *
        (1 - body.selectionBlend * 0.72);
      body.torque.addScaledVector(this.tempB, torqueGain);

      this.applyContainment(body);
    }

    this.applyDensityForces();
    if (this.environment.selection.wakeRange > 0) this.applySelectionWake();

    for (const body of this.bodies) {
      if (body.selectionBlend > 0.001) this.applySelection(body);

      const accelerationLimit = env.physics.maxAcceleration;
      const acceleration = this.tempC
        .copy(body.force)
        .multiplyScalar(body.inverseMass);
      if (acceleration.length() > accelerationLimit) {
        body.force
          .copy(acceleration.setLength(accelerationLimit))
          .multiplyScalar(body.mass);
      }

      const angularDamping =
        body.profile.angularDrag *
        (1 + body.selectionBlend * (env.selection.angularDragScale - 1));
      body.rigidBody.setLinearDamping(env.aerodynamics.linearDamping);
      body.rigidBody.setAngularDamping(angularDamping);
      body.rigidBody.resetForces(false);
      body.rigidBody.resetTorques(false);
      body.rigidBody.addForce(body.force, false);
      body.rigidBody.addTorque(body.torque, false);
    }

    this.simulation.step();

    for (const body of this.bodies) {
      this.syncBody(body);
    }

    if (this.diagnostics) this.sampleContacts();
  }

  private syncBody(body: VortexBody) {
    const env = this.environment;
    const rb = body.rigidBody;
    const translation = rb.translation();
    const rotation = rb.rotation();
    const linear = rb.linvel();
    const angular = rb.angvel();

    body.position.set(translation.x, translation.y, translation.z);
    body.orientation
      .set(rotation.x, rotation.y, rotation.z, rotation.w)
      .normalize();
    body.velocity.set(linear.x, linear.y, linear.z);
    body.angularVelocity.set(angular.x, angular.y, angular.z);

    const speed = body.velocity.length();
    if (speed > env.physics.maxSpeed) {
      body.velocity.setLength(env.physics.maxSpeed);
      rb.setLinvel(body.velocity, false);
    }
    const angularSpeed = body.angularVelocity.length();
    if (angularSpeed > env.physics.maxAngularSpeed) {
      body.angularVelocity.setLength(env.physics.maxAngularSpeed);
      rb.setAngvel(body.angularVelocity, false);
    }
  }

  private applyContainment(body: VortexBody) {
    const env = this.environment;
    const volume = env.volume;
    const containment = env.containment;
    // A pulled card is steered outside the field by the selection spring, so
    // the soft boundary gives way for it while Rapier still owns contacts.
    const containmentScale =
      1 - body.selectionBlend * env.selection.fieldYield;
    const radius = Math.hypot(body.position.x, body.position.z);
    const cap = Math.max(vortexRadiusAt(volume, body.position.y), 0.001);
    const outerLimit = cap * volume.outerStart;

    if (radius > outerLimit) {
      const over = radius - outerLimit;
      const dirX = radius > 0.0001 ? body.position.x / radius : 1;
      const dirZ = radius > 0.0001 ? body.position.z / radius : 0;
      const radialVelocity =
        radius > 0.0001
          ? (body.velocity.x * body.position.x +
              body.velocity.z * body.position.z) /
            radius
          : 0;
      const accel =
        Math.min(
          containment.outerMaxAccel,
          containment.outerStiffness * over +
            containment.outerDamping * Math.max(0, radialVelocity),
        ) * containmentScale;
      body.force.x -= dirX * accel * body.mass;
      body.force.z -= dirZ * accel * body.mass;
    }

    if (radius < volume.innerRadius) {
      const dirX =
        radius > 0.0001
          ? body.position.x / radius
          : Math.cos(body.index * 2.399 + 0.7);
      const dirZ =
        radius > 0.0001
          ? body.position.z / radius
          : Math.sin(body.index * 2.399 + 0.7);
      const accel =
        Math.min(
          containment.outerMaxAccel,
          containment.innerStiffness * (volume.innerRadius - radius),
        ) * containmentScale;
      body.force.x += dirX * accel * body.mass;
      body.force.z += dirZ * accel * body.mass;
    }

    if (radius > 0.001) {
      const tangentX = -body.position.z / radius;
      const tangentZ = body.position.x / radius;
      const tangentialSpeed =
        body.velocity.x * tangentX + body.velocity.z * tangentZ;
      const centripetal =
        (containment.orbitalSupport * tangentialSpeed * tangentialSpeed) /
        Math.max(radius, volume.innerRadius * 0.8);
      const orbital =
        Math.min(containment.outerMaxAccel * 0.5, centripetal) *
        containmentScale;
      if (orbital > 0) {
        body.force.x -= (body.position.x / radius) * orbital * body.mass;
        body.force.z -= (body.position.z / radius) * orbital * body.mass;
      }
    }

    const floor = volume.bottom + volume.verticalInset;
    const ceiling = volume.top - volume.verticalInset;
    if (body.position.y < floor) {
      const accel =
        Math.min(
          containment.verticalMaxAccel,
          containment.verticalStiffness * (floor - body.position.y),
        ) * containmentScale;
      body.force.y += accel * body.mass;
    } else if (body.position.y > ceiling) {
      const accel =
        Math.min(
          containment.verticalMaxAccel,
          containment.verticalStiffness * (body.position.y - ceiling),
        ) * containmentScale;
      body.force.y -= accel * body.mass;
    }
  }

  private applySelection(body: VortexBody) {
    const selection = this.environment.selection;
    const blend = body.selectionBlend;
    const springAccel = this.tempC
      .copy(this.selectionTarget)
      .sub(body.position)
      .multiplyScalar(selection.spring)
      .addScaledVector(body.velocity, -selection.damping);
    if (springAccel.length() > selection.maxAccel) {
      springAccel.setLength(selection.maxAccel);
    }
    let proximity = 1;
    for (const other of this.bodies) {
      if (other === body) continue;
      const distance = body.position.distanceTo(other.position);
      if (distance >= selection.proximityRange) continue;
      const closeness =
        1 -
        smoothstep(
          selection.proximityRange * 0.5,
          selection.proximityRange,
          distance,
        );
      proximity = Math.min(
        proximity,
        1 - (1 - selection.proximityScale) * closeness,
      );
    }
    springAccel.multiplyScalar(proximity);
    body.force.addScaledVector(springAccel, body.mass * blend);

    const inverseOrientation = this.quaternionA
      .copy(body.orientation)
      .invert();
    const error = this.quaternionB
      .copy(this.selectionOrientation)
      .multiply(inverseOrientation);
    error.normalize();
    if (error.w < 0) {
      error.x = -error.x;
      error.y = -error.y;
      error.z = -error.z;
      error.w = -error.w;
    }
    const angle = 2 * Math.acos(clamp(error.w, -1, 1));
    if (angle < 0.0005) return;

    const sin = Math.sin(angle / 2);
    const axis = this.tempD.set(
      sin > 0.0001 ? error.x / sin : 0,
      sin > 0.0001 ? error.y / sin : 0,
      sin > 0.0001 ? error.z / sin : 1,
    );
    const desired = this.tempB
      .copy(axis)
      .multiplyScalar(angle * selection.angularSpring)
      .addScaledVector(body.angularVelocity, -selection.angularDamping);
    const magnitude = desired.length();
    if (magnitude > 20) desired.setLength(20);
    const meanInertia =
      (body.inertia.x + body.inertia.y + body.inertia.z) / 3;
    body.torque.addScaledVector(desired, meanInertia * blend);
  }

  /**
   * Soft oriented spacing plus a local occupancy pressure. This prepares the
   * field before surfaces touch; Rapier still owns every actual contact.
   */
  private applyDensityForces() {
    const separation = this.environment.separation;
    const fieldYield = this.environment.selection.fieldYield;
    const influence = separation.gap + separation.range;

    for (let index = 0; index < this.bodies.length; index += 1) {
      this.bodies[index].crowding = 0;
      this.crowdWeights[index] = 0;
      this.centroids[index].set(0, 0, 0);
    }

    for (let i = 0; i < this.bodies.length; i += 1) {
      for (let j = i + 1; j < this.bodies.length; j += 1) {
        const first = this.bodies[i];
        const second = this.bodies[j];
        const delta = this.tempC.copy(second.position).sub(first.position);
        const distance = delta.length();
        if (distance < 0.0001) {
          delta.set(
            Math.cos(first.index * 2.399),
            0.2,
            Math.sin(first.index * 2.399),
          );
        }
        const normal = this.tempD.copy(delta).normalize();
        const gap =
          distance -
          extentAlong(first.axes, normal, first.halfExtents) -
          extentAlong(second.axes, normal, second.halfExtents);

        if (distance < separation.neighborhoodRadius) {
          const weight = 1 - distance / separation.neighborhoodRadius;
          first.crowding += weight;
          second.crowding += weight;
          this.crowdWeights[i] += weight;
          this.crowdWeights[j] += weight;
          this.centroids[i].addScaledVector(second.position, weight);
          this.centroids[j].addScaledVector(first.position, weight);
        }

        if (gap >= influence) continue;

        const fade = 1 - smoothstep(separation.gap, influence, gap);
        const closing = this.tempE
          .copy(second.velocity)
          .sub(first.velocity)
          .dot(normal);
        const spring = Math.max(0, separation.gap - gap) * separation.stiffness;
        const damper = Math.max(0, -closing) * separation.damping;
        const accel = Math.min(
          separation.maxAccel,
          (spring + damper) * fade,
        );
        if (accel <= 0) continue;

        const reducedMass =
          (first.mass * second.mass) / (first.mass + second.mass);
        const magnitude = accel * reducedMass;
        first.force.addScaledVector(
          normal,
          -magnitude * (1 - first.selectionBlend * fieldYield),
        );
        second.force.addScaledVector(
          normal,
          magnitude * (1 - second.selectionBlend * fieldYield),
        );
      }
    }

    for (let index = 0; index < this.bodies.length; index += 1) {
      const body = this.bodies[index];
      const radius = Math.hypot(body.position.x, body.position.z);
      const cap = Math.max(
        vortexRadiusAt(this.environment.volume, body.position.y),
        0.001,
      );
      this.radialRatios[index] = radius / cap;
      this.radialHeights[index] = heightFraction(
        this.environment.volume,
        body.position.y,
      );
    }

    const radialInfluence =
      separation.radialSpacing + separation.radialRange;
    for (let i = 0; i < this.bodies.length; i += 1) {
      for (let j = i + 1; j < this.bodies.length; j += 1) {
        const first = this.bodies[i];
        const second = this.bodies[j];
        const heightDelta = Math.abs(
          this.radialHeights[j] - this.radialHeights[i],
        );
        if (heightDelta >= separation.radialHeightBand) continue;
        const deltaRatio = this.radialRatios[j] - this.radialRatios[i];
        const spread = Math.abs(deltaRatio);
        if (spread >= radialInfluence) continue;

        const fade =
          1 -
          smoothstep(
            separation.radialSpacing,
            radialInfluence,
            spread,
          );
        const heightFade =
          1 -
          smoothstep(
            separation.radialHeightBand * 0.55,
            separation.radialHeightBand,
            heightDelta,
          );
        if (fade <= 0 || heightFade <= 0) continue;

        const tie = Math.sin(
          (first.index + 1) * 12.9898 + (second.index + 1) * 78.233,
        );
        const sign =
          spread > 0.002 ? Math.sign(deltaRatio) : tie >= 0 ? 1 : -1;
        const accel =
          separation.radialPressure * fade * heightFade;

        const radiusFirst = Math.hypot(first.position.x, first.position.z);
        const radiusSecond = Math.hypot(second.position.x, second.position.z);
        const dirFirstX =
          radiusFirst > 0.0001 ? first.position.x / radiusFirst : 1;
        const dirFirstZ =
          radiusFirst > 0.0001 ? first.position.z / radiusFirst : 0;
        const dirSecondX =
          radiusSecond > 0.0001 ? second.position.x / radiusSecond : 1;
        const dirSecondZ =
          radiusSecond > 0.0001 ? second.position.z / radiusSecond : 0;

        first.force.x -=
          dirFirstX *
          sign *
          accel *
          first.mass *
          (1 - first.selectionBlend * fieldYield);
        first.force.z -=
          dirFirstZ *
          sign *
          accel *
          first.mass *
          (1 - first.selectionBlend * fieldYield);
        second.force.x +=
          dirSecondX *
          sign *
          accel *
          second.mass *
          (1 - second.selectionBlend * fieldYield);
        second.force.z +=
          dirSecondZ *
          sign *
          accel *
          second.mass *
          (1 - second.selectionBlend * fieldYield);
      }
    }

    for (let index = 0; index < this.bodies.length; index += 1) {
      const body = this.bodies[index];
      const crowding = body.crowding;
      if (crowding <= 0.01) continue;
      const centroid = this.centroids[index].divideScalar(
        Math.max(this.crowdWeights[index], 0.0001),
      );
      const away = this.tempA.copy(body.position).sub(centroid);
      if (away.lengthSq() < 0.0001) {
        away.set(
          Math.cos(body.index * 2.399 + 1.1),
          0.2,
          Math.sin(body.index * 2.399 + 1.1),
        );
      }
      away.normalize();

      const radial = Math.hypot(body.position.x, body.position.z);
      const radialX = radial > 0.0001 ? body.position.x / radial : 1;
      const radialZ = radial > 0.0001 ? body.position.z / radial : 0;
      const cap = Math.max(
        vortexRadiusAt(this.environment.volume, body.position.y),
        0.001,
      );
      const central =
        1 -
        smoothstep(
          this.environment.volume.innerRadius * 1.2,
          cap * 0.62,
          radial,
        );
      const upper = smoothstep(
        0.58,
        0.9,
        heightFraction(this.environment.volume, body.position.y),
      );

      if (this.environment.population === 33) {
        // With 33 bodies a pure centroid push parks almost every card on the
        // outer wall. Bias the pressure inward at the rim and outward near
        // the eye so the field occupies the full radial section.
        const ratio = radial / cap;
        const outward = 1 - smoothstep(0.38, 0.58, ratio);
        const inward = smoothstep(0.8, 0.94, ratio);
        const radialPressure =
          central * 0.55 + outward * 0.4 - inward * 0.85;
        this.tempB.set(
          away.x * 0.3 + radialX * radialPressure,
          away.y * 0.3 - upper * 0.2,
          away.z * 0.3 + radialZ * radialPressure,
        );
      } else {
        this.tempB.set(
          away.x * 0.65 + radialX * central * 0.9,
          away.y * 0.35 - upper * 0.85,
          away.z * 0.65 + radialZ * central * 0.9,
        );
      }
      if (this.tempB.lengthSq() < 0.0001) this.tempB.copy(away);
      this.tempB.normalize();

      const squeeze = Math.max(0, crowding - separation.pressureStart);
      const accel = Math.min(
        separation.pressureMaxAccel,
        squeeze * separation.pressure,
      );
      if (accel <= 0) continue;
      body.force.addScaledVector(
        this.tempB,
        accel * body.mass * (1 - body.selectionBlend * fieldYield),
      );
    }
  }

  /**
   * The pulled card carries a pressure wave that parts the surrounding field.
   * It only accelerates neighbours; Rapier still resolves every contact.
   */
  private applySelectionWake() {
    const selection = this.environment.selection;
    if (selection.wakeRange <= 0 || this.selected === null) return;
    const source = this.bodies[this.selected];
    if (!source || source.selectionBlend < 0.04) return;
    const travel = this.tempD
      .copy(this.selectionTarget)
      .sub(source.position);
    travel.y *= 0.35;
    if (travel.lengthSq() < 0.0001) travel.set(0, 0, 1);
    travel.normalize();

    for (const body of this.bodies) {
      if (body === source) continue;
      const delta = this.tempA.copy(body.position).sub(source.position);
      const ahead = delta.dot(travel);
      if (ahead < -selection.wakeRange * 0.4) continue;
      const lateral = this.tempB
        .copy(delta)
        .addScaledVector(travel, -ahead);
      const lateralDistance = lateral.length();
      if (lateralDistance >= selection.wakeRange * 0.85) continue;
      if (lateralDistance < 0.0001) {
        lateral.set(travel.z, 0, -travel.x);
        if (lateral.lengthSq() < 0.0001) lateral.set(1, 0, 0);
      }
      lateral.normalize();
      const fade =
        1 -
        smoothstep(
          selection.wakeRange * 0.25,
          selection.wakeRange * 0.85,
          lateralDistance,
        );
      const front = smoothstep(-0.5, 0.3, ahead);
      const accel =
        selection.wakeAccel * fade * (0.35 + 0.65 * front) *
        source.selectionBlend;
      if (accel <= 0.0005) continue;
      body.force.addScaledVector(lateral, accel * body.mass);
    }
  }

  private sampleContacts() {
    this.contactStepCount += 1;
    let minClearance = 99;
    let maxPenetration = 0;
    let activePairs = 0;
    let overlapped = false;
    const contacts: VortexContactSnapshot[] = [];

    for (let i = 0; i < this.bodies.length; i += 1) {
      for (let j = i + 1; j < this.bodies.length; j += 1) {
        this.simulation.contactPair(
          this.bodies[i].collider,
          this.bodies[j].collider,
          (manifold) => {
            const count = manifold.numContacts();
            if (count === 0) return;
            let pairDistance = 99;
            for (let contact = 0; contact < count; contact += 1) {
              pairDistance = Math.min(
                pairDistance,
                manifold.contactDist(contact),
              );
            }
            if (pairDistance > 0.02) return;

            activePairs += 1;
            minClearance = Math.min(minClearance, pairDistance);
            if (pairDistance < -0.001) {
              overlapped = true;
              maxPenetration = Math.max(maxPenetration, -pairDistance);
            }

            const normal = manifold.normal();
            const solverContacts = manifold.numSolverContacts();
            const point =
              solverContacts > 0
                ? manifold.solverContactPoint(0)
                : { x: 0, y: 0, z: 0 };
            const impulse =
              solverContacts > 0 ? manifold.contactImpulse(0) : 0;
            contacts.push({
              a: i,
              b: j,
              distance: pairDistance,
              normal: [normal.x, normal.y, normal.z],
              point: [point?.x ?? 0, point?.y ?? 0, point?.z ?? 0],
              impulse,
            });
          },
        );
      }
    }

    if (activePairs > 0) this.contactActiveSteps += 1;
    if (overlapped) this.overlapStepCount += 1;
    this.maxPenetration = Math.max(this.maxPenetration, maxPenetration);
    this.minClearance = Math.min(this.minClearance, minClearance);
    this.contacts = contacts;
  }

  resetCollisionMetrics() {
    this.contactStepCount = 0;
    this.contactActiveSteps = 0;
    this.overlapStepCount = 0;
    this.maxPenetration = 0;
    this.minClearance = 99;
    this.contacts = [];
  }

  collisionSnapshot(): VortexCollisionSnapshot {
    return {
      diagnostics: this.diagnostics,
      contacts: this.contacts.map((contact) => ({
        ...contact,
        normal: [...contact.normal] as Vec3Tuple,
        point: [...contact.point] as Vec3Tuple,
      })),
      activePairs: this.contacts.length,
      contactSteps: this.contactActiveSteps,
      overlapSteps: this.overlapStepCount,
      stepCount: this.contactStepCount,
      maxPenetration: this.maxPenetration,
      minClearance: this.minClearance,
      solverIterations: this.simulation.numSolverIterations,
      internalPgsIterations: this.simulation.numInternalPgsIterations,
      ccdSubsteps: this.simulation.maxCcdSubsteps,
      allowedLinearError:
        this.simulation.integrationParameters.normalizedAllowedLinearError,
    };
  }

  inventory(): VortexInventoryEntry[] {
    return this.bodies.map((body) => ({
      id: body.project.index,
      slug: body.project.slug,
      name: body.project.name,
      category: body.project.category,
    }));
  }

  distributionSnapshot(): VortexDistributionSnapshot {
    const env = this.environment;
    const bodies = this.bodies;
    const heights: number[] = [];
    const radii: number[] = [];
    const depths: number[] = [];
    const lower = { count: 0 };
    const middle = { count: 0 };
    const upper = { count: 0 };
    const inner = { count: 0 };
    const mid = { count: 0 };
    const outer = { count: 0 };
    const back = { count: 0 };
    const depthMid = { count: 0 };
    const front = { count: 0 };
    const gaps: number[] = [];
    const nearest = bodies.map(() => Infinity);
    const minPossible = 99;
    let ratioTotal = 0;

    for (const body of bodies) {
      const t = heightFraction(env.volume, body.position.y);
      heights.push(body.position.y);
      radii.push(Math.hypot(body.position.x, body.position.z));
      depths.push(body.position.z);
      if (t < 1 / 3) lower.count += 1;
      else if (t < 2 / 3) middle.count += 1;
      else upper.count += 1;

      const cap = Math.max(vortexRadiusAt(env.volume, body.position.y), 0.001);
      const ratio = radii[radii.length - 1] / cap;
      ratioTotal += ratio;
      if (ratio < 0.45) inner.count += 1;
      else if (ratio < 0.72) mid.count += 1;
      else outer.count += 1;

      if (body.position.z < -0.6) back.count += 1;
      else if (body.position.z < 1.2) depthMid.count += 1;
      else front.count += 1;
    }

    for (let i = 0; i < bodies.length; i += 1) {
      for (let j = i + 1; j < bodies.length; j += 1) {
        const first = bodies[i];
        const second = bodies[j];
        const delta = this.tempC.copy(second.position).sub(first.position);
        const distance = delta.length();
        if (distance < 0.0001) {
          gaps.push(-extentAlong(first.axes, first.axes[2], first.halfExtents));
        } else {
          const normal = this.tempD.copy(delta).normalize();
          const gap =
            distance -
            extentAlong(first.axes, normal, first.halfExtents) -
            extentAlong(second.axes, normal, second.halfExtents);
          gaps.push(gap);
          nearest[i] = Math.min(nearest[i], gap);
          nearest[j] = Math.min(nearest[j], gap);
        }
      }
    }

    const finiteNearest = nearest.filter((value) => Number.isFinite(value));
    const meanNearestGap =
      finiteNearest.length > 0
        ? finiteNearest.reduce((total, value) => total + value, 0) /
          finiteNearest.length
        : 99;
    const meanPairGap =
      gaps.length > 0
        ? gaps.reduce((total, value) => total + value, 0) / gaps.length
        : 99;

    return {
      lower: lower.count,
      middle: middle.count,
      upper: upper.count,
      inner: inner.count,
      mid: mid.count,
      outer: outer.count,
      depthBack: back.count,
      depthMid: depthMid.count,
      depthFront: front.count,
      meanNearestGap,
      minGap: gaps.length > 0 ? Math.min(...gaps) : minPossible,
      meanPairGap,
      meanRadiusRatio: bodies.length > 0 ? ratioTotal / bodies.length : 0,
      verticalSpread: spread(heights),
      radialSpread: spread(radii),
      depthSpread: spread(depths),
      crowdings: bodies.map((body) => body.crowding),
    };
  }

  private placeBody(
    body: VortexBody,
    position: Vector3,
    orientation: Quaternion,
    velocity: Vector3,
    angularVelocity: Vector3,
  ) {
    const rb = body.rigidBody;
    rb.setTranslation(position, true);
    rb.setRotation(orientation, true);
    rb.setLinvel(velocity, true);
    rb.setAngvel(angularVelocity, true);
    rb.resetForces(true);
    rb.resetTorques(true);
    body.position.copy(position);
    body.orientation.copy(orientation).normalize();
    body.velocity.copy(velocity);
    body.angularVelocity.copy(angularVelocity);
    body.force.set(0, 0, 0);
    body.torque.set(0, 0, 0);
    this.updateAxes(body);
  }

  private stageAllBodies() {
    if (this.environment.population === 33) {
      this.bodies.forEach((body) => {
        this.placeBody(
          body,
          body.seed.position,
          body.seed.quaternion,
          body.seed.velocity,
          body.seed.angularVelocity,
        );
        body.selectionBlend = 0;
        body.selected = false;
      });
      return;
    }

    this.bodies.forEach((body) => {
      const stage = STAGE_POSITIONS[body.index % STAGE_POSITIONS.length];
      const yaw = STAGE_YAWS[body.index % STAGE_YAWS.length];
      const orientation = quaternionFromYawPitchRoll(yaw, 0.15 * body.index - 0.2, 0.1 * body.index);
      this.placeBody(
        body,
        this.tempA.set(stage[0], stage[1], stage[2]),
        orientation,
        this.tempB.set(0, 0, 0),
        this.tempC.set(0.2 * body.index, 0.35, -0.15 * body.index),
      );
      body.selectionBlend = 0;
    });
  }

  private poseParticipant(
    index: number,
    position: Vec3Tuple,
    yaw: number,
    pitch: number,
    roll: number,
    velocity: Vec3Tuple,
    angularVelocity: Vec3Tuple,
  ) {
    const body = this.bodies[index];
    if (!body) return;
    this.placeBody(
      body,
      this.tempA.set(position[0], position[1], position[2]),
      quaternionFromYawPitchRoll(yaw, pitch, roll),
      this.tempB.set(velocity[0], velocity[1], velocity[2]),
      this.tempC.set(
        angularVelocity[0],
        angularVelocity[1],
        angularVelocity[2],
      ),
    );
    body.selectionBlend = 0;
  }

  applyScenario(name: VortexScenarioName): boolean {
    if (this.reduced || this.disposed) return false;

    this.stageAllBodies();
    this.resetCollisionMetrics();
    this.accumulator = 0;
    this.windLevel = 1;
    this.spinDirection = 1;
    this.scrollEnergy = 0;
    this.turbulenceLevel = this.environment.turbulence.strength;

    switch (name) {
      case "idle": {
        this.bodies.forEach((body) => {
          this.placeBody(
            body,
            body.seed.position,
            body.seed.quaternion,
            body.seed.velocity,
            body.seed.angularVelocity,
          );
          body.selectionBlend = 0;
        });
        this.time = 0;
        break;
      }
      case "face-first": {
        this.poseParticipant(
          0,
          [-1.0, 0.34, 1.6],
          Math.PI / 2,
          0.04,
          0,
          [1.5, 0, 0.02],
          [0.4, 0.9, 0.2],
        );
        this.poseParticipant(
          1,
          [1.0, 0.28, 1.6],
          -Math.PI / 2,
          -0.04,
          0.03,
          [-1.5, 0, -0.02],
          [-0.3, -0.7, 0.25],
        );
        break;
      }
      case "edge-first": {
        this.poseParticipant(
          0,
          [-2.15, 0.2, 0.9],
          0,
          0,
          0,
          [2.0, 0, 0],
          [0.2, 0.6, 0.1],
        );
        this.poseParticipant(
          1,
          [2.15, 0.14, 0.9],
          Math.PI,
          0,
          0,
          [-2.0, 0, 0],
          [0.15, -0.55, -0.08],
        );
        break;
      }
      case "angled": {
        this.poseParticipant(
          0,
          [-1.25, 0.5, 1.75],
          0.55,
          0.18,
          -0.08,
          [1.4, -0.1, -0.15],
          [0.35, 0.8, -0.25],
        );
        this.poseParticipant(
          1,
          [1.25, 0.2, 1.45],
          -1.15,
          -0.2,
          0.1,
          [-1.3, 0.05, 0.15],
          [-0.25, -0.6, 0.35],
        );
        break;
      }
      case "rotating": {
        this.poseParticipant(
          0,
          [-1.35, 0.3, 1.9],
          0.12,
          0.12,
          -0.05,
          [1.5, 0, -0.05],
          [3.4, 1.6, 1.0],
        );
        this.poseParticipant(
          1,
          [1.35, 0.2, 1.85],
          Math.PI - 0.18,
          -0.1,
          0.05,
          [-1.5, 0, 0.05],
          [-3.0, 2.0, -0.8],
        );
        break;
      }
      case "slow": {
        this.windLevel = 0.5;
        this.turbulenceLevel =
          this.environment.turbulence.strength * this.windLevel;
        this.poseParticipant(
          0,
          [0.35, 0.28, 1.75],
          0,
          0.02,
          0,
          [0, 0, 0.5],
          [0.05, 0.2, 0.02],
        );
        this.poseParticipant(
          1,
          [0.55, 0.25, 2.05],
          Math.PI,
          -0.02,
          0,
          [0, 0, -0.5],
          [0.02, -0.2, -0.03],
        );
        break;
      }
      case "fast-gust": {
        this.windLevel = 2.3;
        this.scrollEnergy = 1.2;
        this.turbulenceLevel =
          this.environment.turbulence.strength * this.windLevel;
        this.poseParticipant(
          0,
          [-2.6, 0.2, 0.8],
          0,
          0.05,
          0,
          [4.2, 0, 0],
          [0.4, 1.8, 0.2],
        );
        this.poseParticipant(
          1,
          [2.6, 0.2, 0.8],
          Math.PI,
          -0.05,
          0,
          [-4.2, 0, 0],
          [-0.3, -1.6, -0.15],
        );
        break;
      }
      case "reverse-wind": {
        this.spinDirection = -1;
        this.windLevel = 1.9;
        this.scrollEnergy = 0.8;
        this.turbulenceLevel =
          this.environment.turbulence.strength * this.windLevel;
        this.poseParticipant(
          0,
          [-2.1, 0.25, 0.9],
          0.35,
          0.03,
          -0.02,
          [2.1, 0, 0.2],
          [0.25, 0.9, -0.2],
        );
        this.poseParticipant(
          1,
          [2.1, 0.18, 0.9],
          Math.PI - 0.35,
          -0.03,
          0.02,
          [-2.0, 0, -0.15],
          [-0.2, -0.8, 0.25],
        );
        break;
      }
      case "multi-close": {
        this.poseParticipant(
          0,
          [-1.4, 0.35, 1.9],
          0.12,
          0.1,
          -0.04,
          [1.8, 0, 0],
          [0.25, 0.5, 0.1],
        );
        this.poseParticipant(
          1,
          [1.4, 0.35, 1.9],
          Math.PI - 0.12,
          -0.1,
          0.04,
          [-1.8, 0, 0],
          [-0.2, -0.45, 0.15],
        );
        this.poseParticipant(
          2,
          [0.2, 2.5, 1.9],
          -0.2,
          0.55,
          0.03,
          [0, -1.4, 0],
          [0.2, 0.4, -0.2],
        );
        this.poseParticipant(
          3,
          [0.2, -1.8, 1.9],
          0.3,
          -0.5,
          -0.03,
          [0, 1.4, 0],
          [-0.2, -0.35, 0.2],
        );
        break;
      }
      case "selected-collision": {
        this.poseParticipant(
          0,
          [0, 0.12, 5.6],
          0.03,
          0,
          0,
          [0, 0, 0.3],
          [0, 0.1, 0],
        );
        this.poseParticipant(
          1,
          [0, 0.12, 7.4],
          Math.PI,
          0.02,
          0,
          [0, 0, -1.1],
          [0.3, 0.5, 0.1],
        );
        break;
      }
      case "independent-spin": {
        if (this.bodies.length <= 5) {
          const angularVelocities: Vec3Tuple[] = [
            [1.4, 2.1, 0.6],
            [-2.2, 1.2, 1.5],
            [0.8, -2.8, 2.2],
            [2.6, 0.9, -1.6],
            [-1.1, 3.4, 1.8],
          ];
          this.bodies.forEach((_, index) => {
            const angle = index * 2.399 + 0.4;
            const radius = 2.55 + (index % 2) * 0.35;
            const y = -2.2 + index * 1.1;
            this.poseParticipant(
              index,
              [
                Math.cos(angle) * radius,
                y,
                Math.sin(angle) * radius + 0.8,
              ],
              Math.PI / 2 - angle,
              0.16 * (index - 2) * 0.4,
              0.1 * (index - 2),
              [0, 0, 0],
              angularVelocities[index],
            );
          });
        } else {
          this.bodies.forEach((body, index) => {
            const angle = index * 2.399 + 0.4;
            body.velocity.set(0, 0, 0);
            body.angularVelocity.set(
              Math.cos(angle * 1.3) * 2,
              Math.sin(angle * 1.7 + 0.6) * 2.2,
              Math.cos(angle * 2.1 + 1.2) * 1.8,
            );
            body.rigidBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
            body.rigidBody.setAngvel(
              {
                x: body.angularVelocity.x,
                y: body.angularVelocity.y,
                z: body.angularVelocity.z,
              },
              true,
            );
          });
        }
        break;
      }
      default:
        return false;
    }

    this.resetCollisionMetrics();
    return true;
  }

  setGust(energy: number, direction: 1 | -1) {
    const wind = this.environment.wind;
    const clamped = clamp(energy, 0, wind.maxEnergy);
    this.scrollEnergy = clamped;
    this.windLevel = Math.max(this.windLevel, 1 + clamped * wind.boostPerEnergy);
    this.spinDirection = direction;
    this.turbulenceLevel = this.environment.turbulence.strength * this.windLevel;
  }

  getHealth(): VortexHealth {
    const env = this.environment;
    let finite = true;
    let maxSpeed = 0;
    let maxAngularSpeed = 0;
    let maxRadiusRatio = 0;
    let minSeparation = Infinity;
    let verticalOverrun = 0;

    for (const body of this.bodies) {
      const values = [
        body.position.x,
        body.position.y,
        body.position.z,
        body.velocity.x,
        body.velocity.y,
        body.velocity.z,
        body.angularVelocity.x,
        body.angularVelocity.y,
        body.angularVelocity.z,
        body.orientation.x,
        body.orientation.y,
        body.orientation.z,
        body.orientation.w,
      ];
      if (values.some((value) => !Number.isFinite(value))) finite = false;
      maxSpeed = Math.max(maxSpeed, body.velocity.length());
      maxAngularSpeed = Math.max(maxAngularSpeed, body.angularVelocity.length());
      const radial = Math.hypot(body.position.x, body.position.z);
      const cap = Math.max(vortexRadiusAt(env.volume, body.position.y), 0.001);
      maxRadiusRatio = Math.max(maxRadiusRatio, radial / cap);
      verticalOverrun = Math.max(
        verticalOverrun,
        env.volume.bottom - body.position.y,
        body.position.y - env.volume.top,
      );
    }

    for (let i = 0; i < this.bodies.length; i += 1) {
      for (let j = i + 1; j < this.bodies.length; j += 1) {
        const distance = this.bodies[i].position.distanceTo(
          this.bodies[j].position,
        );
        minSeparation = Math.min(minSeparation, distance);
      }
    }

    return {
      finite,
      maxSpeed,
      maxAngularSpeed,
      maxRadiusRatio,
      minSeparation: Number.isFinite(minSeparation) ? minSeparation : 0,
      verticalOverrun: Math.max(0, verticalOverrun),
    };
  }

  snapshot(): VortexSnapshot {
    const env = this.environment;
    return {
      time: this.time,
      population: env.population,
      fps: this.fps,
      stepMs: this.stepMs,
      peakStepMs: this.peakStepMs,
      stepsLastFrame: this.stepsLastFrame,
      fixedStep: env.physics.fixedStep,
      windLevel: this.windLevel,
      spinDirection: this.spinDirection,
      turbulenceLevel: this.turbulenceLevel,
      windEnergy: this.scrollEnergy,
      selected:
        this.selected !== null ? this.bodies[this.selected].project.name : null,
      bodies: this.bodies.map((body) => {
        const radial = Math.hypot(body.position.x, body.position.z);
        const cap = Math.max(vortexRadiusAt(env.volume, body.position.y), 0.001);
        return {
          id: body.project.index,
          slug: body.project.slug,
          category: body.project.category,
          name: body.project.name,
          selected: body.selected,
          position: [
            body.position.x,
            body.position.y,
            body.position.z,
          ],
          velocity: [body.velocity.x, body.velocity.y, body.velocity.z],
          angularVelocity: [
            body.angularVelocity.x,
            body.angularVelocity.y,
            body.angularVelocity.z,
          ],
          quaternion: [
            body.orientation.x,
            body.orientation.y,
            body.orientation.z,
            body.orientation.w,
          ],
          halfExtents: [
            body.halfExtents.x,
            body.halfExtents.y,
            body.halfExtents.z,
          ],
          speed: body.velocity.length(),
          angularSpeed: body.angularVelocity.length(),
          mass: body.mass,
          drag: body.profile.drag,
          angularDrag: body.profile.angularDrag,
          windResponse: body.profile.windResponse,
          localWind: [body.wind.x, body.wind.y, body.wind.z],
          localWindSpeed: body.wind.length(),
          radiusRatio: radial / cap,
        };
      }),
      health: this.getHealth(),
      collision: this.collisionSnapshot(),
      distribution: this.distributionSnapshot(),
    };
  }
}
