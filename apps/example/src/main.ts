import "./style.css"

import BlackHole from "@devrals/backdrops/black_hole"

const appContainer = document.getElementById("app")!;
const blackHoleEffect = new BlackHole()
let canvas: HTMLCanvasElement
let ctx: CanvasRenderingContext2D;

async function initContent() {
    const _canvas = document.createElement("canvas")
    _canvas.id = "background"
    _canvas.width = BlackHole.resolution.width
    _canvas.height = BlackHole.resolution.height
    _canvas.style.imageRendering = "pixelated"
    _canvas.style.width = "100vw"
    _canvas.style.height = "100vh"

    canvas = _canvas

    window.addEventListener("keydown", k => {
        if (k.key === "i") console.info(blackHoleEffect)
    })

    appContainer.append(canvas)
}

async function initEngine() {
    ctx = canvas.getContext("2d")!
    await blackHoleEffect.init()
}

async function init() {
    await initContent()
    await initEngine()

    console.info("initialization completed")
}


let lastFrameTime = performance.now()
let animationId: number;
function render() {
    const now = performance.now()
    const dt = (now - lastFrameTime) / 1000
    lastFrameTime = now

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    blackHoleEffect.update(dt)
    blackHoleEffect.draw(ctx)

    animationId = requestAnimationFrame(render)
}

function fatal(error: unknown) {
    cancelAnimationFrame(animationId)
    console.error(error)

    document.body.innerHTML = `
        <div class="fatal-error">
            <h1 style="color: #ef9999;">Fatal Error</h1>
            <pre>${error instanceof Error
            ? `${error.message}\n<h2>Trace</h2>${error.stack}`
            : String(error)}
            </pre>
            <pre>Please report this to developers</pre>
        </div>
    `

    throw error
}

try {
    await init()
    render()
} catch (error) {
    fatal(error)
}
