const STORAGE_KEY = 'ctrl'

/**
 * CtrlConfig
 * A simple configuration manager that uses localStorage to persist data.
 */
class CtrlConfig {

    constructor() {

        this.cache = this._readStore()

        if (typeof window !== 'undefined' && window.addEventListener) {
            this._onStorage = (ev) => {
                if (ev && ev.key === STORAGE_KEY) {
                    this.cache = this._readStore()
                }
            }
            window.addEventListener('storage', this._onStorage)
        }
    }

    _readStore() {
        try {
            const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
            if (!raw) {
                return {}
            }
            const parsed = JSON.parse(raw)
            if (parsed && typeof parsed === 'object') {
                return parsed
            }
            return {}
        } catch (e) {
            return {}
        }
    }

    _writeStore(obj) {
        try {
            if (typeof localStorage === 'undefined') {
                return false
            }
            const payload = JSON.stringify(obj)
            localStorage.setItem(STORAGE_KEY, payload)
            return true
        } catch (e) {
            return false
        }
    }

    save() {
        return this._writeStore(this.cache)
    }

    set(name, field, value) {
        if (!name) {
            return false
        }
        if (!this.cache || typeof this.cache !== 'object') {
            this.cache = {}
        }
        if (!this.cache[name] || typeof this.cache[name] !== 'object') {
            this.cache[name] = {}
        }
        this.cache[name][field] = value
        return this.save()
    }

    get(name, field) {
        const store = this.cache || {}
        if (!name) {
            return store
        }
        const node = store[name]
        if (typeof field === 'undefined') {
            return node || null
        }
        if (!node || typeof node !== 'object') {
            return null
        }
        if (Object.prototype.hasOwnProperty.call(node, field)) {
            return node[field]
        }
        return null
    }
}

const ctrlConfig = new CtrlConfig()

export default ctrlConfig
