import type { WebGlEngine } from "@devrals/webgl-engine";
import type { Backdrop } from "../index.js";

export default class Sanctuary implements Backdrop<WebGlEngine> {
    constructor() { }

    async init() { }
    draw() { }
    destroy() { }
    update() { }
}
