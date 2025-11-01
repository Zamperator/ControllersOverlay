import de from "./locales/de.json" with { type: "json" }
import en from "./locales/en.json" with { type: "json" }

const dictionaries = { de, en }

/**
 * Localization class for managing multiple languages.
 */
class Localization {

    constructor(defaultLang = "de") {
        this.setLanguage(defaultLang)
    }

    /**
     * Set the current language.
     * @param lang
     */
    setLanguage(lang) {
        if (dictionaries[lang]) {
            this.lang = lang
            this.dict = dictionaries[lang]
        } else {
            console.warn(`⚠️ Language "${lang}" not found, fallback to "${this.lang}"`)
        }
    }

    /**
     * Get localized string by key.
     * @param key
     * @param args
     * @returns {string}
     */
    get(key, args = []) {
        const parts = key.split(".")
        let str = this.dict

        // Loop through parts to find nested keys
        for (const [i, p] of parts.entries()) {
            if (str && typeof str === "object" && p in str) {
                str = str[p]
            } else {
                // Fallback: find complete key in current object
                if (str && typeof str === "object" && parts.slice(i).join(".") in str) {
                    str = str[parts.slice(i).join(".")]
                } else {
                    str = key
                }
                break
            }
        }

        if (typeof str !== "string") {
            str = String(str)
        }

        args.forEach((val, i) => {
            str = str.replace(new RegExp(`\\{${i + 1}\\}`, "g"), val)
        })
        return str
    }
}

export const L8N = new Localization()
