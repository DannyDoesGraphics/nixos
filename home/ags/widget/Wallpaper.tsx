import { App, Astal, Gtk, Gdk } from "astal/gtk4"
import { Variable, exec, execAsync, bind, writeFile } from "astal"

interface ImageSample {
    path: string
    sampleCount: number
    lastSampled: number
}

class WeightedImageSampler {
    private images: Map<string, ImageSample> = new Map()
    private totalSamples: number = 0
    private isLoaded: boolean = false
    private onLoadedCallbacks: (() => void)[] = []
    
    constructor() {
        this.loadImages()
    }
    
    private async loadImages() {
        try {
            // Get home directory first
            const homeDir = await execAsync("sh -c 'echo $HOME'")
            const wallpaperDir = `${homeDir.trim()}/Pictures/Wallpapers`
            
            // Check if directory exists first
            try {
                await execAsync(`test -d "${wallpaperDir}"`)
            } catch {
                console.log(`Wallpaper directory ${wallpaperDir} does not exist`)
                return
            }
            
            // Find image files
            const output = await execAsync(`find "${wallpaperDir}" -maxdepth 1 -type f \\( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.webp" -o -iname "*.bmp" -o -iname "*.tiff" \\)`)
            const imageFiles = output.trim().split('\n').filter(path => path.length > 0)
            
            // Clear existing images and add new ones
            this.images.clear()
            for (const fullPath of imageFiles) {
                this.images.set(fullPath, {
                    path: fullPath,
                    sampleCount: 0,
                    lastSampled: 0
                })
            }
            
            console.log(`Loaded ${this.images.size} wallpaper images`)
            this.isLoaded = true
            
            // Trigger callbacks when loaded
            this.onLoadedCallbacks.forEach(callback => callback())
            this.onLoadedCallbacks = []
            
        } catch (error) {
            console.error("Error loading wallpaper images:", error)
        }
    }
    
    public onLoaded(callback: () => void) {
        if (this.isLoaded) {
            callback()
        } else {
            this.onLoadedCallbacks.push(callback)
        }
    }
    
    private calculateWeight(image: ImageSample): number {
        // Base weight inversely proportional to sample count
        const baseWeight = 1 / (image.sampleCount + 1)
        
        // Time decay factor - older samples get higher weight
        const timeSinceLastSample = this.totalSamples - image.lastSampled
        const timeWeight = Math.log(timeSinceLastSample + 1) + 1
        
        return baseWeight * timeWeight
    }
    
    // Efraimidis-Spirakis algorithm implementation
    public sampleNext(): string | null {
        if (this.images.size === 0) return null
        
        let maxKey = -Infinity
        let selectedImage: ImageSample | null = null
        
        for (const [path, image] of this.images) {
            const weight = this.calculateWeight(image)
            const key = Math.pow(Math.random(), 1 / weight)
            
            if (key > maxKey) {
                maxKey = key
                selectedImage = image
            }
        }
        
        if (selectedImage) {
            // Update sampling statistics
            selectedImage.sampleCount++
            selectedImage.lastSampled = this.totalSamples
            this.totalSamples++
            
            console.log(`Selected wallpaper: ${selectedImage.path} (sampled ${selectedImage.sampleCount} times)`)
            return selectedImage.path
        }
        
        return null
    }
    
    public async refreshImages() {
        await this.loadImages()
    }
}

// Global sampler instance
const imageSampler = new WeightedImageSampler()

// Initialize with the first wallpaper immediately, then poll for changes
const currentWallpaper = Variable<string>("")

// Function to update wallpaper by applying CSS directly to the App
const updateWallpaperCSS = async (path: string) => {
    const css = path ? `
        window.Wallpaper .wallpaper-container {
            background: #2e3440 url('file://${path}');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
        }
    ` : `
        window.Wallpaper .wallpaper-container {
            background: #2e3440;
        }
    `
    
    try {
        // Apply CSS directly to the App instance
        // Since we don't know the exact method name, let's try the most common ones
        if (App && typeof (App as any).apply_css === 'function') {
            (App as any).apply_css(css)
            console.log(`Applied wallpaper CSS directly for: ${path}`)
        } else if (App && typeof (App as any).addCss === 'function') {
            (App as any).addCss(css)
            console.log(`Added wallpaper CSS for: ${path}`)
        } else if (App && typeof (App as any).css === 'function') {
            (App as any).css(css)
            console.log(`Set wallpaper CSS for: ${path}`)
        } else {
            // Fallback: log available methods for debugging
            console.log(`App object keys:`, Object.keys(App))
            console.log(`App prototype keys:`, Object.getOwnPropertyNames(Object.getPrototypeOf(App)))
            
            // Write CSS to a temporary file as fallback
            const tmpCssFile = `/tmp/ags-wallpaper-${Date.now()}.css`
            await writeFile(tmpCssFile, css)
            console.log(`Wrote wallpaper CSS to temp file for: ${path}`)
        }
    } catch (error) {
        console.error("Failed to update wallpaper CSS:", error)
    }
}

// Set initial wallpaper as soon as images are loaded
imageSampler.onLoaded(async () => {
    const initialImage = imageSampler.sampleNext()
    if (initialImage) {
        currentWallpaper.set(initialImage)
        await updateWallpaperCSS(initialImage)
        console.log(`Initial wallpaper set: ${initialImage}`)
    }
})

// Poll for wallpaper changes every 60 seconds
currentWallpaper.poll(60 * 1000, async () => {
    const nextImage = imageSampler.sampleNext()
    const newWallpaper = nextImage || currentWallpaper.get()
    await updateWallpaperCSS(newWallpaper)
    return newWallpaper
})

// Refresh images periodically (check for new files every 5 minutes)
const imageRefresher = Variable("").poll(300000, async () => {
    await imageSampler.refreshImages()
    return ""
})

export default function Wallpaper(gdkmonitor: Gdk.Monitor) {
    const { TOP, LEFT, RIGHT, BOTTOM } = Astal.WindowAnchor

    return <window
        cssName="Wallpaper"
        gdkmonitor={gdkmonitor}
        exclusivity={Astal.Exclusivity.IGNORE}
        anchor={TOP | LEFT | RIGHT | BOTTOM}
        layer={Astal.Layer.BACKGROUND}
        keymode={Astal.Keymode.NONE}
        child={
            <box
                cssName="wallpaper-container"
            />
        }
    />
}
