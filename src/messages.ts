import { MediaInformation } from "chromecast-caf-receiver/cast.framework.messages";

/*
 * Misc types
 */

// tslint:disable no-bitwise
export enum SenderCapabilities {
    None = 0,

    DeferredInfo = 1 << 1,

    QueueNext = 1 << 2,
    QueuePrev = 1 << 3,
}

export function hasCapability(
    haystack: SenderCapabilities,
    needle: SenderCapabilities,
) {
    return (haystack & needle) === needle;
}
// tslint:enable no-bitwise

export interface IBabblerCustomData {
    capabilities?: SenderCapabilities;
    license?: {
        ipc?: boolean;
        url?: string;
    };
}

/*
 * RPC core types
 */

export interface IRpcResponseData<TData> {
    response: TData;
    responseTo: number;
    type: string;
}

export interface IRpcResponse<T> extends cast.framework.events.Event {
    data: IRpcResponseData<T>;
}

export function isRpcResponse<T>(ev: cast.framework.events.Event): ev is IRpcResponse<T> {
    const data = (ev as any).data;
    return data && data.responseTo;
}

export class RPC<TReq, TResponseData> {
    constructor(
        public requestType: string,
        public responseType: string = `${requestType}_RESPONSE`,
        public timeoutMillis: number = 15000,
    ) {}
}

export type ReqArgsFor<T extends RPC<any, any>> =
    T extends RPC<infer TReq, infer TResponseData> ? TReq :
    never;

export type ResponseDataFor<T extends RPC<any, any>> =
    T extends RPC<infer TReq, infer TResponseData> ? TResponseData :
    never;

/**
 * INFO request
 */

export const INFO = new RPC<IInfoRequest, MediaInformation>("INFO");

export interface IInfoRequest {
    contentId: string;
}

/*
 * LICENSE request
 */

/**
 * @return license data in base64 encoding
 */
export const LICENSE = new RPC<ILicenseRequest, string>("LICENSE");

export interface ILicenseRequest {
    url?: string;
    base64: string;
}

/*
 * QUEUE request
 */

export const QUEUE = new RPC<IQueueRequest, IQueueResponse[]>("QUEUE");

export interface IQueueRequest {
    mode: "before" | "after";
    contentId: string;
}

export interface IQueueResponse {
    contentId: string;
    currentTime?: number;
    customData?: IBabblerCustomData;
    metadata: cast.framework.messages.MediaMetadata;
}
