import { FrontEnd as Frontend } from "./Frontend";
import { MediaManager } from "./MediaManager";
import { Snap } from "../../common/src/Snap";
import { State } from "../../common/src/State";
import { EuclideanCircle } from "../../common/src/EuclideanCircle";
import { PosAudioCtrl } from "./PosAudioCtrl";

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
        console.warn("Auditorium doesn't support effectors");
    }

    render(snap: Snap<S>): void {
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
                const stream = this.mediaManager.get_audio(id);
                if (stream != undefined) {
                    const pa_ctrl = PosAudioCtrl.create_connect_positional_audio(this.audio_ctx, stream, this.ref_dist);
                    pa_ctrl.set_pos(states[id]);
                    this.pa_ctrls[id] = pa_ctrl;
                }
            } else {
                //update position of existing panners
                const pa_ctrl = this.pa_ctrls[id];
                pa_ctrl.set_pos(states[id]);
            }
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
