import { chooseRand, randRange, Vec2, Vec3 } from "@devrals/math";
import type { Backdrop } from "../index.js";
import type { Resolution } from "@devrals/webgl-engine";
import { crewmateTexturePaths } from "./assets/index.js"
import { HIGH_QUALITY_RESOLUTION } from "../resolutions.js";

type Colors = "red" | "blue" | "green" | "pink" | "orange" | "yellow" | "black" | "white" | "purple" | "brown" | "cyan"// | "lime" | "maroon" | "rose" | "banana" | "gray" | "tan" | "coral"
type TextureIndex = 0 | 1 | 2 | 3 | 4 | 5
type CrewTexturesType = Record<Colors, Record<TextureIndex, ImageBitmap>>
type SpawnPosition = "top" | "bottom" | "left" | "right" | "top-right" | "top-left" | "bottom-right" | "bottom-left" | "center" | "random"

interface Star {
    position: Vec2
    speed: number
    size: number
}

interface Crewmate {
    position: Vec2,
    direction: Vec2,
    rotation: number,
    rotationSpeed: number,
    speed: number,
    color: keyof typeof FloatingInSpace.crewmateColors,
    textureIndex: TextureIndex
}

export default class FloatingInSpace implements Backdrop<CanvasRenderingContext2D> {
    static readonly resolution = HIGH_QUALITY_RESOLUTION

    private static readonly center: Vec2 = new Vec2(
        FloatingInSpace.resolution.width / 2,
        FloatingInSpace.resolution.height / 2
    )

    direction: Vec2
    crewmates: Set<Crewmate>
    crewmateSizeFactor: number = 0.3
    crewmateCount: number

    private stars: Star[]
    private crewTextures: CrewTexturesType
    private spawnTimer = 0


    static readonly crewmateColors = {
        red: new Vec3(215, 30, 34),
        blue: new Vec3(29, 60, 233),
        green: new Vec3(27, 145, 62),
        pink: new Vec3(255, 99, 212),
        orange: new Vec3(255, 141, 28),
        yellow: new Vec3(255, 255, 103),
        black: new Vec3(74, 86, 94),
        white: new Vec3(233, 247, 255),
        purple: new Vec3(120, 61, 210),
        brown: new Vec3(128, 88, 45),
        cyan: new Vec3(68, 255, 247),
    } as const

    static getSpawnPosition(textureRes: Resolution, spawnPosition: SpawnPosition) {
        const positions: SpawnPosition[] = ["top", "bottom", "left", "right", "top-right", "top-left", "bottom-right", "bottom-left"]
        let pos = spawnPosition === "random" ? chooseRand(positions) : spawnPosition

        const { width, height } = FloatingInSpace.resolution

        const center = FloatingInSpace.center

        switch (pos) {
            case "top": return new Vec2(center.x, -textureRes.height)
            case "bottom": return new Vec2(center.x, height + textureRes.height)
            case "left": return new Vec2(-textureRes.width, center.y)
            case "right": return new Vec2(width + textureRes.width, center.y)

            case "top-right": return new Vec2(width + textureRes.width, -textureRes.height)
            case "top-left": return new Vec2(-textureRes.width, -textureRes.height)
            case "bottom-right": return new Vec2(width + textureRes.width, height + textureRes.height)
            case "bottom-left": return new Vec2(-textureRes.width, height + textureRes.height)

            case "center": return center.clone()

            case "random": return center.clone() // Unreachable
        }
    }

