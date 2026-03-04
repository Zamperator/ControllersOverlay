import {useEffect} from 'react'
import {L8N} from "@/lib/Localization";
import '@/styles/components/HelpPanel.css'

const APP_VERSION = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "dev"

/**
 * Help panel component.
 * @param open
 * @param onClose
 * @param title
 * @returns {React.JSX.Element}
 * @constructor
 */
export default function HelpPanel({open, onClose}) {

    useEffect(() => {
        if (!open) {
            return
        }
        const onKey = e => {
            if (e.key === 'Escape') {
                onClose?.()
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [open, onClose])

    if (!open) {
        return null
    }

    return (
        <div className="help-backdrop" onClick={onClose}>
            <aside className="help-panel" onClick={e => e.stopPropagation()}>
                <header className="help-header">
                    <h2>{L8N.get('help.title')}</h2>
                    <button type="button" className="help-close" onClick={onClose} aria-label="Close">×</button>
                </header>
                <div className="help-body">
                    <h3>{L8N.get('help.controls')}</h3>
                    <ul>
                        <li>{L8N.get('press_key_or_stick')}</li>
                        <li>{L8N.get('help.change_device')}</li>
                        <li>{L8N.get('help.debug_toggle')}</li>
                        <li>{L8N.get('help.ctrl_extra')}</li>
                    </ul>
                    <h3>{L8N.get('help.troubleshoot')}</h3>
                    <ul>
                        <li>{L8N.get('help.browser_input')}</li>
                        <li>{L8N.get('help.usb')}</li>
                    </ul>
                    <hr />
                    <div className={"copyright"}>
                        <span>Version: <a href={"https://github.com/Zamperator/ControllerOverlay"} target={"_blank"} rel="noreferrer">{APP_VERSION}</a></span>
                        <span>Author: <a href={"https://zamperia.de"}>Zam</a></span>
                        <span>Uses: <strong>React</strong></span>
                    </div>
                </div>
            </aside>
        </div>
    )
}
