import request from "request-promise-native";

import _debug from "debug";
const debug = _debug("babbler:amazon");

import { ILicenseService } from "./service";

export class AmazonLicenseService implements ILicenseService {
    constructor(
        private cookie: string,
        private licenseUrl: string,
    ) {}

    public async performRequest(challenge: Buffer): Promise<Buffer> {
        const challengeEncoded = challenge.toString("base64");
        debug("challenge=", challenge);
        const response = await request.post({
            form: {
                includeHdcpTestKeyInLicense: true,
                widevine2Challenge: challengeEncoded,
            },
            headers: {
                cookie: this.cookie,
            },
            json: true,
            uri: this.licenseUrl,
        });

        if (response.error) {
            throw new Error(response.error.message);
        } else if (
            response.errorsByResource
            && response.errorsByResource.Widevine2License
        ) {
            debug(response.errorsByResource.Widevine2License);
            throw new Error(
                response.errorsByResource.Widevine2License.message,
            );
        }

        return Buffer.from(response.widevine2License.license, "base64");
    }
}
