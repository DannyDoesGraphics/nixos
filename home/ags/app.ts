import { App } from "astal/gtk3"
import style from "./style.scss"
import Bar from "./widget/Bar"
import Wallpaper from "./widget/Wallpaper"

App.start({
    css: style,
    main() {
        App.get_monitors().map(Bar)
        App.get_monitors().map(Wallpaper)
    },
})
