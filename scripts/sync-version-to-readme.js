const fs = require("node:fs")
const path = require("node:path")

function main() {
    const root = process.cwd()
    const readmePath = path.join(root, "README.md")
    const pkgPath = path.join(root, "package.json")

    const pkgRaw = fs.readFileSync(pkgPath, "utf8")
    const pkg = JSON.parse(pkgRaw)
    const version = (pkg.version || "").trim()

    if (!version) {
        console.error("package.json has no version")
        process.exit(1)
    }

    const readme = fs.readFileSync(readmePath, "utf8")
    const re = /(<!--APP_VERSION-->)([\s\S]*?)(<!--\/APP_VERSION-->)/g

    if (!re.test(readme)) {
        console.error("README.md: Placeholder <!--APP_VERSION-->...<!--/APP_VERSION--> not found")
        process.exit(1)
    }

    const next = readme.replace(re, `$1${version}$3`)

    if (next !== readme) {
        fs.writeFileSync(readmePath, next, "utf8")
        console.log(`README.md updated to version ${version}`)
    } else {
        console.log("README.md already up to date")
    }
}

main()