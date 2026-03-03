/**
 * Available controller setups
 * @type {Object.<string, {name: string, layout: string, regex?: RegExp, active: boolean, themes?: Object.<string, string>}>}
 *
 * TODO: Move each entry to it's own module/file for better maintainability
 */
export const controllerSetups = {
    hotasx: {
        name: "Thrustmaster Hotas X",
        layout: "HotasX",
        regex: /Hotas\s*X/i,
        active: true,
        themes: {
            default: "Default",
            space: "Space",
            desert: "Desert",
            ocean: "Ocean",
        }
    },
    dual16000: {
        name: "T.16000M FCS + TWCS (Split)",
        layout: "DualT16000",
        active: true,
        modules: {
            "left,twcs":        "T16000 (L) + TWCS",
            "right,twcs":       "T16000 (R) + TWCS",
            "left,right":       "Dual T16000",
            "left,right,twcs":  "Dual T16000 + TWCS",
            "left":             "T16000 (L)",
            "right":            "T16000 (R)",
            "twcs":             "TWCS only",
        }
    },
    arcadevenom: {
        name: "Arcade Joystick (PS3/PS4)",
        layout: "ArcadeVenom",
        active: true,
        themes: {
            default: "Default",
            icy: "Icy",
            matrix: "Matrix",
            inferno: "Inferno",
            retro: "Retro",
            aqua: "Aqua",
        }
    },
    xbox: {
        name: "XBox One",
        layout: "Xbox",
        active: true,
    },
    ps5: {
        name: "PS5",
        layout: "PS5",
        active: false,
    },
    snes: {
        name: "SNES Controller",
        layout: "SNES",
        active: true,
        themes: {
            ntsc: "NTSC",
        }
    },
    nes: {
        name: "NES Controller",
        layout: "NES",
        active: true,
    },
    n64: {
        name: "N64 Controller",
        layout: "N64",
        active: true,
    },
    gamecube: {
        name: "GameCube Controller",
        layout: "GameCube",
        active: true,
    },
    genesis: {
        name: "Mega Drive 6 Buttons",
        layout: "Genesis",
        active: true,
    },
    genesisclassic: {
        name: "Mega Drive 3 Buttons",
        layout: "GenesisClassic",
        active: true,
    },
    pedals: {
        name: "Thrustmaster TFRP Pedals",
        layout: "Pedals",
        active: false,
    },
}

export function getControllerSetup(name) {
    return controllerSetups[name] ?? null
}