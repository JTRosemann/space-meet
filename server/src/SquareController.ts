import { Controller } from "../../common/src/Controller";
import { IdController } from "../../common/src/IdController";
import { ItemController } from "../../common/src/ItemController";
import { vec } from "../../common/src/vec";


export class SquareController implements IdController {
    private bot_left: vec;
    private size: number;
    private it_ctrl: ItemController;
    private speed: number;
    id: string = 'square';

    constructor(bot_left: vec, size: number, it_ctrl: ItemController, speed: number = 120) {
        this.bot_left = bot_left;
        this.size = size;
        this.it_ctrl = it_ctrl;
        this.speed = speed;
        this.it_ctrl.set_pos(this.bot_left);
        this.it_ctrl.set_dir(0);
    }

    private left_bound() {
        return this.bot_left.x;
    }

    private right_bound() {
        return this.bot_left.x + this.size;
    }

    private bot_bound() {
        return this.bot_left.y;
    }

    private top_bound() {
        return this.bot_left.y + this.size;
    }

    private mid_x() {
        return (this.left_bound() + this.right_bound()) / 2;
    }

    private mid_y() {
        return (this.bot_bound() + this.top_bound()) / 2;
    }

    update(delta_time: number, now_time: number): void {
        const pos = this.it_ctrl.get_pos();
        const step = this.speed * delta_time / 1000;
        const below_lin_axis = pos.x - this.mid_x() > pos.y - this.mid_y();
        const below_inv_axis = - (pos.x - this.mid_x()) > pos.y - this.mid_y();
        let new_pos: vec;
        let new_dir: number;
        if (below_lin_axis) {
            if (below_inv_axis) {
                new_pos = pos.add(new vec(step, 0));
                new_dir = 0;
            } else {
                new_pos = pos.add(new vec(0, step));
                new_dir = Math.PI/2;
            }
        } else {
            if (below_inv_axis) {
                new_pos = pos.sub(new vec(0, step));
                new_dir = 3*Math.PI/2;
            } else {
                new_pos = pos.sub(new vec(step, 0));
                new_dir = Math.PI;
            }
        }
        this.it_ctrl.set_pos(new_pos);
        this.it_ctrl.set_dir(new_dir);
    }    
}