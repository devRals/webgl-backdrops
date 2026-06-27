// Taken from Celeste's decompiled repository and rewritten by myself
// Celeste is not an open source project and I don't condone anyone to contribute
// to game they don't own!
// Remember that this is just a fan remake

import { approach, chooseRand, lerp, mul, randRange, Vec2, Vec3, type VertexPositionColorTexture } from "@devrals/math"
import type { WebGlEngine } from "@devrals/webgl-engine"
import type { Backdrop } from "../index.js"
import northerLightsTexturePath from "./northernlights.png"
import { PIXELATED_INDIE_RESOLUTION } from "../resolutions.js";

import vertSrc from "./vertex.vert?raw"
import fragSrc from "./fragment.frag?raw"

export default class NorthernLights implements Backdrop<WebGlEngine> {
    static readonly resolution = PIXELATED_INDIE_RESOLUTION

    strands: Strand[]
    particles: Particle[]
    timer: number = 0
    verts: VertexPositionColorTexture[] = []
    northernLightsAlpha = 1
    offsetY = 15

    static colors = [
        Vec3.fromHex("2de079").map(v => v / 255),
        Vec3.fromHex("62f4f6").map(v => v / 255),
        Vec3.fromHex("45bc2e").map(v => v / 255),
        Vec3.fromHex("3856f0").map(v => v / 255),
    ]

    constructor() {
        let strands = []
        for (let i = 0; i < 3; i++) {
            strands.push(new Strand())
        }

        let particles: Particle[] = []
        for (let i = 0; i < 50; i++) {
            const { width, height } = NorthernLights.resolution
            const particle: Particle = {
                pos: new Vec2(randRange(0, width), randRange(0, height)),
                speed: randRange(4, 14),
                color: chooseRand(NorthernLights.colors)
            }
            particles.push(particle)
        }

        this.strands = strands
        this.particles = particles
    }

    update(dt: number) {
        this.timer += dt * 0.3
        for (const strand of this.strands) {
            strand.percent += dt / strand.duration

            if (!strand.fadingOut && strand.percent >= 1) {
                strand.fadingOut = true
            }

            const target = strand.fadingOut ? 0 : 1
            strand.alpha = approach(strand.alpha, target, dt * 0.5)

            if (strand.fadingOut && strand.alpha < 0.01) {
                strand.reset(0)
            }

            for (const node of strand.nodes) {
                node.sineOffset += dt
            }
        }
        for (let i = 0; i < this.particles.length; i++) {
            if (this.particles[i].pos.y > NorthernLights.resolution.width) {
                this.particles[i].pos.y = -3
                this.particles[i].pos.x = randRange(0, NorthernLights.resolution.width)
            } else {
                this.particles[i].pos.y += this.particles[i].speed * dt
            }

        }
    }

    beforeRender() {
        let vertexCount = 0;
        for (const strand of this.strands) {
            let node = strand.nodes[0]

            for (let i = 0; i < strand.nodes.length; i++) {
                const node2 = strand.nodes[i]

                const num = Math.min(1.0, i / 4.0) * this.northernLightsAlpha
                const num2 = Math.min(1, (strand.nodes.length - 1) / 4) * this.northernLightsAlpha
                const num3 = this.offsetY + Math.sin(node.sineOffset) * 3.0
                const num4 = this.offsetY + Math.sin(node2.sineOffset) * 3.0
                this.verts[vertexCount] = { pos: new Vec2(node.pos.x, node.pos.y + num3), uv: new Vec2(node.texOffset, 1), color: mul(node.color, Vec3.initial(node.bottomAlpha * strand.alpha * num)), alpha: node.bottomAlpha * strand.alpha * num }; vertexCount++;
                this.verts[vertexCount] = { pos: new Vec2(node.pos.x, node.pos.y - node.height + num3), uv: new Vec2(node.texOffset, 0.05), color: mul(node.color, Vec3.initial(node.topAlpha * strand.alpha * num)), alpha: node.topAlpha * strand.alpha * num }; vertexCount++;
                this.verts[vertexCount] = { pos: new Vec2(node2.pos.x, node2.pos.y - node2.height + num4), uv: new Vec2(node2.texOffset, 0.05), color: mul(node2.color, Vec3.initial(node2.topAlpha * strand.alpha * num2)), alpha: node2.topAlpha * strand.alpha * num2 }; vertexCount++;
                this.verts[vertexCount] = { pos: new Vec2(node.pos.x, node.pos.y + num3), uv: new Vec2(node.texOffset, 1), color: mul(node.color, Vec3.initial(node.bottomAlpha * strand.alpha * num)), alpha: node.bottomAlpha * strand.alpha * num }; vertexCount++;
                this.verts[vertexCount] = { pos: new Vec2(node2.pos.x, node2.pos.y - node2.height + num4), uv: new Vec2(node2.texOffset, 0.05), color: mul(node2.color, Vec3.initial(node2.topAlpha * strand.alpha * num2)), alpha: node2.topAlpha * strand.alpha * num2 }; vertexCount++;
                this.verts[vertexCount] = { pos: new Vec2(node2.pos.x, node2.pos.y + num4), uv: new Vec2(node2.texOffset, 1), color: mul(node2.color, Vec3.initial(node2.bottomAlpha * strand.alpha * num2)), alpha: node2.topAlpha * strand.alpha * num2 }; vertexCount++;
                node = node2
            }
        }
    }

    buffers: {
        vao: WebGLVertexArrayObject,
        auroa: Record<string, WebGLBuffer>,
        particles: Record<string, WebGLBuffer>
    } = { auroa: {}, particles: {}, vao: 0 }
    textures: Record<string, WebGLTexture> = {}
    webglProgram: WebGLProgram = 0

