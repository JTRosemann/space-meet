import { Game } from "../../common/src/Game";
import { Queue } from "../../common/src/Queue";
import { ServerPlayerData } from "./ServerPlayerData";
import { UpdatePlayer } from "./UpdatePlayer";


export class OtherPlayer extends UpdatePlayer {
    panner: PannerNode;

    constructor(id: string, game: Game, datastream: Queue<ServerPlayerData>, panner: PannerNode) {
        super(id, game, datastream);
        this.panner = panner;
    }

    update(delta_time: number, now_time: number) {
        super.update(delta_time, now_time);
        const pos = this.game.get_item_state(this.id).pos;
        this.panner.positionX.value = pos.x;
        this.panner.positionZ.value = pos.y;// z is the new y
    }
}
