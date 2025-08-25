import * as assert from 'assert';

const formatter = require('../../../out/formatter');

describe('Formatter Tests', () => {
  it('should return the same text for now', () => {
    const input = `
        #include <dt-bindings/zmk/keys.h>

        // Keymap Template
        // | * | * |
        // | * | * |

        / {
            keymap {
                compatible = "zmk,keymap";
                layer_0 {
                    bindings = <
                        &kp Q &kp W &kp E &kp R
                    >;
                };
            };
        };`;

    const expected = `
        #include <dt-bindings/zmk/keys.h>

        // Keymap Template
        // | * | * |
        // | * | * |

        / {
            keymap {
                compatible = "zmk,keymap";
                layer_0 {
                    bindings = <
                        &kp Q &kp W 
                        &kp E &kp R
                    >;
                };
            };
        };`;
    
    // For now, we're just testing that the test framework works
    // We'll implement actual formatting logic in later steps
    assert.strictEqual(formatter.formatDocument(input), expected);
  });
});