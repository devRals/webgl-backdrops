import type { WebGlEngine } from "@devrals/webgl-engine";
import type { Backdrop } from "./index.js";
import { PIXELATED_INDIE_RESOLUTION } from "./resolutions.js";

export default class Sanctuary implements Backdrop<WebGlEngine> {
    static readonly resolution = PIXELATED_INDIE_RESOLUTION
    constructor() { }

    async init() { }
    draw() { }
    destroy() { }
    update() { }
}
