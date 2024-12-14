import { TrayIcon } from "@tauri-apps/api/tray";
import {defaultWindowIcon} from "@tauri-apps/api/app";
import {Menu} from "@tauri-apps/api/menu";
import {invoke} from "@tauri-apps/api/core";
import {emit} from "@tauri-apps/api/event";

const tray = await TrayIcon.getById("default") ?? await TrayIcon.new({
    menuOnLeftClick: true,
    icon: await defaultWindowIcon() ?? undefined,
    id: "default",
})

export let moveable = false;
export let click_through = false;

export async function initTray() {
    await changeTray()
}

async function changeTray()  {
    const menu = await Menu.new({
        items: [
            {
                id: "movable",
                text: `Movable ${moveable?"√":"×"}`,
                action: () => {moveable = !moveable; emit("change_movable").then(()=>{changeTray()})}
            },
            {
                id: "click_through",
                text: `ClickThrough ${click_through?"√":"×"}`,
                action: () => {click_through = !click_through; emit("change_click_through").then(()=>{changeTray()})}
            },
            {
                id: "Quit",
                text: "Quit",
                action: quit,
            },
        ]
    })

    await tray.setMenu(menu)
}

function quit() {
    invoke("quit").then()
}
