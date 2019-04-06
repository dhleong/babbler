import { serve } from "./serve";

import { AmazonLicenseService } from "./amazon";

// tslint:disable no-console

(async () => {
    const {
        cookie,
        licenseUrl,
    } = require("../test.json");

    const info = await serve(
        new AmazonLicenseService(cookie, licenseUrl),
        3000,
    );
    console.log(info);
})().catch(e => {
    console.warn(e);
});
