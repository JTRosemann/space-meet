import { Podium } from "./Podium";

/**
 * The data object for transmission of an effector.
 * It contains explicit information on which effector is to be realized after transmission.
 */
export interface EffectorData {
    kind : 'Podium';
    effector : unknown;
}

export class EffectorFactory {
    /**
     * Realize the effector correponding to the transmitted data.
     * @param data transmitted data of the effector
     * @returns an establish effector, i.e. an actual instance of the class
     */
    static realize(data : EffectorData) {
        switch (data.kind) {
            case 'Podium':
                return Podium.establish(data.effector as Podium);
        }
    }
}
