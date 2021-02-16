import { Item, State } from "./game.core";
import { GameJoinData, PlayerState, ServerUpdateData } from "./protocol";
import { Transportable } from "./Transportable";
import { RectangleWorld, World } from "./World";

/**
    The game_core class
*/
export class Game {
    id: string;
    world: RectangleWorld = new RectangleWorld(720, 480);
    items: Item[] = [];

    constructor(id: string) {
        this.id = id;
    }

    set_items(items: Item[]) : void {
        this.items = items;
    }
    
    get_items() : Item[] {
        return this.items;
    }

    get_item_state(id: string) : State {
        for (const it of this.items) {
            if (it.id == id) {
                return it.state;
            }
        }
    }

    set_item_state(id: string, state: State) {
        for (const it of this.items) {
            if (it.id == id) {
                it.state = state;
                this.world.confine(it);//the world has the last say
                break;
            }
        }
    }
}
