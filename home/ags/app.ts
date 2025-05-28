import { App } from "astal/gtk4"
import style from "./style.scss"
import Bar from "./widget/Bar"
import Wallpaper from "./widget/Wallpaper"
// Import GTK4 layer shell to ensure it's loaded
import Gtk4LayerShell from "gi://Gtk4LayerShell"

App.start({
    css: style,
    main() {
        // Initialize layer shell if available
        if (Gtk4LayerShell.is_supported()) {
            console.log("GTK4 Layer Shell is supported")
        } else {
            console.log("GTK4 Layer Shell is NOT supported")
        }
        
        App.get_monitors().map(Bar)
        App.get_monitors().map(Wallpaper)
    },
})
