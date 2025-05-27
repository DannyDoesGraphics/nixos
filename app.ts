import { App } from "astal/gtk3"
import Bar from "./widget/Bar"

App.start({
    main() {
        Bar(0)
        Bar(1) // instantiate for each monitor
    },
})