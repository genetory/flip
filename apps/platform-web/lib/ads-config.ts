// Master kill switch for every AdSense placement on the site.
//
// Set to `false` while the domain is under AdSense content review so that
// NO ad code (loader script, sidebar units, in-feed units) is emitted
// anywhere — keeping ad code on a site that AdSense flagged for "low value
// content" only prolongs the violation. Once the content layer is built
// out and AdSense re-approves aply.global, flip this back to `true`.
export const ADS_ENABLED = false;
