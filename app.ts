import { App } from "astal/gtk3"

function Bar(gdkmonitor) {
    return <window gdkmonitor={gdkmonitor} />
}

function main() {
    for (const monitor of App.get_monitors()) {
        Bar(monitor)
    }
}

App.start({ main })