import { Item, State } from "./game.core";
import { GameJoinData, PlayerState, ServerUpdateData } from "./protocol";
import { Transportable } from "./Transportable";
import { vec } from "./vec";
import { RectangleWorld, World } from "./World";

/**
    The game_core class
*/
export class Game {
    static establish(game: Game) {
        return new this(game.id, RectangleWorld.establish(game.world), game.items);
    }

    id: string;
    world: RectangleWorld = new RectangleWorld(720, 480);
    items: Item[] = [];

    constructor(id: string, world = new RectangleWorld(720, 480), items = []) {
        this.id = id;
        this.world = world;
        this.items = items;
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
    
    get_item_rad(id: string) {
        for (const it of this.items) {
            if (it.id == id) {
                return it.rad;
            }
        }        
    }

    get_item_facing(id: string) {
        return new vec(Math.cos(this.items[id].dir), Math.sin(this.items[id].dir));
    }

    set_item_state(id: string, state: State) {
        for (const it of this.items) {
            if (it.id == id) {
                it.state = state;
                this.world.confine(it);//the world has the last say
                return;
            }
        }
        console.warn('set_item_state: id ' + id + ' not found.');
    }
}
