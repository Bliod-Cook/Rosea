import {WebviewWindow as TauriWebviewWindow} from "@tauri-apps/api/webviewWindow";

export async function initUpdate() {
    setInterval(
        async () => {
            await Update();
            // const page = await TauriWebviewWindow.getByLabel("update")
            // if (page?.label) {
            //     await page.close()
            // }
            // new TauriWebviewWindow("update", {
            //     url: "/update/",
            //     title: "更新",
            //     width: 250,
            //     height: 180,
            //     transparent: true,
            //     alwaysOnTop: true,
            //     decorations: false,
            //     shadow: false,
            //     resizable: false,
            //     skipTaskbar: true,
            //     visible: false,
            //     maximizable: false
            // })
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