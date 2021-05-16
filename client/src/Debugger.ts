import * as dat from 'dat.gui';
import { CarrierClient, ServerCfg, ServerCfgEmitter } from '../../common/src/protocol';
import { ClientInstance } from './ClientInstance';
import { Timer } from './Timer';
import { ViewSelector } from './ViewSelector';

export class Debugger {

    private debugui: dat.GUI;
    private client_debug: dat.GUI;
    private monitor: dat.GUI;
    private server_debug: dat.GUI;
    private carrier: ServerCfgEmitter;
    private server_cfg: ServerCfg;

    constructor(carrier: ServerCfgEmitter) {
        this.debugui = new dat.GUI();
        // client
        this.client_debug = this.debugui.addFolder('client');
        this.client_debug.open();
        this.client_debug.add(Timer, 'offset_others');
        this.client_debug.add(Timer, 'offset_self');
        this.client_debug.add(ClientInstance, 'input_interval');
        this.client_debug.add(ClientInstance, 'ping_interval');
        this.client_debug.add(CarrierClient, 'fake_lag');
        this.client_debug.add(Timer, 'timer_cache_size');
        this.client_debug.add(Timer, 'timer_max_diff');
        this.client_debug.add(ViewSelector, 'client_prediction');
        // monitor
        this.monitor = this.debugui.addFolder('monitor');
        this.monitor.open();
        // server
        this.carrier = carrier;
        this.server_debug = this.debugui.addFolder('server');
        this.server_cfg = { update_loop: 45 }; //TODO purge code duplication (put somewhere in common)
        for (let k of Object.keys(this.server_cfg)) {
            // we don't send the server_cfg back from the server (on purpose, only one debugging client supported),
            // so the info may be outdated, if several clients debug
            this.server_debug.add(this.server_cfg, k).onChange(
                v => this.carrier.emit_server_cfg(this.server_cfg)
            );
        }
    }

    add_monitor(obj: Object, str: string) {
        this.monitor.add(obj, str).listen();
    }

}
