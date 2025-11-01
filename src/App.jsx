import React, {useEffect, useMemo, useState, lazy, Suspense} from 'react'
import DebugBox from './components/DebugBox'
import MenuPanel from './components/MenuPanel'
import {controllerSetups} from './config/config'
import {GamepadProvider, useGamepads} from './hooks/GamepadContext'
import './styles/style.css'
import {L8N} from './lib/Localization'
import HelpPanel from '@/components/HelpPanel'

const forcedDevice = null

// Alle Layout-Komponenten dynamisch (lazy) aus /layouts/** laden
// Erwartung: jede Datei exportiert default eine React-Komponente
const layoutModules = import.meta.glob('./layouts/**/*.{jsx,tsx,js,ts}')

function useLayoutsMap() {
    return useMemo(() => {
        return Object.fromEntries(
            Object.entries(layoutModules).map(([path, loader]) => {
                const name = path.split('/').pop().replace(/\.(jsx?|tsx?)$/, '')
                return [name, lazy(loader)]
            })
        )
    }, [])
}

function getDeviceFromUrl() {
    const params = new URLSearchParams(window.location.search)
    const value = params.get('device')
    return value ? value.toLowerCase() : forcedDevice
}

function AppWithProvider() {
    const [debug, setDebug] = useState(true)

    return (
        <GamepadProvider
            enabled={debug} // Polling nur wenn Debug aktiv
            options={{intervalMs: 60, timeoutMs: 1500, deadzone: .22}}
        >
            <AppInner debug={debug} setDebug={setDebug}/>
        </GamepadProvider>
    )
}

function AppInner({debug, setDebug}) {
    const {activeKey, hasAny} = useGamepads()
    const [activeSetup, setActiveSetup] = useState(null)
    const [showDeviceSelect, setShowDeviceSelect] = useState(false)
    const [showHelp, setShowHelp] = useState(false)

    const layouts = useLayoutsMap()

    const Menu = () => (
        <MenuPanel
            setShowDeviceSelect={setShowDeviceSelect}
            activeSetup={activeSetup}
            setActiveSetup={setActiveSetup}
            debug={debug}
            setDebug={setDebug}
            leftLinks={[
                {label: L8N.get('help.title'), onClick: () => setShowHelp(true)}
            ]}
        />
    )

    // Initial: URL erzwingt Gerät oder Selector anzeigen
    useEffect(() => {
        const urlDevice = getDeviceFromUrl()
        const validUrlDevice = urlDevice && controllerSetups[urlDevice]
        if (forcedDevice) {
            setActiveSetup(forcedDevice)
        }
        else if (validUrlDevice) {
            setActiveSetup(urlDevice)
        }
        else {
            setShowDeviceSelect(true)
        }
    }, [])

    let SelectedLayout = null
    if (activeSetup) {
        const setup = controllerSetups[activeSetup.toLowerCase()]
        if (setup) {
            if (!setup.active) {
                return (
                    <div className='debug active'>
                        <Menu/>
                        <strong>{L8N.get('error.device_currently_not_supported', [setup.name])}</strong>
                    </div>
                )
            }
            // Erwartet: setup.layout entspricht dem Dateinamen (z. B. 'Xbox' → ./layouts/Xbox.jsx)
            SelectedLayout = layouts[setup.layout]
        }
    }

    if (!hasAny && !activeSetup) {
        return (
            <div className='debug active'>
                <Menu/>
                <strong>{L8N.get('error.no_devices_detected')}</strong>
            </div>
        )
    }

    return (
        <div id='overlay'>
            <Menu/>

            <Suspense fallback={null}>
                {SelectedLayout && <SelectedLayout/>}
            </Suspense>

            {!SelectedLayout && !showDeviceSelect && (
                <p style={{color: '#aaa'}}>{L8N.get('press_key_or_stick')}</p>
            )}

            {debug && <DebugBox activeSetup={activeSetup} activeKey={activeKey}/>}

            <HelpPanel open={showHelp} onClose={() => setShowHelp(false)} title={L8N.get('help.title')}>
                <h3>{L8N.get('help.controls')}</h3>
                <ul>
                    <li>{L8N.get('press_key_or_stick')}</li>
                    <li>{L8N.get('help.change_device')}</li>
                    <li>{L8N.get('help.debug_toggle')}</li>
                </ul>
                <h3>{L8N.get('help.troubleshoot')}</h3>
                <ul>
                    <li>{L8N.get('help.browser_input')}</li>
                    <li>{L8N.get('help.usb')}</li>
                </ul>
            </HelpPanel>
        </div>
    )
}

export default function App() {
    return <AppWithProvider/>
}
