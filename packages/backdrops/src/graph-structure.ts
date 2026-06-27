import { SOLID_COLORS, Vec2, Vec3 } from "@devrals/math";
import type { Backdrop } from "./index.js";
import { HIGH_QUALITY_RESOLUTION } from "./resolutions.js";

interface Node {
    position: Vec2
    direction: Vec2
    timer: number
}

export default class GraphStructure implements Backdrop<CanvasRenderingContext2D> {
    static readonly resolution = HIGH_QUALITY_RESOLUTION

    private nodes: Node[]

    nodeSpeed = 25
    nodeChangeDirectionTimeout = 10
    backgroundColor = new Vec3(12, 12, 12)
    nodeSize = 4
    nodesColor = SOLID_COLORS.white.clone()
    connectionDistance = 75

    static randomPoint() {
        return new Vec2(
            Math.random() * GraphStructure.resolution.width,
            Math.random() * GraphStructure.resolution.height
        )
    }

    static randomDirection(res = 100) {
        return new Vec2((Math.random() - 0.5) * res, (Math.random() - 0.5) * res).normalize()
    }

    constructor(count = 100) {
        this.nodes = new Array(count)
        for (let i = 0; i < count; i++) this.nodes[i] = {
            position: GraphStructure.randomPoint(),
            direction: GraphStructure.randomDirection(),
            timer: Math.random() * 10,
        }
    }

    async init() { }

    update(dt: number) {
        for (const node of this.nodes) {
            node.timer += dt
            node.position.x += this.nodeSpeed * dt * node.direction.x
            node.position.y += this.nodeSpeed * dt * node.direction.y

            if (node.timer > this.nodeChangeDirectionTimeout) {
                node.direction = GraphStructure.randomDirection()
                node.timer = Math.random() * 10
            }

            const { width, height } = GraphStructure.resolution
            const size = this.nodeSize / 2
            if (node.position.x + size > width) {
                node.position.x = width - size
                node.direction.x *= -1
            }
            if (node.position.x - size < 0) {
                node.position.x = size
                node.direction.x *= -1
            }
            if (node.position.y + size > height) {
                node.position.y = height - size
                node.direction.y *= -1
            }
            if (node.position.y - size < 0) {
                node.position.y = size
                node.direction.y *= -1
            }
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.globalCompositeOperation = "source-over"
        ctx.clearRect(0, 0, GraphStructure.resolution.width, GraphStructure.resolution.height)
        const { x: bgR, y: bgG, z: bgB } = this.backgroundColor
        ctx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`
        ctx.fillRect(0, 0, GraphStructure.resolution.width, GraphStructure.resolution.height)


        const { x: nR, y: nG, z: nB } = this.nodesColor
        ctx.globalCompositeOperation = "screen"

        for (let i = 0; i < this.nodes.length; i++) {
            const node = this.nodes[i];
            for (let j = i + 1; j < this.nodes.length; j++) {
                const node2 = this.nodes[j];

                // TODO: This is expensive (using `distance` method which includes either hypot or sqrt functions)
                const distance = node.position.distance(node2.position)
                if (distance <= this.connectionDistance) {
                    ctx.beginPath()
                    const alpha = 1 - distance / this.connectionDistance
                    ctx.strokeStyle = `rgba(${nR}, ${nG}, ${nB}, ${alpha})`
                    ctx.moveTo(node.position.x, node.position.y)
                    ctx.lineTo(node2.position.x, node2.position.y)
                    ctx.stroke()
                }
            }
            ctx.beginPath()
            ctx.fillStyle = `rgb(${nR}, ${nG}, ${nB})`
            ctx.arc(node.position.x, node.position.y, this.nodeSize / 2, 0, 2 * Math.PI)
            ctx.fill()
        }
    }
}
