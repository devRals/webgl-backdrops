import { defineConfig, LibraryOptions } from "vite"
import viteDts from "vite-plugin-dts"

export default (entry: LibraryOptions["entry"]) => defineConfig({
    plugins: [viteDts()],
    build: {
        lib: {
            entry,
            name: "index",
            formats: ["cjs", "es"],
        },
        rolldownOptions: {
            external: ["@devrals/math", "@devrals/webgl-engine"]
        }
    },
    resolve: {
        tsconfigPaths: true
    }
})
