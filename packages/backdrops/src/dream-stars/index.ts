import { chooseRand, randRange, Vec2, Vec3, SOLID_COLORS } from "@devrals/math";
import type { Resolution } from "@devrals/webgl-engine";
import type { Backdrop } from "../index.js";

import { textureSets } from "./textures/index.js"

export interface Star {
    position: Vec2,
    timer: number,
    rate: number,
    textureSet: keyof typeof textureSets
}

const SET_PER_TEXTURE_COUNT = 4

export default class DreamStars implements Backdrop<CanvasRenderingContext2D> {
    private stars: Star[]
    private colors: Vec3[]
    dreaming = true
    private textures: Record<keyof typeof textureSets, ImageBitmap[][]> = {
        a: [], b: [], c: []
    }

    private falling = 0

    static resolution: Resolution = {
        width: 320,
        height: 180
    }

    constructor(count = 100, dreamingColor?: Vec3) {
        this.stars = new Array(count)
        const { width, height } = DreamStars.resolution

        for (let i = 0; i < this.stars.length; i++)
            this.stars[i] = {
                position: new Vec2(randRange(0, width), randRange(0, height)),
                rate: 2.0 + Math.random() * 2.0,
                timer: randRange(0, 6.2831855),
                textureSet: chooseRand(["a", "b", "c"])
            }

        this.colors = new Array(9)
        this.colors[0] = new Vec3(255, 255, 255)

        const color = dreamingColor ?? SOLID_COLORS.cyan.clone()
        for (let i = 1; i < this.colors.length; i++) {

            this.colors[i] = color.clone().mul(0.7 * (1.0 - (i / this.colors.length)))
        }
    }

    update(dt: number) {
        for (let i = 0; i < this.stars.length; i++) {
            const stars = this.stars
            stars[i].timer = stars[i].timer + (dt * stars[i].rate)
        }

        if (this.dreaming) this.falling += dt * 12
    }

    async init() {
        for (const [key, texturePaths] of Object.entries(textureSets)) {
            const textureName = key as keyof typeof textureSets


            for (let i = 0; i < texturePaths.length; i++) {
                const texPath = texturePaths[i]
                const data = await fetch(texPath).then(res => res.blob())
                const bitmap = await createImageBitmap(data)

                this.textures[textureName][i] = [bitmap]

                for (let j = 1; j < this.colors.length; j++) {
                    const color = this.colors[j]

                    const canvas = new OffscreenCanvas(
                        bitmap.width,
                        bitmap.height
                    )

                    const ctx = canvas.getContext("2d")!

                    ctx.drawImage(bitmap, 0, 0)

                    ctx.globalCompositeOperation = "source-atop"
                    ctx.fillStyle = `rgb(${color.x},${color.y},${color.z})`
                    ctx.fillRect(0, 0, canvas.width, canvas.height)

                    this.textures[textureName][i][j] =
                        await createImageBitmap(canvas)
                }
            }
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = "#000000"
        ctx.fillRect(0, 0, DreamStars.resolution.width, DreamStars.resolution.height)

        let num = this.stars.length
        const color = Vec3.fromHex("ffffff")

        if (this.dreaming) color.mul(0.7)
        else num /= 2

        for (let i = 0; i < num; i++) {
            const textureSet = this.stars[i].textureSet
            const star = this.stars[i]
            let num2 = Math.floor((Math.sin(star.timer) + 1.0) / 2.0 * SET_PER_TEXTURE_COUNT)
            num2 %= SET_PER_TEXTURE_COUNT

            const position = new Vec2(
                star.position.x,
                star.position.y
            )
            const tintedTextures = this.textures[textureSet][num2]

            if (this.dreaming) {
                position.y += this.falling * star.rate
                position.y %= 180.0

                if (position.y < 0) position.y += 180.0

                for (let j = 0; j < this.colors.length; j++) {
                    const pos = new Vec2(position.x, position.y - j)
                    ctx.drawImage(tintedTextures[j], pos.x, pos.y)
                }
            }
            ctx.drawImage(tintedTextures[0], position.x, position.y)
        }
    }
}
