import type { Backdrop } from "../index.js";
import { PIXELATED_INDIE_RESOLUTION } from "../resolutions.js";
import { Vec2, Vec3 } from "@devrals/math";

import bg3 from "./assets/shapesthree.png"
import bg4 from "./assets/shapesfour.png"

export default class DustForce implements Backdrop<CanvasRenderingContext2D> {
    static readonly resolution = PIXELATED_INDIE_RESOLUTION

    private readonly layers: [Layer, Layer] = [
        new Layer(),
        new Layer()
    ]
    private gradiantLength = 0

    timer = 0
    backgroundColor = new Vec3(15, 0, 15)
    moveTimeoutPoint = 3
    gradiantLengthBase = 30
    vignetGradiant: [Vec3, Vec3, Vec3] = [
        new Vec3(120, 10, 90),
        new Vec3(60, 5, 45),
        new Vec3(20, 5, 15),
    ]

    constructor() { }

    async init() {
        const texturePaths = [bg4, bg3]

        for (let i = 0; i < texturePaths.length; i++) {
            const path = texturePaths[i]
            const data = await fetch(path).then(r => r.blob())
            const bitmap = await createImageBitmap(data)

            const offscreen = new OffscreenCanvas(bitmap.width, bitmap.height)
            const ctx = offscreen.getContext("2d")!

            this.layers[i].texture = ctx.createPattern(bitmap, "repeat")
        }
    }

    update(dt: number) {
        this.timer += dt
        this.gradiantLength = this.gradiantLengthBase + Math.sin(this.timer) * 10;

        for (const l of this.layers) {
            l.timers.x += dt
            l.timers.y += dt

            if (l.timers.x > this.moveTimeoutPoint) {
                l.timers.x = 0
                l.position.x += 2
            }
            if (l.timers.y > this.moveTimeoutPoint) {
                l.timers.y = 0
                l.position.y -= 2
            }
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.globalCompositeOperation = "source-over"
        ctx.clearRect(0, 0, DustForce.resolution.width, DustForce.resolution.height)
        const { x: bgR, y: bgG, z: bgB } = this.backgroundColor
        ctx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`
        ctx.fillRect(0, 0, DustForce.resolution.width, DustForce.resolution.height)

        ctx.globalCompositeOperation = "screen"

        for (const l of this.layers) {
            if (!l.texture) throw new Error("Cannot found a texture to draw. You may need to initialize the backdrop using `await this.init()")
            l.draw(ctx)
        }

        ctx.globalCompositeOperation = "source-over";

        const topGradient = ctx.createLinearGradient(
            0, 0,
            0, this.gradiantLength
        )

        const [a, b, c] = this.vignetGradiant

        topGradient.addColorStop(0.00, `rgba(${a.x}, ${a.y}, ${a.z}, 0.5)`)
        topGradient.addColorStop(0.25, `rgba(${b.x}, ${b.y}, ${b.z}, 0.33)`)
        topGradient.addColorStop(0.50, `rgba(${c.x}, ${c.y}, ${c.z}, 0.15)`)
        topGradient.addColorStop(1.00, "transparent")

        ctx.fillStyle = topGradient
        ctx.fillRect(0, 0, ctx.canvas.width, this.gradiantLength)
        const bottomGradient = ctx.createLinearGradient(
            0, ctx.canvas.height - this.gradiantLength,
            0, ctx.canvas.height
        );

        bottomGradient.addColorStop(1.00, `rgba(${a.x}, ${a.y}, ${a.z}, 0.5)`)
        bottomGradient.addColorStop(0.75, `rgba(${b.x}, ${b.y}, ${b.z}, 0.33)`)
        bottomGradient.addColorStop(0.50, `rgba(${c.x}, ${c.y}, ${c.z}, 0.15)`)
        bottomGradient.addColorStop(0.00, "transparent")

        ctx.fillStyle = bottomGradient;
        ctx.fillRect(
            0,
            ctx.canvas.height - this.gradiantLength,
            ctx.canvas.width,
            this.gradiantLength
        );
    }
}

class Layer {
    texture: CanvasPattern | null = null

    timers = {
        x: Math.random() * 5,
        y: Math.random() * 7
    }

    matrix = new DOMMatrix();
    position: Vec2 = new Vec2(
        Math.random() * DustForce.resolution.width,
        Math.random() * DustForce.resolution.height)


    constructor() { }

    draw(ctx: CanvasRenderingContext2D) {
        this.matrix.e = this.position.x;
        this.matrix.f = this.position.y;

        this.texture!.setTransform(this.matrix);

        ctx.fillStyle = this.texture!;
        ctx.fillRect(0, 0, DustForce.resolution.width, DustForce.resolution.height);
    }
}
