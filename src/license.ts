import { LICENSE } from "./messages";
import { RpcManager } from "./rpc";
import { ab2str } from "./util";

export class LicenseHandler {
    public static init(
        rpc: RpcManager,
        playbackConfig: cast.framework.PlaybackConfig,
        context: cast.framework.CastReceiverContext,
    ) {
        const handler = new LicenseHandler(
            rpc,
        );

        playbackConfig.licenseRequestHandler = handler.handleLicenseRequest.bind(handler);

        // NOTE: the typings don't allow for a promise, but the API does
        playbackConfig.licenseHandler = handler.handleLicenseData.bind(handler) as any;

        return handler;
    }

    constructor(
        private rpc: RpcManager,
    ) {}

    public handleLicenseRequest(
        requestInfo: cast.framework.NetworkRequestInfo,
    ) {
        const originalUrl = requestInfo.url;
        if (!/^ipc:\/\//.test(originalUrl)) {
            // just allow the default behavior
            return null;
        }

        // route through IPC
        const dataBase64 = btoa(ab2str(requestInfo.content));
        requestInfo.url = "data://application/json," + JSON.stringify({
            data: dataBase64,
            url: originalUrl.substring("ipc://".length),
        });
    }

    public async handleLicenseData(data: ArrayBuffer) {
        const asString = ab2str(data);

        let obj;
        try {
            obj = JSON.parse(asString);
        } catch (e) {
            // not JSON? return original response data unmolested
            return data;
        }

        const buffer = await this.rpc.send(LICENSE, {
            base64: obj.data,
            url: obj.url,
        });

        return { buffer };
    }
}
