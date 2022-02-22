import { SpaceMeetGameConfig } from "./GameSchema";
import * as missdogo from '../samples/missdogo.game.json';
import * as lydogo from '../samples/lydogo.game.json';
import * as podium from '../samples/podium.game.json';
import { EuclideanVector } from "../../common/src/EuclideanVector";
import { EuclideanCircle } from "../../common/src/EuclideanCircle";
import { EuclideanStepPhysics } from "../../common/src/EuclideanStepPhysics";
import { GameFactory } from "./GameFactory";
import { Trail, TrailFactory } from "../../common/src/Trail";
import { Podium } from "../../common/src/Podium";
import { Effector } from "../../common/src/Effector";
import * as UUID from 'uuid';
import { ServerSimulation } from "./ServerSimulation";
import { Conference } from "../../common/src/Conference";
import { YtVideoMap } from "./YtVideoMap";
import { SampleConfig } from "../../common/src/Samples";

// TODO define a server config schema which also generates a scheme for the options client has
// then use https://jsonforms.io/ to generate forms for the client to configure the game,
// the type-checked result is send to server to initialize such a game
export class Factory {
    std_mv_speed = 1.4/1000; //m/ms (1.4m/s = 5km/h)
    std_trn_speed = 0.2/1000;// whole turns per ms
    std_rad = 0.5;// ~ in meters
    std_step = 0.25;
    // TODO fix that x_plus_2 is independent from custom std_rad
    x_plus_2 = (num : number) => 
        new EuclideanCircle(EuclideanVector.create_cartesian(1 + num * 2,1), EuclideanVector.create_polar(this.std_rad, 0));
    
    private config : SpaceMeetGameConfig;

    constructor(sc: SampleConfig) {
        switch (sc) { //TODO this switch should be outsourced & auto-generated from the available templates
            case SampleConfig.LYDOGO:
                this.config = lydogo;
                break;
            case SampleConfig.PODIUM:
                this.config = podium;
                break;
            case SampleConfig.MISSDOGO:
                this.config = missdogo;
                break;
        }
    }

    static match_default<A>(def: A, val?: A) : A {
        return val !== undefined ? val : def;
    }

    static match_random(val? : string) : string {
        return val !== undefined ? val : UUID.v4();
    }

    parse_game() {
        const phy = new EuclideanStepPhysics(
            Factory.match_default(this.std_mv_speed, this.config.std_mv_speed),
            Factory.match_default(this.std_trn_speed, this.config.std_trn_speed),
            this.config.width,
            this.config.height
        );
        const rad = Factory.match_default(this.std_rad, this.config.std_rad)
        const players : Record<string,Trail<EuclideanCircle>> = {};
        if (this.config.players !== undefined) {
            for (const p of this.config.players) {
                const pos = EuclideanVector.create_cartesian(p.pos_x, p.pos_y);
                const state = EuclideanCircle.create_from_pos_dir_rad(pos, rad, 0);
                const trail = (new TrailFactory<EuclideanCircle>()).create_singleton_trail(state, 0);
                const id = Factory.match_random(p.id);
                players[id] = trail;
            }
        }
        const effectors : Effector<EuclideanCircle>[] = [];
        if (this.config.podiums !== undefined) {
            for (const p of this.config.podiums) {
                const pos = EuclideanVector.create_cartesian(p.pos_x, p.pos_y);
                const pod = new Podium(pos, p.rad);
                effectors.push(pod);
            }
        }
        return new ServerSimulation(players, effectors, phy, this.x_plus_2);
    }

    parse_media(conf_id: string) {
        const conf = new Conference(conf_id);
        const res = new YtVideoMap(conf, {});
        if (this.config.players !== undefined) {
            for (const p of this.config.players) {
                if (p.id !== undefined && p["rsrc-url"]) {
                    res.set_vid(p.id, p["rsrc-url"]);
                }
            }
        }
        // TODO as of now the [rsrc] id in "players" of the config is ignored
        // it may be useful to have one ressource available for multiple players
        // but for now the rest of the pipeline assumes a one-to-one relationship
        if (this.config.rsrcs !== undefined) {
            for (const r of this.config.rsrcs) {
                res.set_vid(r.id, r.url);
            }
        }
        return res;
    }
}