import { Podium } from "./Podium";

export interface EffectorData {
    kind : 'Podium';
    effector : unknown;
}

export class EffectorFactory {
    static realize(data : EffectorData) {
        switch (data.kind) {
            case 'Podium':
                return Podium.establish(data.effector as Podium);
        }
    }
}
