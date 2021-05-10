import { FrontEnd as Frontend } from "./Frontend";
import { MediaManager } from "./MediaManager";
import { Snap } from "../../common/src/Snap";
import { State } from "../../common/src/State";
import { EuclideanCircle } from "../../common/src/EuclideanCircle";
import { PosAudioCtrl } from "./PosAudioCtrl";
import { ClientEffects } from "./ClientEffects";

export class Auditorium<S extends State> implements Frontend<S> {
    
    private mediaManager: MediaManager;
    private viewer_id: string;
    private pa_ctrls: Record<string,PosAudioCtrl<S>> = {};
    private audio_ctx: AudioContext;
    private ref_dist: number = 0; //to be overwritten
    private listener: AudioListener;

    constructor(mediaManager: MediaManager, viewer_id: string) {
        this.mediaManager = mediaManager;
        this.viewer_id = viewer_id;
        this.audio_ctx = new AudioContext();
        this.listener = this.audio_ctx.listener;
    }

    render(snap: Snap<S>, client_cfg: ClientEffects): void {
        const self_state = snap.get_states()[this.viewer_id];
        if (this.ref_dist == 0) {
            //TODO fix casting
            // the first time render is called we set the ref_dist to be diameter of self
            // even if self diameter changes, the ref_distance does not
            this.ref_dist = (self_state as unknown as EuclideanCircle).get_rad() * 2;
        }
        this.set_listener_pos(self_state);
        const states = snap.get_states();
        for (let id of Object.keys(states)) {
            if (this.pa_ctrls[id] == undefined) {
                //create missing panners
                const audio_src = this.mediaManager.get_audio(id, this.audio_ctx);
                if (audio_src != undefined) {
                    const pa_ctrl = PosAudioCtrl.create_connect_positional_audio(this.audio_ctx, audio_src, this.ref_dist);                                        
                    this.pa_ctrls[id] = pa_ctrl;
                    const maximized = client_cfg.is_maximized(id);
                    this.update_player_audio(id, states[id], self_state, client_cfg, maximized);
                }
            } else {
                //update position of existing panners
                const maximized = client_cfg.is_maximized(id);
                this.update_player_audio(id, states[id], self_state, client_cfg, maximized);
            }
        }
    }

    private update_player_audio(id: string, state: State, listener_state: State,
            client_cfg: ClientEffects, maximized: boolean) {
        const pa_ctrl = this.pa_ctrls[id];
        if (client_cfg.is_maximized(id)) {
            pa_ctrl.set_max(listener_state);
        } else {
            //TODO fix this cast
            const state_ec = state as EuclideanCircle;
            pa_ctrl.set_pos(state_ec.get_pos().get_x(), state_ec.get_pos().get_y());
        }
    }

    private set_listener_pos(state: S) {
        //TODO fix this cast
        const ec = state as unknown as EuclideanCircle;
        const pos = ec.get_pos();
        const ext = ec.get_ext();
        this.listener.setPosition(pos.get_x(), 0, pos.get_y());//z is the new y
        this.listener.setOrientation(ext.get_x(), 0, ext.get_y(), 0, 1, 0);
    }

}
