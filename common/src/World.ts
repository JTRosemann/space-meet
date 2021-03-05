import { fixed } from "./util";
import { State } from "./State";
import { Item } from "./Item";
import { vec } from "./vec";

/**
 * In the long-term positional executions should happen here:
 * This would allow for parallel realizations of euclidean & non-euclidean Worlds
 */

export interface World {
    confine(item: Item): State;
}

export class RectangleWorld implements World {
    static establish(world: RectangleWorld): RectangleWorld {
        return new this(world.width, world.height);
    }
    width: number;
    height: number;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
    }

    confine(item: Item) : State {
        console.assert(2*item.rad <= this.width, 'Item too wide for this world!');
        console.assert(2*item.rad <= this.height, 'Item too tall for this world!');
        const pos_limit_x_min = item.rad;
        const pos_limit_y_min = item.rad;
        const pos_limit_x_max = this.width - item.rad;
        const pos_limit_y_max = this.height - item.rad;

        const conf_x_min = Math.max(item.state.pos.x, pos_limit_x_min);
        const conf_x_max = Math.min(conf_x_min, pos_limit_x_max);
        const conf_x = fixed(conf_x_max);

        const conf_y_min = Math.max(item.state.pos.y, pos_limit_y_min);
        const conf_y_max = Math.min(conf_y_min, pos_limit_y_max);
        const conf_y = fixed(conf_y_max);
        return new State (new vec(conf_x, conf_y), item.state.dir);
    }
}