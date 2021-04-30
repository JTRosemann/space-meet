import { Effector } from "./Effector";
import { Physics } from "./Physics";
import { State } from "./State";

export interface Snap<S extends State> {
    get_physics(): Physics<S>;
    get_effectors(): Effector<S>[];
    get_states() : Record<string,S>;
    set_player(viewer_id: string, predict_me: S) : void;
    get_player_state(viewer_id: string) : S;
}


