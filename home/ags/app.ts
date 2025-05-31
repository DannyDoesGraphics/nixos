import { App } from "astal/gtk4"
import style from "./style.scss"
import Gtk4LayerShell from "gi://Gtk4LayerShell"
import Bar from "./widget/bar"

App.start({
    css: style,
    main() {
        // Initialize layer shell if available
        if (Gtk4LayerShell.is_supported()) {
            console.log("GTK4 Layer Shell is supported")
        } else {
            console.log("GTK4 Layer Shell is NOT supported")
        }
        
        // Create bar on all monitors
        App.get_monitors().map(Bar)
    },
})
