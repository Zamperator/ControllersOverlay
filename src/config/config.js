export const controllerDevices = {
    hotasx: [],
    arcadevenom: [],
    xbox: [],
    snes: [],
    nes: [],
    n64: [],
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
    },
    arcadevenom: {
        name: "PS3/PS4 Arcade Joystick",
        layout: "ArcadeVenom",
        regex: /Arcade\s*Joystick/i,
        active: true,
        useThemes: true,
    },
    xbox: {
        name: "XBox Controller",
        layout: "Xbox",
        regex: /Xbox.*360/i,
        active: true,
    },
    snes: {
        name: "SNES Controller",
        layout: "SNES",
        regex: /Vendor:\s*0583\s*Product:\s*2060/i,
        active: true,
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