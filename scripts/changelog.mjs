// FROM clash-verge-rev
import fs from "fs";
import fsp from "fs/promises";
import path from "path";

const CHANGE_LOG = "CHANGELOG.md";

const log = await resolveUpdateLog()

console.log(`CHANGELOG=${log}`);

// parse the CHANGELOG.md
async function resolveUpdateLog() {
    const cwd = process.cwd();

    const reTitle = /^## v[\d.]+/;
    const reEnd = /^---/;

    const tauri_config_file = await fsp.readFile(path.join(cwd, "src-tauri/tauri.conf.json"), "utf-8")
    const json_tauri_config_file = JSON.parse(tauri_config_file)

    const tag = json_tauri_config_file["version"]

    const file = path.join(cwd, CHANGE_LOG);

    if (!fs.existsSync(file)) {
        return
    }

    const data = await fsp.readFile(file, "utf-8");

    const map = {};
    let p = "";

    data.split("\n").forEach((line) => {
        if (reTitle.test(line)) {
            p = line.slice(3).trim();
            if (!map[p]) {
                map[p] = [];
            } else {
                throw new Error(`Tag ${p} dup`);
            }
        } else if (reEnd.test(line)) {
            p = "";
        } else if (p) {
            map[p].push(line);
        }
    });

    if (!map[tag]) {
        throw new Error(`could not found "${tag}" in CHANGELOG.md`);
    }

    return map[tag].join("\n").trim();
}
