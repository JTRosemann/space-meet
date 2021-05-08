import * as dat from 'dat.gui';
import { CarrierClient } from '../../common/src/protocol';
import { ClientInstance } from './ClientInstance';
import { Timer } from './Timer';
import { ViewSelector } from './ViewSelector';

export class Debugger {

    private debugui: dat.GUI;
    private client_debug: dat.GUI;
    private monitor: dat.GUI;

    constructor() {
        this.debugui = new dat.GUI();
        this.client_debug = this.debugui.addFolder('client');
        this.client_debug.open();
        this.client_debug.add(Timer, 'offset_others');
        this.client_debug.add(Timer, 'offset_self');
        this.client_debug.add(ClientInstance, 'ping_interval');
        this.client_debug.add(CarrierClient, 'fake_lag');
        this.client_debug.add(Timer, 'timer_cache_size');
        this.client_debug.add(Timer, 'timer_max_diff');
        this.client_debug.add(ViewSelector, 'client_prediction');
        this.monitor = this.debugui.addFolder('monitor');
        this.monitor.open();
    }

    add_monitor(obj: Object, str: string) {
        this.monitor.add(obj, str).listen();
    }

}
