# Third-party components

Handpost's own code is licensed under the GNU AGPL-3.0 (`LICENSE`). The components below are included as they are and remain under their own authors' copyrights and licenses; the AGPL-3.0 does not extend to them.

| Component | Location | License | Source |
|---|---|---|---|
| libsodium.js (libsodium, libsodium-wrappers) | `lib/libsodium.js`, `lib/libsodium-wrappers.js` | ISC | https://github.com/jedisct1/libsodium.js |
| hotpocket-js-client 0.5.7 | `lib/browser.min.js` | Evernode Software License (see below) | https://www.npmjs.com/package/hotpocket-js-client |
| hotpocket-nodejs-contract 0.7.4 (bundled into the mailbox program) | `lib/post/index.js` | Evernode Software License (see below) | https://www.npmjs.com/package/hotpocket-nodejs-contract |
| BLAKE3 for JavaScript / WebAssembly | `lib/blake3/` | MIT (`lib/blake3/LICENSE`) | https://github.com/connor4312/blake3 |
| bson 4.5.3 and buffer 6.0.3 (bundled) | `lib/hp-bson.js` | Apache-2.0 (bson), MIT (buffer) | https://github.com/mongodb/js-bson, https://github.com/feross/buffer |
| @noble/post-quantum 0.7.1 with @noble/hashes 2.4.0 and @noble/curves 2.4.0 (ML-KEM-1024 only) | `lib/noble-mlkem-1024.js` | MIT | https://github.com/paulmillr/noble-post-quantum |
| noble-secp256k1 1.7.1 | `lib/noble-secp256k1.js` | MIT | https://github.com/paulmillr/noble-secp256k1 |
| Xumm Universal SDK | `lib/xumm.min.js` | MIT | https://github.com/XRPL-Labs/Xumm-Universal-SDK |
| jsQR | `jsqr.js` | Apache-2.0 | https://github.com/cozmo/jsQR |
| QR Code Generator for JavaScript, Copyright (c) 2009 Kazuhiko Arase | inside `keep/23_ui.js` | MIT | https://github.com/kazuhikoarase/qrcode-generator |

## Evernode Software

hotpocket-js-client and hotpocket-nodejs-contract are Evernode Software, owned by Evernode Labs Pty Ltd, and are used and distributed under the Evernode Software License Agreement:
https://raw.githubusercontent.com/EvernodeXRPL/evernode-resources/main/license/evernode-license.pdf

Handpost includes them only for Legitimate Evernode Network Purposes as defined in that agreement: deploying an instance of a software application (the Handpost mailbox) to a hosting slot on a Host, and interacting with that instance from the browser.
