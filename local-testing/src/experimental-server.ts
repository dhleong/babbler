// tslint:disable no-console
import path from "path";

import Bundler from "parcel-bundler";
import WebSocket, { Server as WSServer } from "ws";

import _debug from "debug";
const debug = _debug("babbler:exp");

import { AmazonLicenseService } from "./amazon";
import { Engine, IClient } from "./engine";

class SocketClient implements IClient {
    private nextRequestId = 1;

    constructor(private ws: WebSocket) {}

    public send(message: any) {
        const clone = Object.assign({}, message);
        if (clone.data) {
            if (clone.data.requestId === undefined) {
                clone.data.requestId = this.nextRequestId++;
            }
            clone.data = JSON.stringify(clone.data);
        }

        // hacks?
        if (!clone.senderId) {
            clone.senderId = "7f8b100d-a1fe-e60b-5a35-6feaa22976df.2:152792770056491611";
        }
        debug(">>", clone);

        this.ws.send(JSON.stringify(clone));
    }
}

const wss = new WSServer({ port: 8008 });
wss.on("listening", () => {
    debug("websocket listening on", wss.address());
});
wss.on("connection", ws => {
    const {
        cookie,
        licenseUrl,
    } = require("../test.json");
    const service = new AmazonLicenseService(cookie, licenseUrl);

    const { timeline } = require("../scenario.json");

    debug("New client!", ws.url);
    const engine = new Engine(service);
    const client = new SocketClient(ws);
    let hasSentScenario = false;

    ws.on("message", message => {
        const json = JSON.parse(message.toString());
        if (json.data) {
            json.data = JSON.parse(json.data);
        }
        debug("<< ", json);

        if (json.data.type === "startheartbeat") {
            // send the scenario
            if (!hasSentScenario) {
                hasSentScenario = true;

                (timeline as any[]).forEach(ev => {
                    client.send(ev);
                });
            }
            return;
        }

        engine.process(client, json);
    });
});

const bundler = new Bundler(
    path.join(__dirname, "../../index.html"),
    {
        outDir: path.join(__dirname, "../../dist"),
    },
);

process.on("SIGTERM", () => {
    wss.close(() => {
        process.exit(0);
    });
});

bundler.serve(8080);
