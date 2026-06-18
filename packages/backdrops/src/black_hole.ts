import { chooseRand, randRange, SOLID_COLORS, Vec2, Vec3 } from "@devrals/math";
import type { Resolution } from "@devrals/webgl-engine"
import type { Backdrop } from "./index.js";

type PolarPosition = {
    r: number, theta: number
}

interface StaticParticle {
    position: PolarPosition
    size: number
    color: Vec3
}

interface Particle extends StaticParticle {
    speed: number
    trailLength: number
    trail: PolarPosition[]
}

export default class BlackHole implements Backdrop<CanvasRenderingContext2D> {
    static readonly resolution: Resolution = { width: 1100, height: 600 }

    physics = {
        position: Vec2.zero(),
        speedMultiplier: 1,
        pullStrength: 75,
        flicker: true
    }
    appearance = {
        discWidth: 40,
        baseRadius: 120,

        backgroundColor: Vec3.fromHex("05020a"),
        discGradiant: [
            new Vec3(255, 255, 255),
            new Vec3(255, 221, 102),
            new Vec3(255, 127, 0),
            new Vec3(255, 0, 0)

        ] as [Vec3, Vec3, Vec3, Vec3],
        particleColors: [
            SOLID_COLORS.white.clone(),
            SOLID_COLORS.cyan.clone(),
            SOLID_COLORS.light_cyan.clone(),
            SOLID_COLORS.teal.clone(),
            SOLID_COLORS.light_blue.clone(),
            SOLID_COLORS.lemon.clone(),
        ]
    }
    particles: Set<Particle>
    staticParticles: StaticParticle[]

    private radius = this.appearance.baseRadius
    private timer = 0

    private static toPolar(pos: Vec2): PolarPosition {
        return {
            r: Math.hypot(pos.x, pos.y),
            theta: Math.atan2(pos.y, pos.x)
        }
    }


    constructor(particleCount = 100, blackHolePosition: Vec2 | "center" = "center") {
        const staticParticleCount = Math.floor(particleCount * (1 / 4))
        const movingParticleCount = Math.floor(particleCount * (3 / 4))

        this.physics.position = typeof blackHolePosition === "string"
            ? new Vec2(BlackHole.resolution.width / 2, BlackHole.resolution.height / 2)
            : blackHolePosition

        const particles = new Array(movingParticleCount)
        for (let i = 0; i < movingParticleCount; i++) particles[i] = {
            position: this.createRandomPolarPosition(),
            speed: randRange(0.2, 3),
            size: randRange(1, 4),
            trail: [],
            trailLength: 0,
            color: chooseRand(this.appearance.particleColors)
        }

        this.particles = new Set(particles)

        this.staticParticles = new Array(staticParticleCount)
        for (let i = 0; i < staticParticleCount; i++) this.staticParticles[i] = {
            position: this.createRandomPolarPosition(),
            size: randRange(0.2, 3),
            color: chooseRand(this.appearance.particleColors)
        }
    }

    private createRandomPolarPosition(): PolarPosition {
        const randomPos = new Vec2(
            randRange(0, BlackHole.resolution.width),
            randRange(0, BlackHole.resolution.height),
        )

        const randomCartesian = new Vec2(
            randomPos.x - this.physics.position.x,
            randomPos.y - this.physics.position.y
        )
        return BlackHole.toPolar(randomCartesian)
    }

    private toCartesian(pos: PolarPosition) {
        return new Vec2(
            this.physics.position.x + (pos.r * Math.cos(pos.theta)),
            this.physics.position.y + (pos.r * Math.sin(pos.theta)),
        )
    }

    async init() { }

