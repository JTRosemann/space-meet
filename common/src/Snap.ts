import { State } from "./State";

export interface Snap<S extends State> {
    get_zones(): import("./Effector").Effector<S>[];
    get_states() : Record<string,S>;
    set_player(viewer_id: string, predict_me: S) : void;
    get_player_state(viewer_id: string) : S;
}


