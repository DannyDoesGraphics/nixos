import { App, Astal, Gtk, Gdk } from "astal/gtk4"
import GLib from "gi://GLib"

export default function Bar(monitor: Gdk.Monitor) {
    let timeLabel: any

    // Update the clock every second
    const updateClock = () => {
        if (timeLabel) {
            timeLabel.label = GLib.DateTime.new_now_local().format("%Y %b %d %H:%M:%S") || ""
        }
        return true
    }
    
    GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, updateClock)

    return (
        <window
            cssName="Bar"
            exclusivity={Astal.Exclusivity.EXCLUSIVE}
            anchor={Astal.WindowAnchor.TOP
                | Astal.WindowAnchor.LEFT
                | Astal.WindowAnchor.RIGHT}
            application={App}
            heightRequest={32}
            //marginTop={12}
            visible={true}
            child={
                <centerbox
                    centerWidget={
                        <label 
                            cssName="Clock"
                            label={GLib.DateTime.new_now_local().format("%Y %b %d %H:%M:%S") || ""}
                            setup={(self: any) => timeLabel = self}
                        />
                    }
                />
            }
        />
    )
}