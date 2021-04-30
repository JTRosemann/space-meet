import { EuclideanCircle } from "./EuclideanCircle";
import { EuclideanVector } from "./EuclideanVector";
import { Physics } from "./Physics";
import { PhysicsData } from "./PhysicsFactory";
import { ParsedInput } from "./protocol";


export class EuclideanStepPhysics implements Physics<EuclideanCircle> {

    // speed:
    private mv_speed : number;
    private trn_speed : number;
    // boundaries:
    private width : number;
    private height : number;

    constructor(mv_speed : number, trn_speed : number, width : number, height : number) {
        this.mv_speed = mv_speed;
        this.trn_speed = trn_speed;
        this.width = width;
        this.height = height;
    }

    interpret_input(old_state: EuclideanCircle, inp: ParsedInput): EuclideanCircle {
        const old_dir = old_state.get_dir();
        const new_dir = old_dir + this.trn_speed * inp.duration * inp.left;
        const mid_dir = (old_dir + new_dir) / 2;//used if we move and turn at the same time
        const old_pos = old_state.get_pos();
        const mv_pos = EuclideanVector.create_polar(this.mv_speed, mid_dir);
        const new_pos = old_pos.add(mv_pos);
        const bounded_pos = this.fix_boundaries(new_pos);
        const old_rad = old_state.get_rad();
        return EuclideanCircle.create_from_pos_dir_rad(bounded_pos, old_rad, new_dir);
    }

    to_data() : PhysicsData {
        return {
            mv_speed : this.mv_speed,
            trn_speed : this.trn_speed,
            width : this.width,
            height : this.height
        };
    }

    private fix_boundaries(pos : EuclideanVector) {
        const x = Math.max(this.width , Math.min(0, pos.get_x()));
        const y = Math.max(this.height, Math.min(0, pos.get_y()));
        return EuclideanVector.create_cartesian(x, y);
    }

}
