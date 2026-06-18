export class Vec2 {
    x: number
    y: number

    constructor(x: number, y: number) {
        this.x = x
        this.y = y
    }

    static initial(v: number) {
        return new Vec2(v, v)
    }

    static zero() {
        return new Vec2(0, 0)
    }

    static one() {
        return new Vec2(1, 1)
    }

    add(other: Vec2 | number) {
        typeof other === "number" ? this.x += other : this.x += other.x
        typeof other === "number" ? this.y += other : this.y += other.y

        return this
    }
    sub(other: Vec2 | number) {
        typeof other === "number" ? this.x -= other : this.x -= other.x
        typeof other === "number" ? this.y -= other : this.y -= other.y

        return this
    }
    mul(other: Vec2 | number) {
        typeof other === "number" ? this.x *= other : this.x *= other.x
        typeof other === "number" ? this.y *= other : this.y *= other.y

        return this
    }
    div(other: Vec2 | number) {
        typeof other === "number" ? this.x /= other : this.x /= other.x
        typeof other === "number" ? this.y /= other : this.y /= other.y

        return this
    }

    /**
     * @returns Dot product of `this` and `other`
     */
    dot(other: Vec2) {
        return this.x * other.x +
            this.y * other.y
    }

    /**
     * @returns the cross product of `this` and `other`
     */
    cross(other: Vec2) {
        return this.x * other.y -
            this.y * other.x
    }

    /**
     * `cb` applied to the `x` and `y`
     */
    map(cb: (v: number) => number) {
        this.x = cb(this.x)
        this.y = cb(this.y)

        return this
    }

    /**
     * @returns \[`x`, `y`, 0\]
     */
    toArr(): [number, number, number] {
        return [
            this.x,
            this.y,
            0
        ]
    }

    /**
     * @returns magnitude of the vector
     */
    length() {
        return Math.hypot(this.x, this.y)
    }

    /**
     * Consider using this over `length` if you want faster calculations
     * @returns squared magnitude of the vector
     */
    lengthSquared() {
        return this.x * this.x + this.y * this.y
    }

    /**
     * Normalizes the vector
     * @example
     *  const vec = new Vec2(5, 0)
     *  vec.normalize()
     *  console.assert(vec, new Vec2(1, 0))
     */
    normalize() {
        const magnitude = this.length()
        if (magnitude !== 0) this.div(magnitude)
        return this
    }

    distance(target: Vec2) {
        const dx = target.x - this.x
        const dy = target.y - this.y

        return Math.hypot(dx, dy)
    }

    /**
     * @returns A deep copy of this vector
     */
    clone() {
        return new Vec2(this.x, this.y)
    }
}

export class Vec3 {
    x: number
    y: number
    z: number

    constructor(x: number, y: number, z: number) {
        this.x = x
        this.y = y
        this.z = z
    }

    static initial(v: number) {
        return new Vec3(v, v, v)
    }

    static zero() {
        return Vec3.initial(0)
    }

    static one() {
        return Vec3.initial(1)
    }

    /**
     * 
     * @param value HEX string without the char '#'
     * @example
     *
     * const white = Vec3.fromHex("ffffff");
     * const black = Vec3.fromHex("000000");
     * const blue = Vec3.fromHex("0000ff");
     *
     * console.assert(white, new Vec3(255, 255, 255))
     * console.assert(black, new Vec3(0, 0, 0))
     * console.assert(blue, new Vec3(0, 0, 255))
     */
    static fromHex(value: string): Vec3 {
        return new Vec3(
            parseInt(value.slice(0, 2), 16),
            parseInt(value.slice(2, 4), 16),
            parseInt(value.slice(4, 6), 16)
        )
    }

    add(other: Vec3 | number) {
        typeof other === "number" ? this.x += other : this.x += other.x
        typeof other === "number" ? this.y += other : this.y += other.y
        typeof other === "number" ? this.z += other : this.z += other.z

        return this
    }
    sub(other: Vec3 | number) {
        typeof other === "number" ? this.x -= other : this.x -= other.x
        typeof other === "number" ? this.y -= other : this.y -= other.y
        typeof other === "number" ? this.z -= other : this.z -= other.z

        return this
    }
    mul(other: Vec3 | number) {
        this.x *= typeof other === "number" ? other : other.x
        this.y *= typeof other === "number" ? other : other.y
        this.z *= typeof other === "number" ? other : other.z

        return this
    }
    div(other: Vec3 | number) {
        typeof other === "number" ? this.x /= other : this.x /= other.x
        typeof other === "number" ? this.y /= other : this.y /= other.y
        typeof other === "number" ? this.z /= other : this.z /= other.z

        return this
    }

    /**
     * @returns Dot product of this vector
     */
    dot(other: Vec3) {
        return this.x * other.x +
            this.y * other.y +
            this.z * other.z
    }

    /**
     * `Vec3.cross` doesn't update for the current value.
     * Instead returns the calculated value
     */
    cross(other: Vec3) {
        return new Vec3(
            this.y * other.z - this.z * other.y,
            this.z * other.x - this.x * other.z,
            this.x * other.y - this.y * other.x
        )
    }

    /**
     * `cb` applied to the `x`, `y` and `z`
     */
    map(cb: (v: number) => number) {
        this.x = cb(this.x)
        this.y = cb(this.y)
        this.z = cb(this.z)

        return this
    }

    /**
     * @returns \[`x`, `y`, `z`\]
     */
    toArr(): [number, number, number] {
        return [
            this.x,
            this.y,
            this.z
        ]
    }

    /**
     * @returns magnitude of the vector
     */
    length() {
        return Math.hypot(this.x, this.y, this.z)
    }

    /**
     * Consider using this over `length` if you want faster calculations
     * @returns squared magnitude of the vector
     */
    lengthSquared() {
        return this.x * this.x +
            this.y * this.y +
            this.z * this.z
    }

    /**
     * Normalizes the vector
     * @example
     *  const vec = new Vec3(5, 0, 0)
     *  vec.normalize()
     *  console.assert(vec, new Vec3(1, 0, 0))
     */
    normalize() {
        const magnitude = this.length()
        if (magnitude !== 0) this.div(magnitude)
        return this
    }

    distance(target: Vec3) {
        const dx = target.x - this.x
        const dy = target.y - this.y
        const dz = target.z - this.z

        return Math.hypot(dx, dy, dz)
    }

    /**
     * @returns A deep copy of this vector
     */
    clone() {
        return new Vec3(this.x, this.y, this.z)
    }
}

/** Don't forget to use `clone` method of these */
export const SOLID_COLORS = {
    red: new Vec3(255, 0, 0),
    green: new Vec3(0, 255, 0),
    blue: new Vec3(0, 0, 255),

    cyan: new Vec3(0, 255, 255),
    purple: new Vec3(255, 0, 255),
    yellow: new Vec3(255, 255, 0),

    light_cyan: new Vec3(127, 255, 255),
    pink: new Vec3(255, 127, 255),
    lemon: new Vec3(255, 255, 127),

    light_red: new Vec3(255, 127, 127),
    lime: new Vec3(127, 255, 127),
    light_blue: new Vec3(127, 127, 255),

    orange: new Vec3(255, 127, 0),
    rose: new Vec3(255, 0, 127),

    leaf: new Vec3(127, 255, 0),
    teal: new Vec3(0, 255, 127),

    violet: new Vec3(127, 0, 255),
    sky: new Vec3(0, 127, 255),

    black: new Vec3(0, 0, 0),
    gray: new Vec3(127, 127, 127),
    white: new Vec3(255, 255, 255),
}
