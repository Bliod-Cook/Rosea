import { TrayIcon } from "@tauri-apps/api/tray";
import {defaultWindowIcon} from "@tauri-apps/api/app";
import {Menu} from "@tauri-apps/api/menu";
import {invoke} from "@tauri-apps/api/core";
import {emit, listen} from "@tauri-apps/api/event";

let moveable = false;
listen("change_movable", () => {changeTray()})

export async function initTray() {
    const menu = await Menu.new({
        items: [
            {
                id: "movable",
                text: "Movable ×",
                action: ()=>{emit("change_movable").then(); moveable = !moveable}
            },
            {
                id: "Quit",
                text: "Quit",
                action: quit,
            },
        ]
    })

    const options = {
        menu,
        menuOnLeftClick: true,
        icon: await defaultWindowIcon() ?? undefined,
        id: "default",
    }

    await TrayIcon.new(options)
}

async function changeTray()  {
    const menu = await Menu.new({
        items: [
            {
                id: "movable",
                text: `Movable ${moveable?"√":"×"}`,
                action: ()=>{emit("change_movable").then(); moveable = !moveable}
            },
            {
                id: "Quit",
                text: "Quit",
                action: quit,
            },
        ]
    })

    const tray = await TrayIcon.getById("default")

    await tray?.setMenu(menu)
}

function quit() {
    invoke("quit").then()
}
