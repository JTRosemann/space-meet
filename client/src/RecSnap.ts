import { Snap } from "./Snap";


export class RecSnap<S> implements Snap<S> {
    set_player(viewer_id: string, predict_me: S): void {
        throw new Error("Method not implemented.");
    }
    get_player_state(viewer_id: string): S {
        throw new Error("Method not implemented.");
    }

}
