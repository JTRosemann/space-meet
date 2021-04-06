import { State } from "./State";

export class Snap {
    set_player(viewer_id: string, predict_me: State) : void {
        throw new Error("Method not implemented.");
    }
    get_player_state(viewer_id: string) : State {
        throw new Error("Method not implemented.");
    }
}
