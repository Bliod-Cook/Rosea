import {WebviewWindow as TauriWebviewWindow} from "@tauri-apps/api/webviewWindow";

export async function initUpdate() {
    setInterval(
        async () => {
            await Update();
        },
        600000
    )
}

export async function Update() {
    const page = await TauriWebviewWindow.getByLabel("update")
    if (page?.label) {
        await page.close()
    }
    new TauriWebviewWindow("update", {
        url: "/update/",
        title: "更新",
        width: 250,
        height: 180,
        transparent: false,
        alwaysOnTop: false,
        decorations: false,
        shadow: false,
        resizable: false,
        skipTaskbar: false,
        visible: false,
        maximizable: false
    })
}