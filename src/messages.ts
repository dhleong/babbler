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
        public responseType: string,
        public timeoutMillis: number = 15000,
    ) {}
}

export type ReqArgsFor<T extends RPC<any, any>> =
    T extends RPC<infer TReq, infer TResponseData> ? TReq :
    never;

export type ResponseDataFor<T extends RPC<any, any>> =
    T extends RPC<infer TReq, infer TResponseData> ? TResponseData :
    never;

export interface ILicenseRequest {
    url?: string;
    base64: string;
}

/**
 * @return license data in base64 encoding
 */
export const LICENSE = new RPC<ILicenseRequest, string>(
    "LICENSE",
    "LICENSE_RESPONSE",
);
