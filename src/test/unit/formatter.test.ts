import * as assert from 'assert';

const formatter = require('../../../out/formatter');

describe('Formatter Tests', () => {

  it('simple 2x2 formatting', () => {
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
                        | &kp Q | &kp W |
                        | &kp E | &kp R |
                    >;
                };
            };
        };`;
    
    assert.strictEqual(formatter.formatDocument(input), expected);
  });

  it('simple 1x3 + 1 formatting', () => {
    const input = `
        #include <dt-bindings/zmk/keys.h>

        // Keymap Template
        // | * | * | * |
        //     | * |

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
        // | * | * | * |
        //     | * |

        / {
            keymap {
                compatible = "zmk,keymap";
                layer_0 {
                    bindings = <
                        | &kp Q | &kp W | &kp E |
                                | &kp R |
                    >;
                };
            };
        };`;
    
    assert.strictEqual(formatter.formatDocument(input), expected);
  });

  it('4x1 with weird spacing', () => {
    const input = `
        #include <dt-bindings/zmk/keys.h>

        // Keymap Template
        // | * | 
        //     | * |
        //         | * |
        // | * |

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
        // | * | 
        //     | * |
        //         | * |
        // | * |

        / {
            keymap {
                compatible = "zmk,keymap";
                layer_0 {
                    bindings = <
                        | &kp Q |
                                | &kp W |
                                        | &kp E |
                        | &kp R |
                    >;
                };
            };
        };`;
    
    assert.strictEqual(formatter.formatDocument(input), expected);
  });

  it('2x2 with wider columns', () => {
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
                        &abc Q &kp W &kp E &kp R
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
                        | &abc Q | &kp W |
                        | &kp  E | &kp R |
                    >;
                };
            };
        };`;
    
    assert.strictEqual(formatter.formatDocument(input), expected);
  });
});