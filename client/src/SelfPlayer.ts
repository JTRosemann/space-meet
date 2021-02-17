import { Game } from "../../common/src/Game";
import { IdController } from "../../common/src/IdController";
import { Queue } from "../../common/src/Queue";
import { UpdatePlayer } from "./UpdatePlayer";
import { ServerPlayerData } from "./ServerPlayerData";

export class SelfPlayer extends UpdatePlayer {
    id: string;
    listener: any;

    constructor(id: string, game: Game, data_stream: Queue<ServerPlayerData>, listener: AudioListener) {
        super(id, game, data_stream);
        this.listener = listener;
    }

    update(delta_time: number, now_time: number): void {
        super.update(delta_time, now_time);

        const listener_pos = this.game.get_item_state(this.id).pos;
        this.listener.setPosition(listener_pos.x, 0, listener_pos.y);

        const listener_facing = this.game.get_item_facing(this.id);
        this.listener.setOrientation(listener_facing.x, 0, listener_facing.y, 0, 1, 0);
    }
}
