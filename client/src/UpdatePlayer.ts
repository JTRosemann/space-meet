import { Game } from "../../common/src/Game";
import { IdController } from "../../common/src/IdController";
import { Queue } from "../../common/src/Queue";
import { ServerPlayerData } from "./ServerPlayerData";

/**
 * This class controls an item and updates it according to the transmitted state from the server.
 */
export class UpdatePlayer implements IdController {
    id: string;
    game: Game;
    datastream: Queue<ServerPlayerData>;

    constructor(id: string, game: Game, datastream: Queue<ServerPlayerData>) {
        this.id = id;
        this.game = game;
        this.datastream = datastream;
    }

    update(delta_time: number, now_time: number): void {
        const data = this.datastream.latest();
        if (data != null) {
            this.game.set_item_state(this.id, data.state);
        }
    }

}
