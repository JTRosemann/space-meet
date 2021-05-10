import { EuclideanCircle } from '../../common/src/EuclideanCircle';
import { EuclideanCircleSnap } from '../../common/src/EuclideanCircleSnap';
import { EuclideanStepPhysics } from '../../common/src/EuclideanStepPhysics';
import { EuclideanVector } from '../../common/src/EuclideanVector';
import { Podium } from '../../common/src/Podium';
import { Trail, TrailFactory } from '../../common/src/Trail';
import { ServerSimulation } from './ServerSimulation';

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
            const state = EuclideanCircle.create_from_pos_dir_rad(pos, 1, 0);
            const trail = (new TrailFactory<EuclideanCircle>()).create_singleton_trail(state, 0);
            players['dogs'] = trail;
        }
        const g = new ServerSimulation(players, [p], phy, GameFactory.x_plus_2)
        return g;
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