    constructor(count = 100, crewmateCount = 10, direction = new Vec2(-1, 0)) {
        this.direction = direction.normalize()
        this.crewmateCount = crewmateCount

        this.spawnTimer

        this.stars = new Array(count)
        for (let i = 0; i < count; i++) {
            this.stars[i] = {
                position: new Vec2(
                    randRange(0, FloatingInSpace.resolution.width),
                    randRange(0, FloatingInSpace.resolution.height)
                ),
                size: randRange(0.5, 3),
                speed: randRange(3, 14)
            }
        }

        this.crewTextures = {} as CrewTexturesType
        for (const k in FloatingInSpace.crewmateColors) {
            const colorName = k as Colors
            this.crewTextures[colorName] = {} as Record<TextureIndex, ImageBitmap>
        }

        this.crewmates = new Set()
        for (let i = 0; i < this.crewmateCount; i++) {
            this.crewmates.add({
                position: new Vec2(
                    randRange(0, FloatingInSpace.resolution.width),
                    randRange(0, FloatingInSpace.resolution.height)
                ),
                direction: new Vec2(
                    randRange(-20, 20),
                    randRange(-20, 20)
                ),
                rotation: 0,
                speed: randRange(1, 5),
                rotationSpeed: randRange(-10, 10),
                color: chooseRand(Object.keys(FloatingInSpace.crewmateColors) as Colors[]),
                textureIndex: Math.floor(Math.random() * 6) as TextureIndex
            })
        }
    }

    spawnCrewmate(spawnPosition: SpawnPosition | Vec2) {
        const crew: Crewmate = {
            direction: Vec2.zero(),
            position: Vec2.zero(),

            rotation: 0,
            speed: randRange(3, 10),
            rotationSpeed: randRange(-7, 7),
            color: chooseRand(Object.keys(FloatingInSpace.crewmateColors) as Colors[]),
            textureIndex: Math.floor(Math.random() * 6) as TextureIndex
        }

        const texture = this.crewTextures[crew.color][crew.textureIndex]
        const textureRes = {
            width: texture.width * this.crewmateSizeFactor,
            height: texture.height * this.crewmateSizeFactor
        }

        const center = FloatingInSpace.center

        const spawnPositionVec = typeof spawnPosition === "string"
            ? FloatingInSpace.getSpawnPosition(textureRes, spawnPosition)
            : spawnPosition
        crew.position = spawnPositionVec.clone()

        const deviationrate = 0.8
        const directionToCenter = center.clone().sub(spawnPositionVec).normalize()
        directionToCenter.add(new Vec2(
            randRange(-deviationrate, deviationrate),
            randRange(-deviationrate, deviationrate)
        )).normalize()

        const randomDirection = new Vec2(randRange(-1, 1), randRange(-1, 1)).normalize()
        crew.direction = typeof spawnPosition === "string" && spawnPosition === "center"
            ? randomDirection
            : directionToCenter

        this.crewmates.add(crew)
    }

    async init() {
        for (const key in crewmateTexturePaths) {
            const textureIndex = parseInt(key) as TextureIndex
            const texPath = crewmateTexturePaths[parseInt(key) as TextureIndex]
            const blob = await fetch(texPath).then(res => res.blob())
            const bitmap = await createImageBitmap(blob)

            const offscreenCanvas = new OffscreenCanvas(bitmap.width, bitmap.height)
            const offscreenCtx = offscreenCanvas.getContext("2d")!

            offscreenCtx.drawImage(bitmap, 0, 0)

            const image = offscreenCtx.getImageData(0, 0, bitmap.width, bitmap.height)

            for (const [name, color] of Object.entries(FloatingInSpace.crewmateColors)) {
                const newImageData = new Uint8ClampedArray(image.data.length)

                for (let i = 0; i < image.data.length; i += 4) {
                    const finalColor = color.clone()
                    const pixel = {
                        r: image.data[i + 0],
                        g: image.data[i + 1],
                        b: image.data[i + 2],
                        a: image.data[i + 3],

                        position: i / 4
                    }

                    if (pixel.a === 0) continue

                    // Body color
                    const isRedDominant = pixel.r > pixel.b && pixel.r > pixel.g
                    if (isRedDominant) {
                        const rIntensity = pixel.r / 255
                        finalColor.mul(rIntensity)

                        newImageData[i + 0] = finalColor.x // red
                        newImageData[i + 1] = finalColor.y // green
                        newImageData[i + 2] = finalColor.z // blue
                        newImageData[i + 3] = pixel.a // alpha
                        continue
                    }

                    // Body shadow color
                    const isBlueDominant = pixel.b > pixel.r && pixel.b > pixel.g
                    if (isBlueDominant) {
                        const bIntensity = pixel.b / 255
                        const shadowAmount = 0.6
                        finalColor.mul(bIntensity * shadowAmount)

                        newImageData[i + 0] = finalColor.x // red
                        newImageData[i + 1] = finalColor.y // green
                        newImageData[i + 2] = finalColor.z // blue
                        newImageData[i + 3] = pixel.a // alpha
                        continue
                    }

                    // "Visor Part" Color
                    const isGreenDominant = pixel.g > pixel.r && pixel.g > pixel.b
                    if (isGreenDominant) {
                        const gIntensity = pixel.g / 255
                        const whiteColor = Vec3.initial(127).mul(gIntensity)

                        newImageData[i + 0] = whiteColor.x // red
                        newImageData[i + 1] = whiteColor.y // green
                        newImageData[i + 2] = whiteColor.z // blue
                        newImageData[i + 3] = pixel.a // alpha
                        continue
                    }

                    // Default fallback
                    newImageData[i + 0] = pixel.r // red
                    newImageData[i + 1] = pixel.g // green
                    newImageData[i + 2] = pixel.b // blue
                    newImageData[i + 3] = pixel.a // alpha
                }

                const colorName = name as Colors
                const imageData = new ImageData(newImageData, bitmap.width, bitmap.height)
                this.crewTextures[colorName][textureIndex] = await createImageBitmap(imageData)
            }

        }
    }

