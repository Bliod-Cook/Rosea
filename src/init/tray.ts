import { TrayIcon } from "@tauri-apps/api/tray";
import {defaultWindowIcon} from "@tauri-apps/api/app";
import {Menu} from "@tauri-apps/api/menu";
import {invoke} from "@tauri-apps/api/core";
import {emit, listen} from "@tauri-apps/api/event";
import { ManualUpdate } from "./update.ts";

const tray = await TrayIcon.getById("default") ?? await TrayIcon.new({
    showMenuOnLeftClick: true,
    icon: await defaultWindowIcon() ?? undefined,
    id: "default",
})

export let moveable = false;
export let visibility = true;
export let canvas_mode = 1;

export async function initTray() {
    await changeTray()
}

async function changeTray()  {
    const menu = await Menu.new({
        items: [
            {
                id: "moveable",
                text: `Moveable ${moveable?"√":"×"}`,
                action: () => {moveable = !moveable; emit("change://clock/move-ability", moveable).then(()=>{changeTray()})}
            },
            {
                id: "click_through",
                text: `ClickThrough ${!visibility?"√":"×"}`,
                action: () => {visibility = !visibility; emit("change://clock/visibility", visibility).then(()=>{changeTray()})}
            },
            {
                id: "check_update",
                text: "Check for Updates",
                action: () => {ManualUpdate().then()}
            },
            {
                id: "Quit",
                text: "Quit",
                action: () => {invoke("quit")},
            },
        ]
    })

    await tray.setMenu(menu)
}

listen("change://clock/move-ability", (event) => {
    moveable = event.payload as boolean
    changeTray().then()
}).then()

listen("change://clock/visibility", (event) => {
    visibility = event.payload as boolean
    changeTray().then()
}).then()

listen("change://canvas/mode", (event) => {
    canvas_mode = event.payload as number
    changeTray().then()
}).then()