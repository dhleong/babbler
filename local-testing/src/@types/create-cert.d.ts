/// <reference types="node" />

declare module "create-cert" {
    export default function createCert(): Promise<{
        caCert: string,
        cert: string,
        key: string,
    }>;
}
