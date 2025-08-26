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
                            &kp Q &kp W
                            &kp E &kp R
                        >;
                    };
                };
            };`;
        
        assert.strictEqual(formatter.formatDocument(input), expected);
    });

    it('simple 2x2 with different indentation', () => {
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
                            &kp Q &kp W &kp E
                                  &kp R
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
                            &kp Q
                                  &kp W
                                        &kp E
                            &kp R
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
                            &abc Q &kp W &lt E &kp R
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
                            &abc Q &kp W
                            &lt  E &kp R
                        >;
                    };
                };
            };`;
        
        assert.strictEqual(formatter.formatDocument(input), expected);
    });

    it('2x2 with wide no param cell', () => {
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
                            &abc Q  &kp W 
                            &spaceb &lt BLUETOOTH N
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
                            &abc Q  &kp W          
                            &spaceb &lt BLUETOOTH N
                        >;
                    };
                };
            };`;
        
        assert.strictEqual(formatter.formatDocument(input), expected);
    });

    it('2x2 with multiple layers', () => {
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
                    layer_1 {
                        bindings = <
                            &abc Q &kp W &lt E &kp R 
                        >;
                    };
                    layer_2 {
                        bindings = <
                            &abc Q  &kp W 
                            &spaceb &lt BLUETOOTH N
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
                    layer_1 {
                        bindings = <
                            &abc Q &kp W
                            &lt  E &kp R
                        >;
                    };
                    layer_2 {
                        bindings = <
                            &abc Q  &kp W          
                            &spaceb &lt BLUETOOTH N
                        >;
                    };
                };
            };`;
        
        assert.strictEqual(formatter.formatDocument(input), expected);
    });

    it('more complex example', () => {
        const input = `
            #include <dt-bindings/zmk/keys.h>

            // Keymap Template
            // | * | * | * | * | * | * | * | * | * | * |
            // | * | * | * | * | * | * | * | * | * | * |
            // | * | * | * | * | * | * | * | * | * | * |
            //         | * | * | * | * | * | * |

            / {
                keymap {
                    compatible = "zmk,keymap";

                    default_layer {
                        bindings = <
                        &kp Q &kp W &ltf NAV E &kp R &kp T                     &kp Y &kp U &bhm RC(RALT) I &kp O &kp P
                        &bhm LCTRL A &kp S &bhm LSHFT D &bhm LGUI F &kp G     &kp H &bhm RGUI J &bhm RSFT K &kp L &bhm RCTRL APOS
                        &bhm LALT Z  &kp X &kp C &ltf ARROWS V                 &kp B &lt BLUETOOTH N &lt MEDIA M &kp COMMA &kp DOT &bhm RALT FSLH
                        &trans &ltf SYMBOLS ESC &kp RSHFT        &spaceb &ltf NUMBERS RET &trans
                        >;
                    };
                };
            };`;

        const expected = `
            #include <dt-bindings/zmk/keys.h>

            // Keymap Template
            // | * | * | * | * | * | * | * | * | * | * |
            // | * | * | * | * | * | * | * | * | * | * |
            // | * | * | * | * | * | * | * | * | * | * |
            //         | * | * | * | * | * | * |
            
            / {
                keymap {
                    compatible = "zmk,keymap";
                    
                    default_layer {
                        bindings = <
                            &kp  Q       &kp W &ltf NAV E   &kp  R           &kp T     &kp Y           &kp  U           &bhm RC(RALT) I &kp O   &kp P
                            &bhm LCTRL A &kp S &bhm LSHFT D &bhm LGUI F      &kp G     &kp H           &bhm RGUI J      &bhm RSFT K     &kp L   &bhm RCTRL APOS
                            &bhm LALT Z  &kp X &kp  C       &ltf ARROWS V    &kp B     &lt BLUETOOTH N &lt  MEDIA M     &kp  COMMA      &kp DOT &bhm RALT FSLH
                                               &trans       &ltf SYMBOLS ESC &kp RSHFT &spaceb         &ltf NUMBERS RET &trans
                        >;
                    };
                };
            };`;
        
        assert.strictEqual(formatter.formatDocument(input), expected);
    });
});