import { Snap } from "./Snap";
import { EuclideanCircle as EuclideanCircle } from "./EuclideanCircle";

export class EuclidianCircleSnap implements Snap<EuclideanCircle> {
    set_player(viewer_id: string, predict_me: EuclideanCircle): void {
        throw new Error("Method not implemented.");
    }
    get_player_state(viewer_id: string): EuclideanCircle {
        throw new Error("Method not implemented.");
    }
}
