import { vec } from "../../common/src/vec";
import { Player, MobileProjectable, InputProcessor, State, rgba, Ctx, Input, get_input_obj, Mvmnt, process_inputs } from "../../common/src/game.core";


export class PlayerClient extends Player implements MobileProjectable, InputProcessor {
    /*

    //These are used in moving us around later
    thils.cur_state = this.game.cp_state(this.state);//dest_ghost state
    this.state_time = new Date().getTime();

    //Our local history of inputs
    this.inputs = [];

    //The world bounds we are confined to
    this.pos_limits = {
        x_min: this.hsize,
        x_max: this.game.world.width - this.hsize,
        y_min: this.hsize,
        y_max: this.game.world.height - this.hsize
    };
    */
    cur_state: State;
    video_enabled: boolean = true;
    color: string = rgba(255, 255, 255, 0.5);
    // audio
    panner: PannerNode = null;

    constructor(state: State, id: string, call_id: string) {
        super(state, id, call_id);
        this.cur_state = this.state.clone();
        this.inputs = [];
    }

    draw_icon(ctx: Ctx, support: boolean = false): void {
        // the ctx should be appropriately rotated and translated
        //Set the color for this player
        ctx.fillStyle = this.color;

        if (support) {
            ctx.beginPath();
            ctx.arc(0, 0, this.rad, 0, 2 * Math.PI);
            ctx.strokeStyle = "yellow";
            ctx.stroke();
        }
        ctx.beginPath();
        const rt2 = Math.sqrt(0.5);
        ctx.moveTo(0, 0);
        ctx.lineTo(rt2 * -this.rad, rt2 * this.rad);
        ctx.lineTo(this.rad, 0);
        ctx.lineTo(rt2 * -this.rad, rt2 * -this.rad);
        ctx.closePath();
        ctx.fill();
    }

    draw_projection(ctx: Ctx, rad: number, support: boolean = false): void {
        // the ctx should be appropriately rotated and translated
        ctx.beginPath();
        ctx.arc(0, 0, rad, 0 /*start_angle*/, 2 * Math.PI /*arc_angle*/);
        ctx.clip();
        if (this.video_enabled) {
            const vid = document.getElementById('vid' + this.call_id);
            if (vid) {
                const w = vid.offsetWidth;
                const h = vid.offsetHeight;
                if (w > h) { //landscape video input
                    const ratio = w / h;
                    const h_scaled = 2 * rad;
                    const w_scaled = ratio * h_scaled;
                    const diff = w_scaled - h_scaled;
                    ctx.drawImage(vid, -rad - diff / 2, -rad, w_scaled, h_scaled);
                } else { //portrait video input
                    const ratio = h / w;
                    const w_scaled = 2 * rad;
                    const h_scaled = ratio * w_scaled;
                    const diff = h_scaled - w_scaled;
                    ctx.drawImage(vid, -rad, -rad - diff / 2, w_scaled, h_scaled);
                }
            }
        } else {
            ctx.moveTo(-10, 10);
            ctx.lineTo(0, 0);
            ctx.lineTo(10, 10);
        }
        ctx.strokeStyle = this.color;
        ctx.stroke();
    }

    facing_vec() {
        return new vec(Math.cos(this.state.dir), Math.sin(this.state.dir));
    }

    add_audio_track(stream: MediaStream, audio_ctx: AudioContext) {
        const gain_node = audio_ctx.createGain();
        const stereo_panner = new StereoPannerNode(audio_ctx, { pan: 0 } /*stereo balance*/);
        const track = audio_ctx.createMediaStreamSource(stream);
        const panner_model = 'HRTF';
        //for now, we don't use cones for simulation of speaking direction. this may be added later on
        //cf. https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Web_audio_spatialization_basics
        const distance_model = 'linear'; // possible values are: 'linear', 'inverse' & 'exponential'
        const max_distance = 10000;
        const ref_distance = 1;
        const roll_off = 20;
        this.panner = new PannerNode(audio_ctx, {
            panningModel: panner_model,
            distanceModel: distance_model,
            refDistance: ref_distance,
            maxDistance: max_distance,
            rolloffFactor: roll_off
        });
        track.connect(gain_node).connect(stereo_panner).connect(this.panner).connect(audio_ctx.destination);
    }
    // TODO separate PlayerClient & PlayerClientSelf & remove below code in this class
    last_input_seq: number;
    last_input_time: number;
    inputs: Input[];
    state_time: number;

    get_input_obj() {
        return get_input_obj(this.state, this.last_input_seq);
    }

    process_inputs(): Mvmnt {
        return process_inputs(this, this.state.dir);
    }
}

export class PlayerClientSelf extends PlayerClient implements InputProcessor {
    last_input_seq: number;
    last_input_time: number;
    inputs: Input[];
    state_time: number;

    //FIXME how to construct PlayerClientSelf from PlayerClient?

    get_input_obj() {
        return get_input_obj(this.state, this.last_input_seq);
    }

    process_inputs() : Mvmnt {
        return process_inputs(this, this.state.dir);
    }
}