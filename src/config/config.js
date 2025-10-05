export const controllerDevices = {
    hotasx: [],
    arcadevenom: [],
    xbox: [],
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
    },
    xbox: {
        name: "XBox Controller",
        layout: "Xbox",
        regex: /Xbox.*360/i,
        active: true,
    },
    t16000: {
        name: "Thrustmaster T.16000M + TWCS",
        layout: "T16000",
        regex: /T\.16000M/i,
        active: true,
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