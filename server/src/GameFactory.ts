import { EuclideanCircle } from '../../common/src/EuclideanCircle';
import { EuclideanCircleSnap } from '../../common/src/EuclideanCircleSnap';
import { EuclideanStepPhysics } from '../../common/src/EuclideanStepPhysics';
import { EuclideanVector } from '../../common/src/EuclideanVector';
import { Podium } from '../../common/src/Podium';
import { Trail, TrailFactory } from '../../common/src/Trail';
import { ServerSimulation } from './ServerSimulation';

// TODO: fix implicit dependencies between GameFactory & MediaFactory
/**
 * This Factory is used to provide some standard game configurations. 
 */
export class GameFactory {
    static std_mv_speed = 1.4/1000; //m/ms (1.4m/s = 5km/h)
    static std_trn_speed = 0.2/1000;// whole turns per ms
    static std_rad = 0.5;// ~ in meters
    static std_step = 0.25;
    static x_plus_2 = (num : number) => 
        new EuclideanCircle(EuclideanVector.create_cartesian(1 + num * 2,1), EuclideanVector.create_polar(GameFactory.std_rad, 0));

    static create_podium_game(): ServerSimulation<EuclideanCircle> {
        const p = new Podium(EuclideanVector.create_cartesian(5, 5), 2);
        const phy = new EuclideanStepPhysics(
            GameFactory.std_mv_speed, GameFactory.std_trn_speed, 15, 10
        );
        const players : Record<string,Trail<EuclideanCircle>> = {};
        if (true) {
            const pos = EuclideanVector.create_cartesian(3, 3);
            const state = EuclideanCircle.create_from_pos_dir_rad(pos, 0.5, 0);
            const trail = (new TrailFactory<EuclideanCircle>()).create_singleton_trail(state, 0);
            players['goats'] = trail;
            /*const fpos = EuclideanVector.create_cartesian(5, 5);
            const fstate = EuclideanCircle.create_from_pos_dir_rad(fpos, 0.5, 0);
            const ftrail = (new TrailFactory<EuclideanCircle>()).create_singleton_trail(fstate, 0);
            players['fire'] = ftrail;*/
        }
        const g = new ServerSimulation(players, [p], phy, GameFactory.x_plus_2)
        return g;
    }

    static create_lynxen_dogs_goats(): ServerSimulation<EuclideanCircle> {
        const p = new Podium(EuclideanVector.create_cartesian(5,5), 2);
        const wid = 15;
        const hei = 10;
        const phy = new EuclideanStepPhysics(
            GameFactory.std_mv_speed, GameFactory.std_trn_speed, wid, hei
        );
        const posL = EuclideanVector.create_cartesian(wid - 3, 3);
        const posD = EuclideanVector.create_cartesian(wid - 3, hei - 3);
        const posG = EuclideanVector.create_cartesian(3, hei - 3);
        const to_trail = (p: EuclideanVector) =>
         (new TrailFactory<EuclideanCircle>()).create_singleton_trail(
             EuclideanCircle.create_from_pos_dir_rad(p, 0.5, 0), 0);
        const players : Record<string,Trail<EuclideanCircle>> 
         = {'lynxen': to_trail(posL),
             'dogs' : to_trail(posD),
             'goats': to_trail(posG)
            };
        return new ServerSimulation(players, [p], phy, GameFactory.x_plus_2);
    }

    static create_frontend_test(): ServerSimulation<EuclideanCircle> {
        const players : Record<string,Trail<EuclideanCircle>> = {};
        const rad = 8;
        const center_x = 2 * rad;
        const center_y = 2 * rad;
        const width = 2 * center_x;
        const height = 2 * center_y;
        const p = new Podium(EuclideanVector.create_cartesian(center_x, center_y), 2);
        const phy = new EuclideanStepPhysics(
            GameFactory.std_mv_speed, GameFactory.std_trn_speed, width, height
        );
        const num_player = 13;
        const seg = 2 * Math.PI / num_player; //angle between tables
        for (let i=0; i<num_player; i++) {
            const x = Math.cos(i * seg) * rad + center_x;
            const y = Math.sin(i * seg) * rad + center_y;
            const pos = EuclideanVector.create_cartesian(x,y);
            const state = EuclideanCircle.create_from_pos_dir_rad(pos, GameFactory.std_rad, 0);
            const id = 'num' + i;
            const trail = (new TrailFactory<EuclideanCircle>()).create_singleton_trail(state, 0);
            players[id] = trail;
        }
        return new ServerSimulation(players, [p], phy, GameFactory.x_plus_2);
    }

    static create_tables_game(n: number): EuclideanCircleSnap {
        /*const table_rad = 2;
        const rad = 8;
        const center_x = 2 * rad;
        const center_y = 2 * rad;
        const width = 2 * center_x;
        const height = 2 * center_y;
        const p = { state: new State(new vec(center_x, center_y), 0), rad: 2, id: 'podium' };
        let tables: Item[] = [];
        let podiums: Item[] = [p];
        const seg = 2 * Math.PI / n; //angle between tables
        for (let i = 0; i < n; i++) {
            const x = Math.cos(i * seg) * rad + center_x;
            const y = Math.sin(i * seg) * rad + center_y;
            const state = new State(new vec(x, y), 0);
            const id_tab = 'table' + i;
            const id_pod = 'podium' + i;
            tables.push({ state: state, rad: table_rad, id: id_tab });
            podiums.push({ state: state, rad: table_rad / 3, id: id_pod });
        }
        const g = new Game(UUID.v4(), GameFactory.std_rad, GameFactory.std_mv_speed, GameFactory.std_trn_speed, GameFactory.std_step, new RectangleWorld(width, height), [], podiums, tables);
        return g;
        */
        throw new Error("Method not implemented.");
    }
}
