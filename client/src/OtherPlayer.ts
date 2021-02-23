import { Game } from "../../common/src/Game";
import { Queue } from "../../common/src/Queue";
import { ServerPlayerData } from "./ServerPlayerData";
import { UpdatePlayer } from "./UpdatePlayer";


export class OtherPlayer extends UpdatePlayer {
    panner: PannerNode;
    listener_id: string;

    constructor(id: string, game: Game, 
            datastream: Queue<ServerPlayerData>, panner: PannerNode, listener_id: string) {
        super(id, game, datastream);
        this.panner = panner;
        this.listener_id = listener_id;
    }

    update(delta_time: number, now_time: number) {
        super.update(delta_time, now_time);
        const pos = this.game.get_item_state(this.id).pos;
        if (this.game.on_podium(pos)) {
            const l_rad = this.game.get_item_rad(this.listener_id);
            const l_st = this.game.get_item_state(this.listener_id);
            const l_pos = l_st.pos;
            // move the panner position a little in front of the listener such that
            // we can always here people on the podium clearly and from the front
            // cos & sin of direction construct a small vector in the direction of the listener
            this.panner.positionX.value = l_pos.x + Math.cos(l_st.dir);
            this.panner.positionZ.value = l_pos.y + Math.sin(l_st.dir);
        } else {
            this.panner.positionX.value = pos.x;
            this.panner.positionZ.value = pos.y;// z is the new y
        }
    }

}
