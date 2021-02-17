import { data } from "jquery";
import { Controller } from "../../common/src/Controller";
import { Game } from "../../common/src/Game";
import { IdController } from "../../common/src/IdController";
import { Queue } from "../../common/src/Queue";
import { ServerPlayerData } from "./ServerPlayerData";

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
        const data = this.datastream.peek();
        this.game.set_item_state(this.id, data.state);
    }

}