    async init(engine: WebGlEngine) {
        const program = engine.createProgram(vertSrc, fragSrc)
        engine.gl.useProgram(program)

        this.buffers.auroa = {
            colors: engine.gl.createBuffer(),
            pos: engine.gl.createBuffer(),
            tex: engine.gl.createBuffer(),
            alpha: engine.gl.createBuffer()
        }

        this.buffers.particles = {
            colors: engine.gl.createBuffer(),
            pos: engine.gl.createBuffer()
        }

        this.textures.northerLightsTexture = await engine.createTexture(northerLightsTexturePath, {
            wrap: "repeat",
            filter: "linear"
        })


        this.webglProgram = program
    }

    draw(engine: WebGlEngine, dt: number) {
        const gl = engine.gl

        gl.enable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE)

        gl.useProgram(this.webglProgram)

        const u_resolution = gl.getUniformLocation(this.webglProgram, "u_resolution")
        const { width, height } = NorthernLights.resolution
        gl.uniform2f(u_resolution, width, height)

        this.update(dt)
        this.beforeRender()

        const pColorsData = []
        const pPosData = []
        for (const particle of this.particles) {
            pPosData.push(particle.pos.x, particle.pos.y)
            pColorsData.push(particle.color.x, particle.color.y, particle.color.z)
        }

        gl.uniform1i(gl.getUniformLocation(this.webglProgram, "u_drawParticle"), 1)

        engine.bindRuntime({ buffer: this.buffers.auroa.colors, program: this.webglProgram, data: new Float32Array(pColorsData), location: "a_color", size: 3 })
        engine.bindRuntime({ buffer: this.buffers.auroa.pos, program: this.webglProgram, data: new Float32Array(pPosData), location: "a_pos", size: 2 })

        gl.drawArrays(gl.POINTS, 0, this.particles.length)

        const colorData = []
        const posData = []
        const uvData = []
        const alphaData = []

        for (const vert of this.verts) {
            colorData.push(vert.color.x, vert.color.y, vert.color.z)
            posData.push(vert.pos.x, vert.pos.y)
            uvData.push(vert.uv.x, vert.uv.y)
            alphaData.push(vert.alpha)
        }

        engine.bindRuntime({ buffer: this.buffers.auroa.pos, program: this.webglProgram, data: new Float32Array(posData), location: "a_pos", size: 2 })
        engine.bindRuntime({ buffer: this.buffers.auroa.colors, program: this.webglProgram, data: new Float32Array(colorData), location: "a_color", size: 3 })
        engine.bindRuntime({ buffer: this.buffers.auroa.tex, program: this.webglProgram, data: new Float32Array(uvData), location: "a_uv", size: 2 })
        engine.bindRuntime({ buffer: this.buffers.auroa.alpha, program: this.webglProgram, data: new Float32Array(alphaData), location: "a_alpha", size: 1 })

        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, this.textures.northerLightsTexture)
        gl.uniform1i(gl.getUniformLocation(this.webglProgram, "u_tex"), 0)
        gl.uniform1i(gl.getUniformLocation(this.webglProgram, "u_drawParticle"), 0)

        gl.drawArrays(gl.TRIANGLES, 0, this.verts.length)

        gl.bindTexture(gl.TEXTURE_2D, null)
    }

    destroy(engine: WebGlEngine): void {
        const gl = engine.gl

        const clearBuffer = (buffers: Record<string, WebGLBuffer>) => {
            for (const [key, buffer] of Object.entries(buffers)) {
                gl.deleteBuffer(buffer)
                buffers[key] = 0
            }
        }

        gl.deleteProgram(this.webglProgram)
        for (const [key, texture] of Object.entries(this.textures)) {
            gl.deleteTexture(texture)
            this.textures[key] = 0
        }
        clearBuffer(this.buffers.auroa)
        clearBuffer(this.buffers.particles)
        gl.deleteVertexArray(this.buffers.vao)
    }
}

class Strand {
    percent: number = 0
    duration: number = 0
    alpha: number = 0
    nodes: Node[] = []
    fadingOut = false

    constructor() {
        this.reset(Math.random())
    }

    reset(startPercent: number) {
        this.percent = startPercent
        this.duration = randRange(12, 32)
        this.alpha = 0
        this.nodes = []
        this.fadingOut = false

        const vector = new Vec2(randRange(-40, 60), randRange(40, 90))
        let num = Math.random()
        const value = chooseRand(NorthernLights.colors)

        for (let i = 0; i < 40; i++) {
            const randColor = chooseRand(NorthernLights.colors)
            const item: Node = {
                pos: new Vec2(vector.x, vector.y),
                texOffset: num,
                height: randRange(10, 80),
                topAlpha: randRange(0.3, 0.8),
                bottomAlpha: randRange(0.5, 1),
                sineOffset: Math.random() * 6.2831855,
                color: new Vec3(
                    lerp(value.x, randColor.x, randRange(0, 0.3)),
                    lerp(value.y, randColor.y, randRange(0, 0.3)),
                    lerp(value.z, randColor.z, randRange(0, 0.3)),
                )
            }
            num += randRange(0.02, 0.2)
            vector.add(new Vec2(randRange(4, 10), randRange(-10, 15)))
            this.nodes.push(item)
        }
    }
}

type Particle = {
    pos: Vec2,
    speed: number,
    color: Vec3
}

type Node = {
    pos: Vec2,
    texOffset: number,
    height: number,
    topAlpha: number,
    bottomAlpha: number,
    sineOffset: number,
    color: Vec3
}
