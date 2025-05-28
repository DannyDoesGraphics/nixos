import { Astal, Gdk } from "astal/gtk4"

export default function Wallpaper(gdkmonitor: Gdk.Monitor) {
    const { TOP, LEFT, RIGHT, BOTTOM } = Astal.WindowAnchor
    
    return <window
        cssName="Wallpaper"
        gdkmonitor={gdkmonitor}
        exclusivity={Astal.Exclusivity.IGNORE}
        anchor={TOP | LEFT | RIGHT | BOTTOM}
        layer={Astal.Layer.BACKGROUND}
        keymode={Astal.Keymode.NONE}
        visible={true}
        child={
            <box
                cssName="wallpaper-container"
                hexpand={true}
                vexpand={true}
            />
        }
    />
}
