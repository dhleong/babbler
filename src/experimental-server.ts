// tslint:disable no-console
import path from "path";

import fastify from "fastify";
import fastifyStatic from "fastify-static";
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

const receiverServer = fastify();
receiverServer.register(fastifyStatic, {
    root: path.join(__dirname, "../receiver"),
});
receiverServer.listen(8080, (err, address) => {
    if (err) throw err;
    console.log("receiver listening on ", address);
});
