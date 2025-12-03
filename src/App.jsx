import React, {useEffect, useMemo, useState, lazy, Suspense} from 'react'
import DebugBox from '@/components/DebugBox'
import MenuPanel from '@/components/MenuPanel'
import {controllerSetups} from '@/config/config'
import {GamepadProvider, useGamepads} from '@/hooks/GamepadContext'
import {L8N} from '@/lib/Localization'
import HelpPanel from '@/components/HelpPanel'
import '@/styles/style.css'

const forcedDevice = null

// Load all layout components dynamically (lazy) from /layouts/**
// Expectation: each file exports a React component by default
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

/**
 * Retrieves the 'device' parameter from the URL query string.
 * @returns {string|null}
 */
function getDeviceFromUrl() {
    const params = new URLSearchParams(window.location.search)
    const value = params.get('device')
    return value ? value.toLowerCase() : forcedDevice
}

/**
 * Main app component with GamepadProvider.
 *
 * @returns {JSX.Element}
 * @constructor
 */
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

/**
 * Inner app component.
 *
 * @param debug
 * @param setDebug
 * @returns {JSX.Element}
 * @constructor
 */
function AppInner({debug, setDebug}) {
    const {activeKey, hasAny} = useGamepads()
    const [activeSetup, setActiveSetup] = useState(null)
    const [showDeviceSelect, setShowDeviceSelect] = useState(false)
    const [showHelp, setShowHelp] = useState(false)

    const layouts = useLayoutsMap()

    /**
     * Menu component.
     *
     * @returns {JSX.Element}
     * @constructor
     */
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
    // Layout based on active setup
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
            // Expected: setup.layout matches the file name (e.g., ‘Xbox’ → ./layouts/Xbox.jsx)
            SelectedLayout = layouts[setup.layout]
        }
    }

    // No devices detected and no forced setup
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

            <HelpPanel open={showHelp} onClose={() => setShowHelp(false)}>
            </HelpPanel>
        </div>
    )
}

/**
 * Main app component.
 *
 * @returns {JSX.Element}
 * @constructor
 */
export default function App() {
    return <AppWithProvider/>
}
