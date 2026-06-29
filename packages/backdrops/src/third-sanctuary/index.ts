import { chooseRand, randRange, SOLID_COLORS, Vec2, Vec3 } from "@devrals/math";
import type { Backdrop } from "../index.js";
import { PIXELATED_INDIE_RESOLUTION } from "../resolutions.js";
import { prophecies, depth } from "./assets/index.js";

type ProphecyType = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

interface Prophecy {
    readonly basePos: Vec2,
    currentPos: Vec2,
    timer: number,
    waveSpeed: number,
    waveAmp: number,
    readonly type: ProphecyType
}

interface Particle {
    readonly pos: Vec2,
    color: Vec3,
}

export default class ThirdSanctuary implements Backdrop<CanvasRenderingContext2D> {
    static readonly resolution = PIXELATED_INDIE_RESOLUTION

    private oceanDepthPattern: CanvasPattern | null = null
    private prophecyTextures: ImageBitmap[] = []


    private scratchCanvas!: OffscreenCanvas
    private scratchCtx!: OffscreenCanvasRenderingContext2D

    layers: [Prophecy[], Prophecy[], Prophecy[]]

    layerOffsets: [Vec2, Vec2, Vec2] = [Vec2.zero(), Vec2.zero(), Vec2.zero()]
    layerSpeeds: [Vec2, Vec2, Vec2] = [
        new Vec2(10, 10),  // Layer 1 (Front)
        new Vec2(7, 7),   // Layer 2 (Middle)
        new Vec2(3, 3)     // Layer 3 (Back)
    ]

    layerScales: [number, number, number] = [0.5, 0.4, 0.2]
    layerDarkness: [number, number, number] = [0.0, 0.2, 0.4]

    private particles: Particle[]

    constructor() {
        const l1 = ThirdSanctuary.generateRowGrid(4, 5, 0)
        const l2 = ThirdSanctuary.generateRowGrid(3, 5, 40)
        const l3 = ThirdSanctuary.generateRowGrid(2, 6, -60)

        this.layers = [l1, l2, l3]

        this.scratchCanvas = new OffscreenCanvas(ThirdSanctuary.resolution.width, ThirdSanctuary.resolution.height)
        this.scratchCtx = this.scratchCanvas.getContext("2d")!

        const PARTICLE_COUNT = 50
        this.particles = new Array(PARTICLE_COUNT)
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            this.particles[i] = {
                pos: new Vec2(randRange(0, ThirdSanctuary.resolution.width), randRange(0, ThirdSanctuary.resolution.height)),
                color: chooseRand([
                    Vec3.one().map(v => v * 255),
                    SOLID_COLORS.blue.clone(),
                    SOLID_COLORS.light_cyan.clone()
                ])
            }
        }
    }

    /**
     * Generates an array of evenly spaced prophecies grouped by rows across the resolution.
     */
    private static generateRowGrid(rows: number, cols: number, rowShiftAmount: number): Prophecy[] {
        const result: Prophecy[] = [];
        const cellWidth = ThirdSanctuary.resolution.width / cols;
        const cellHeight = ThirdSanctuary.resolution.height / rows;

        for (let r = 0; r < rows; r++) {
            const rowXOffset = r * rowShiftAmount;

            for (let c = 0; c < cols; c++) {
                const gridX = (c * cellWidth) + (cellWidth / 2) + rowXOffset;
                const gridY = (r * cellHeight) + (cellHeight / 2);

                result.push({
                    type: chooseRand([0, 1, 2, 3, 4, 5, 6, 7, 8]),
                    timer: randRange(0, Math.PI * 2),
                    waveSpeed: randRange(1, 3),
                    waveAmp: randRange(3, 5),
                    basePos: new Vec2(gridX, gridY),
                    currentPos: new Vec2(gridX, gridY)
                });
            }
        }
        return result;
    }

    async init() {
        for (let i = 0; i < prophecies.length; i++) {
            const p = prophecies[i]
            const data = await fetch(p).then(r => r.blob())
            const bitmap = await createImageBitmap(data)
            this.prophecyTextures[i] = bitmap
        }

        const data = await fetch(depth).then(r => r.blob())
        const bitmap = await createImageBitmap(data)

        const offscreen = new OffscreenCanvas(bitmap.width, bitmap.height)
        const ctx = offscreen.getContext("2d")!
        this.oceanDepthPattern = ctx.createPattern(bitmap, "repeat")
    }

    update(dt: number) {
        for (let i = 0; i < this.layers.length; i++) {
            const l = this.layers[i]
            const speed = this.layerSpeeds[i]

            // Move background depth mask
            this.layerOffsets[i].x = (this.layerOffsets[i].x + speed.x * dt) % 512
            this.layerOffsets[i].y = (this.layerOffsets[i].y + speed.y * dt) % 512

            for (const p of l) {
                p.timer += dt

                p.currentPos.y = p.basePos.y + (p.waveAmp * Math.sin(p.timer * p.waveSpeed))

                p.currentPos.x = p.basePos.x
            }
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = "#000"
        ctx.fillRect(0, 0, ThirdSanctuary.resolution.width, ThirdSanctuary.resolution.height)

        if (!this.oceanDepthPattern) return

        for (const p of this.particles) {
            const { x: r, y: g, z: b } = p.color
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
            ctx.beginPath()
            ctx.arc(p.pos.x, p.pos.y, 0.3, 0, 2 * Math.PI)
            ctx.fill()
        }

        for (let i = this.layers.length - 1; i >= 0; i--) {
            const layer = this.layers[i]
            const offset = this.layerOffsets[i]
            const scale = this.layerScales[i]
            const darkness = this.layerDarkness[i] // Grab the layer darkness multiplier

            this.scratchCtx.globalCompositeOperation = "source-over"
            this.scratchCtx.clearRect(0, 0, this.scratchCanvas.width, this.scratchCanvas.height)

            // 1. Draw all scaled prophecies onto scratch pad
            for (const p of layer) {
                const tex = this.prophecyTextures[p.type]
                if (tex) {
                    const drawWidth = tex.width * scale
                    const drawHeight = tex.height * scale

                    const drawX = p.currentPos.x - (drawWidth / 2)
                    const drawY = p.currentPos.y - (drawHeight / 2)

                    this.scratchCtx.drawImage(tex, drawX, drawY, drawWidth, drawHeight)
                }
            }

            // 2. TINT LAYER DARKER (Only if darkness factor is greater than 0)
            if (darkness > 0) {
                // source-atop preserves existing alpha while letting us blend a new color over it
                this.scratchCtx.globalCompositeOperation = "source-atop"
                this.scratchCtx.fillStyle = `rgba(0, 0, 0, ${darkness})`
                this.scratchCtx.fillRect(0, 0, this.scratchCanvas.width, this.scratchCanvas.height)
            }

            // 3. Apply the scrolling pattern mask
            this.scratchCtx.globalCompositeOperation = "source-in"

            const matrix = new DOMMatrix().translate(offset.x, offset.y)
            this.oceanDepthPattern.setTransform(matrix)

            this.scratchCtx.fillStyle = this.oceanDepthPattern
            this.scratchCtx.fillRect(0, 0, this.scratchCanvas.width, this.scratchCanvas.height)

            ctx.drawImage(this.scratchCanvas, 0, 0)
        }
    }
}
