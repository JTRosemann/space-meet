import { Game } from "./Game";
import { Item } from "./Item";
import { State } from "./State";
import { vec } from "./vec";

export class ItemController {
    private game: Game;
    private id: string;

    constructor(game: Game, id: string) {
        this.game = game;
        this.id = id;
        this.game.push_item({id: id, rad: 16, state: new State(new vec(50,50), 0)});
    }

    get_pos(): vec {
        return this.game.get_item_state(this.id).pos;
    }

    set_pos(pos: vec) {
        this.game.set_item_pos(this.id, pos);
    }

    set_dir(dir: number) {
        this.game.set_item_dir(this.id, dir);
    }

}
