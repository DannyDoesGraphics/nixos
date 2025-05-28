import { App, Astal, Gtk, Gdk } from "astal/gtk3"
import { Variable, exec, execAsync, bind } from "astal"
import Hyprland from "gi://AstalHyprland"
import Wp from "gi://AstalWp"

const hyprland = Hyprland.get_default()
const audio = Wp.get_default()

// Time with microsecond precision  
const time = Variable("").poll(60 * 1000, () => {
    const now = new Date()
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    const day = days[now.getDay()]
    const month = months[now.getMonth()]
    const date = now.getDate()
    const hours = now.getHours().toString().padStart(2, '0')
    const minutes = now.getMinutes().toString().padStart(2, '0')

    return `${day} ${month} ${date} ${hours}:${minutes}`
})

// Active workspace using Hyprland API
const activeWorkspace = Variable(hyprland.get_focused_workspace()?.get_id() || 1)

// Update active workspace when it changes
function updateActiveWorkspace() {
    const workspace = hyprland.get_focused_workspace()
    if (workspace) {
        activeWorkspace.set(workspace.get_id())
    }
}

// Workspaces with windows using Hyprland API
const workspacesWithWindows = Variable<number[]>([])

function updateWorkspaces() {
    const workspaces = hyprland.get_workspaces()
    const activeWs = hyprland.get_focused_workspace()?.get_id() || 1
    
    // Get workspaces that have windows
    const workspacesWithWins = workspaces
        .filter((ws: any) => ws.get_clients().length > 0)
        .map((ws: any) => ws.get_id())
    
    // Always include the active workspace even if it has no windows
    const allWorkspaces = [...new Set([...workspacesWithWins, activeWs])]
    
    workspacesWithWindows.set(allWorkspaces.sort((a: number, b: number) => a - b))
}

// Active window using Hyprland API
const activeWindow = Variable("")

function updateActiveWindow() {
    const client = hyprland.get_focused_client()
    if (client && client.get_title()) {
        activeWindow.set(client.get_title())
    } else {
        const workspace = hyprland.get_focused_workspace()
        activeWindow.set(`Workspace ${workspace?.get_id() || 1}`)
    }
}
// initial update 
updateActiveWorkspace()
updateActiveWindow()
updateWorkspaces()

// Listen for all relevant events
hyprland.connect("event", (_: any, event: string, data: string) => {
    if (event === "workspace") {
        // Parse workspace ID from event data (format: "workspace>>ID")
        const workspaceId = parseInt(data)
        if (!isNaN(workspaceId)) {
            activeWorkspace.set(workspaceId)
        }
        // Update workspaces and window info with retry logic
        retryUpdate(() => {
            updateWorkspaces()
            updateActiveWindow()
        })
    } else if (event === "focusedmon" || event === "activewindow") {
        // For these events, we need to query current state with retry
        retryUpdate(() => {
            updateActiveWorkspace()
            updateActiveWindow()
            updateWorkspaces()
        })
    }
})

// Robust retry function with exponential backoff
function retryUpdate(updateFn: () => void, maxRetries: number = 3, delay: number = 5) {
    let retries = 0
    
    function attempt() {
        try {
            const prevActiveWs = activeWorkspace.get()
            updateFn()
            
            // If workspace didn't change when we expected it to, retry
            if (retries < maxRetries) {
                setTimeout(() => {
                    const newActiveWs = activeWorkspace.get()
                    if (prevActiveWs === newActiveWs && retries < maxRetries - 1) {
                        retries++
                        setTimeout(attempt, delay * Math.pow(2, retries))
                    }
                }, delay)
            }
        } catch (error) {
            if (retries < maxRetries) {
                retries++
                setTimeout(attempt, delay * Math.pow(2, retries))
            }
        }
    }
    
    attempt()
}

// System info
const cpuUsage = Variable("0%").poll(1000, () => {
    try {
        const output = exec("top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | cut -d'%' -f1")
        return `${Math.round(parseFloat(output))}%`
    } catch {
        return "0%"
    }
})

const memoryUsage = Variable("0%").poll(1000, () => {
    try {
        const output = exec("free | grep Mem | awk '{printf \"%.1f\", $3/$2 * 100.0}'")
        return `${output}%`
    } catch {
        return "0%"
    }
})

const audioVolume = Variable({icon: "", volume: "0%"}).poll(100, () => {
    try {
        let output = parseFloat(audio.default_speaker.volume);
        output = Math.round(output * 100); // Convert to percentage
        
        let icon = ""
        if (output === 0) {
            icon = "" // No volume
        } else if (output <= 33) {
            icon = "" // Low volume
        } else if (output <= 66) {
            icon = "" // Medium volume
        } else {
            icon = "" // High volume
        }
        
        return {icon: icon, volume: `${output}%`}
    } catch {
        return {icon: "", volume: "ERR%"}
    }
})

export default function Bar(gdkmonitor: Gdk.Monitor) {
    const { TOP, LEFT, RIGHT } = Astal.WindowAnchor

    return <window
        className="Bar"
        gdkmonitor={gdkmonitor}
        exclusivity={Astal.Exclusivity.EXCLUSIVE}
        anchor={TOP | LEFT | RIGHT}
        application={App}
        child={
            <centerbox
                startWidget={
                    <box halign={Gtk.Align.START} spacing={12} className="left">
                        <box 
                            className="workspaces"
                            spacing={0}
                            children={bind(workspacesWithWindows).as(workspaces => 
                                workspaces.map(id => (
                                    <button
                                        className={bind(activeWorkspace).as(active => active === id ? "workspace active" : "workspace")}
                                        onClicked={() => hyprland.dispatch("workspace", id.toString())}
                                        child={<label label={id.toString()} />}
                                    />
                                ))
                            )}
                        />
                        <label 
                            className="active-window"
                            label={bind(activeWindow)}
                        />
                    </box>
                }
                centerWidget={
                    <label 
                        halign={Gtk.Align.CENTER} 
                        className="clock"
                        label={bind(time)}
                    />
                }
                endWidget={
                    <box halign={Gtk.Align.END} spacing={8} className="right system-info">
                        <box className="cpu">
                            <label label="CPU " />
                            <label label={bind(cpuUsage)} />
                        </box>
                        <box className="memory">
                            <label label="MEM " />
                            <label label={bind(memoryUsage)} />
                        </box>
                        <button 
                            className="audio"
                            onClicked={() => execAsync("pavucontrol")}
                            child={
                                <box>
                                    <label label={bind(audioVolume).as(audio => audio.icon)} />
                                    <label label={bind(audioVolume).as(audio => ` ${audio.volume}`)} />
                                </box>
                            }
                        />
                    </box>
                }
            />
        }
    />
}
