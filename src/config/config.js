import ctrlConfig from './ctrlConfig.js'

export const controllerDevices = {
    hotasx: [],
    arcadevenom: [],
    xbox: [],
    snes: [],
    nes: [],
    n64: [],
    gamecube: [],
    genesis: [],
    t16000: [],
    twcs: [],
    pedals: [],
}

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
    arcadevenom: {
        name: "PS3/PS4 Arcade Joystick",
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
        name: "XBox Controller",
        layout: "Xbox",
        active: true,
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
        name: "Sega Mega Drive Controller",
        layout: "Genesis",
        active: true,
    },
    t16000: {
        name: "Thrustmaster T.16000M + TWCS",
        layout: "T16000",
        active: false,
    },
    dual16000: {
        name: "Dual Thrustmaster T.16000M",
        layout: "DualT16000",
        active: false,
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