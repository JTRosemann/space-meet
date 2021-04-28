import { Effector } from "../../common/src/Effector";
import { Snap } from "../../common/src/Snap";
import { State } from "../../common/src/State";


export class RecSnap<S extends State> implements Snap<S> {
    get_zones(): Effector<S>[] {
        throw new Error("Method not implemented.");
    }
    get_states(): Record<string, S> {
        throw new Error("Method not implemented.");
    }
    set_player(viewer_id: string, predict_me: S): void {
        throw new Error("Method not implemented.");
    }
    get_player_state(viewer_id: string): S {
        throw new Error("Method not implemented.");
    }

}
