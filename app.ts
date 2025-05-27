import Bar from "./widget/Bar"
import { App } from "astal/gtk3"

App.start({
    main() {
        Bar(0)
        Bar(1) // instantiate for each monitor
    },
});