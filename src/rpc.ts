import _debug from "debug";
import { isRpcResponse, ReqArgsFor, ResponseDataFor, RPC } from "./messages";
const debug = _debug("babbler:rpc");

const NS = "urn:x-cast:com.github.dhleong.babbler";

type RequestResolver<T> = (result: T) => void;

class PendingRequest<T extends RPC<any, any>> {
    constructor(
        public rpc: T,
        public resolve: RequestResolver<ResponseDataFor<T>>,
    ) {}
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
    private pendingRequests: {[key: number]: PendingRequest<RPC<any, any>>} = {};

    private activeSenderId: string | undefined;

    private constructor(
        private context: cast.framework.CastReceiverContext,
    ) { }

    public send<TRPC extends RPC<any, any>>(
        rpc: TRPC,
        data: ReqArgsFor<TRPC>,
    ): Promise<ResponseDataFor<TRPC>> {
        const requestId = this.nextRequestId++;
        this.context.sendCustomMessage(
            NS,

            // NOTE: the typings don't allow undefined here, but
            // it *is* acceptable for broadcast
            this.activeSenderId as string,

            Object.assign({
                requestId,
                type: rpc.requestType,
            }, data),
        );

        return new Promise((resolve, reject) => {
            const timeoutHandle = setTimeout(() => {
                const message = `TIMEOUT waiting for response to ${rpc.requestType} #${requestId}`;
                debug(message);
                reject(new Error(message));
            }, rpc.timeoutMillis);

            this.pendingRequests[requestId] = new PendingRequest(
                rpc,
                response => {
                    clearTimeout(timeoutHandle);
                    resolve(response);
                },
            );
        });
    }

    /**
     * Set the ID of the sender to whom we will send
     * messages
     */
    public setActiveSender(senderId: string | undefined) {
        this.activeSenderId = senderId;
    }

    private onMessage(msg: cast.framework.events.Event) {
        if (!isRpcResponse(msg)) return;

        debug("received", msg);
        const req = this.pendingRequests[msg.data.responseTo];
        if (!req) return;

        if (msg.data.type !== req.rpc.responseType) {
            throw new Error(
                `Expected '${req.rpc.responseType}' ` +
                `in response to '${req.rpc.requestType}'` +
                `but got '${msg.type}'`,
            );
        }

        delete this.pendingRequests[msg.data.responseTo];
        req.resolve(msg.data.response);
    }

}
