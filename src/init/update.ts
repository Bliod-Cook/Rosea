import {WebviewWindow as TauriWebviewWindow} from "@tauri-apps/api/webviewWindow";

export async function initUpdate() {
    setInterval(
        async () => {
            if ((await TauriWebviewWindow.getByLabel("update"))?.label) {}
            else {
                new TauriWebviewWindow("update", {
                    url: "/update/",
                    title: "更新",
                    width: 250,
                    height: 180,
                    transparent: true,
                    alwaysOnTop: true,
                    decorations: false,
                    shadow: false,
                    resizable: false,
                    skipTaskbar: true,
                    visible: false,
                    maximizable: false
                })
            }
        },
        600000
        // async () => {
        //     if ((await TauriWebviewWindow.getByLabel("update"))?.label) {}
        //     else {
        //         new TauriWebviewWindow("update", {
        //             url: "/update/",
        //             title: "更新",
        //             width: 250,
        //             height: 180,
        //             transparent: true,
        //             alwaysOnTop: false,
        //             decorations: false,
        //             shadow: false,
        //             resizable: false,
        //             skipTaskbar: false,
        //             visible: true,
        //         })
        //     }
        // },
        // 10000
    )
}