    update(dt: number) {
        this.timer += dt
        // random flicker
        if (this.physics.flicker)
            this.radius = this.appearance.baseRadius
                + Math.sin(this.timer * 4) * 4
                + Math.cos(this.timer * 11) * 2
                + (Math.random() - 0.5) * 1.5;


        for (const particle of this.particles) {// Inside update() loop for particles:
            const proximity = this.radius / Math.max(particle.position.r, this.radius * 0.8);
            const dynamicSpeed = particle.speed * (1 + proximity * 3);

            particle.position.theta += dynamicSpeed * this.physics.speedMultiplier * dt;
            particle.position.r -= dynamicSpeed * this.physics.pullStrength * dt;

            if (particle.position.r <= this.radius * 0.8) {
                this.particles.delete(particle);
                this.particles.add({
                    position: {
                        r: randRange(this.radius * 2, BlackHole.resolution.width),
                        theta: randRange(0, 2 * Math.PI)
                    },
                    speed: randRange(0.5, 4),
                    size: randRange(1, 3),
                    trail: [],
                    trailLength: 0,
                    color: chooseRand(this.appearance.particleColors)
                });
                continue;
            }

            particle.trailLength = Math.min(40, Math.max(10, particle.speed));

            particle.trail.unshift({
                r: particle.position.r, theta: particle.position.theta
            });

            if (particle.trail.length > particle.trailLength) {
                particle.trail.pop();
            }
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.globalCompositeOperation = "source-over";
        const { x: bgR, y: bgG, z: bgB } = this.appearance.backgroundColor
        ctx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        ctx.globalCompositeOperation = "screen";

        for (const particle of this.particles) {
            if (particle.position.r < this.radius) continue;

            const { x: pR, y: pG, z: pB } = particle.color
            ctx.strokeStyle = `rgba(${pR}, ${pG}, ${pB}, ${Math.min(1, particle.position.r / 100)})`;
            ctx.lineWidth = particle.size * 2;
            ctx.beginPath();

            for (let i = 0; i < particle.trail.length; i++) {
                const trail = particle.trail
                ctx.lineWidth = ((trail.length - 1 - i) / trail.length) * (particle.size * 2)

                const { x, y } = this.toCartesian(trail[i]);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
                ctx.stroke();
            }

            const pPos = this.toCartesian(particle.position);
            ctx.fillStyle = `rgb(${pR}, ${pG}, ${pB})`;
            ctx.beginPath();
            ctx.arc(pPos.x, pPos.y, particle.size, 0, 2 * Math.PI);
            ctx.fill();
        }

        for (const particle of this.staticParticles) {
            let renderRadius = particle.position.r;

            if (renderRadius < this.radius * 3) {
                const factor = (this.radius * 3) / Math.max(renderRadius, this.radius);
                renderRadius += (this.radius * 0.5) * (factor - 1);
            }

            if (renderRadius < this.radius) continue; // Blocked by event horizon

            const { x: pR, y: pG, z: pB } = particle.color;
            const pPos = this.toCartesian(particle.position)

            ctx.fillStyle = `rgb(${pR}, ${pG}, ${pB})`;
            ctx.beginPath();
            ctx.arc(pPos.x, pPos.y, particle.size, 0, 2 * Math.PI);
            ctx.fill();
        }

        const { x, y } = this.physics.position;
        const discGradiant = ctx.createRadialGradient(
            x, y, this.radius,
            x, y, this.radius + this.appearance.discWidth + (Math.sin(this.radius) * 5)
        );

        const [a, b, c, d] = this.appearance.discGradiant

        discGradiant.addColorStop(0.000, `rgb(${a.x}, ${a.y}, ${a.z})`);
        discGradiant.addColorStop(0.333, `rgb(${b.x}, ${b.y}, ${b.z})`);
        discGradiant.addColorStop(0.666, `rgb(${c.x}, ${c.y}, ${c.z})`);
        discGradiant.addColorStop(1.000, `rgb(${d.x}, ${d.y}, ${d.z}, 0)`);

        ctx.fillStyle = discGradiant;
        ctx.beginPath();
        ctx.arc(x, y, this.radius + this.appearance.discWidth + 10, 0, 2 * Math.PI);
        ctx.fill();

        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.arc(x, y, this.radius, 0, 2 * Math.PI);
        ctx.fill();
    }
}
