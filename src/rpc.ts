import _debug from "debug";
const debug = _debug("babbler:rpc");

import { RequestType } from "./messages";

const NS = "urn:x-cast:com.github.dhleong.babbler";

type RequestResolver<T> = (result: T) => void;

export interface IRpcResponseData<T> {
    response: T;
    responseTo: number;
}
export interface IRpcResponse<T> extends cast.framework.events.Event {
    data: IRpcResponseData<T>;
}

function isRpcResponse<T>(ev: cast.framework.events.Event): ev is IRpcResponse<T> {
    const data = (ev as any).data;
    return data && data.responseTo;
}

export class RpcManager {
    public static create(
        context: cast.framework.CastReceiverContext =
            cast.framework.CastReceiverContext.getInstance(),
    ) {
        const instance = new RpcManager(context);
        context.addCustomMessageListener(NS, msg => instance.onMessage(msg));

        debug("created RpcManager");
        return instance;
    }

    private nextRequestId = 1;
    private pendingRequests: {[key: number]: RequestResolver<any>} = {};

    private constructor(
        private context: cast.framework.CastReceiverContext,
    ) { }

    public send(type: RequestType, args: any) {
        const requestId = this.nextRequestId++;
        this.context.sendCustomMessage(
            NS,
            "*", // senderId ?
            Object.assign({
                requestId,
                type,
            }, args),
        );

        return new Promise((resolve, reject) => {
            const timeoutHandle = setTimeout(() => {
                reject(new Error("Timeout waiting for response"));
            }, 15000);

            this.pendingRequests[requestId] = data => {
                clearTimeout(timeoutHandle);
                resolve(data);
            };
        });
    }

    private onMessage(msg: cast.framework.events.Event) {
        if (!isRpcResponse(msg)) return;

        debug("received", msg);
        const handler = this.pendingRequests[msg.data.responseTo];
        if (!handler) return;

        delete this.pendingRequests[msg.data.responseTo];
        handler(msg.data);
    }

}
