import { vec } from "./vec";


export class State {
    public static clone(raw: { x: number; y: number; d: number; }): { x: number; y: number; d: number; } {
        return { x: raw.x, y: raw.y, d: raw.d };
    }
    public static establish(state: { x: number; y: number; d: number; }): State {
        return new this(new vec(state.x, state.y), state.d);
    }
    pos: vec;
    dir: number;

    constructor(pos: vec, dir: number) {
        this.pos = pos;
        this.dir = dir;
    }

    downsize(): { x: number; y: number; d: number; } {
        return { x: this.pos.x, y: this.pos.y, d: this.dir };
    }

    clone() {
        return new State(this.pos.clone(), this.dir);
    }
}
