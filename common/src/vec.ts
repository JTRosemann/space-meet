import { lerp } from "./game.core";


export class vec {
    static from_polar(r: number, phi: number) {
        return new vec(r*Math.cos(phi), r*Math.sin(phi));
    }

    x: number;
    y: number;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    add_mut(other: vec) {
        this.x += other.x;
        this.y += other.y;
    }

    add(other: vec) {
        return new vec(this.x + other.x, this.y + other.y);
    }

    sub(other: vec) {
        return new vec(this.x - other.x, this.y - other.y);
    }

    abs() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    };

    angle() {
        return Math.atan2(this.y, this.x);
    };

    polar(): { r: number; phi: number; } {
        return { r: this.abs(), phi: this.angle() };
    };

    clone() {
        return new vec(this.x, this.y);
    };

    //Simple linear interpolation between 2 vectors
    v_lerp(tv: vec, t: number) {
        return new vec(lerp(this.x, tv.x, t),
            lerp(this.y, tv.y, t));
    };
}
