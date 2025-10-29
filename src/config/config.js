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
        regex: /PS[345]\s*\/?\s*Arcade\s*Joystick/i,
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
        regex: /Xbox.*360.*XInput/i,
        active: true,
    },
    snes: {
        name: "SNES Controller",
        layout: "SNES",
        regex: /Vendor:\s*0583\s*Product:\s*2060/i,
        active: true,
        themes: {
            ntsc: "NTSC",
        }
    },
    nes: {
        name: "NES Controller",
        layout: "NES",
        regex: /Vendor:\s*0583\s*Product:\s*2060/i,
        active: true,
    },
    n64: {
        name: "N64 Controller",
        layout: "N64",
        regex: /Vendor:\s*0079\s*Product:\s*0006/i,
        active: true,
    },
    gamecube: {
        name: "GameCube Controller",
        layout: "GameCube",
        // Detect: Xbox 360-Controller für Windows (STANDARD GAMEPAD)
        regex: /Xbox\s*360-Controller.*\(STANDARD\s*GAMEPAD\)/i,
        active: true,
    },
    genesis: {
        name: "Sega Mega Drive Controller",
        layout: "Genesis",
        regex: /Vendor:\s*0079\s*Product:\s*0011/i,
        active: true,
    },
    t16000: {
        name: "Thrustmaster T.16000M + TWCS",
        layout: "T16000",
        regex: /T\.16000M/i,
        active: false,
    },
    dual16000: {
        name: "Dual Thrustmaster T.16000M",
        layout: "DualT16000",
        regex: /T\.16000M/i,
        active: false,
    },
    pedals: {
        name: "Thrustmaster TFRP Pedals",
        layout: "Pedals",
        regex: /TFRP/i,
        active: false,
    },
}

export function getControllerSetup(name) {

    const setup = controllerSetups[name] ?? null

    if (setup) {
        setup.getRegEx = () => {

            let savedSetup = ctrlConfig.get(name, 'regex') ?? null;

            if (savedSetup) {
                return JSON.parse(savedSetup).regex ?? setup.regex
            }

            return setup.regex
        }
    }

    return setup
}