    update(dt: number) {
        for (const star of this.stars) {
            star.position.x += this.direction.x * star.speed * dt
            star.position.y += this.direction.y * star.speed * dt

            const width = FloatingInSpace.resolution.width
            const height = FloatingInSpace.resolution.height

            if (star.position.x > width) star.position.x -= width
            if (star.position.x < 0) star.position.x += width

            if (star.position.y > height) star.position.y -= height
            if (star.position.y < 0) star.position.y += height
        }

        if (this.spawnTimer >= 0) this.spawnTimer -= dt

        if (this.spawnTimer <= 0 && this.crewmates.size < this.crewmateCount) {
            this.spawnCrewmate("random")
            this.spawnTimer = randRange(1, 4)
        }

        for (const crew of this.crewmates) {
            const crewTexture = this.crewTextures[crew.color][crew.textureIndex]
            const crewSize = {
                width: crewTexture.width * this.crewmateSizeFactor,
                height: crewTexture.height * this.crewmateSizeFactor
            }

            const isOutOfBounds = crewSize.width - crew.position.x > FloatingInSpace.resolution.width ||
                crew.position.y - crewSize.height > FloatingInSpace.resolution.height ||
                crew.position.x + crewSize.width < 0 ||
                crew.position.y + crewSize.height < 0


            if (isOutOfBounds) {
                this.crewmates.delete(crew);
                continue
            }


            crew.position.x += crew.direction.x * crew.speed * dt
            crew.position.y += crew.direction.y * crew.speed * dt
            crew.rotation += (crew.rotationSpeed / 10) * dt
        }

    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = "#000"
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

        for (const star of this.stars) {
            ctx.fillStyle = "#fff"
            ctx.beginPath()
            ctx.arc(star.position.x, star.position.y, star.size, 0, 2 * Math.PI)
            ctx.fill()
        }

        for (const crew of this.crewmates) {
            ctx.save()

            ctx.translate(crew.position.x, crew.position.y)
            ctx.rotate(crew.rotation)


            const texture = this.crewTextures[crew.color][crew.textureIndex]
            ctx.drawImage(
                texture,
                -texture.width * this.crewmateSizeFactor / 2,
                -texture.height * this.crewmateSizeFactor / 2,
                texture.width * this.crewmateSizeFactor,
                texture.height * this.crewmateSizeFactor
            )

            ctx.restore()
        }
    }

    destroy(): void {
        this.crewTextures = {} as CrewTexturesType
        this.stars = []
        this.crewmates = new Set()
    }
}
