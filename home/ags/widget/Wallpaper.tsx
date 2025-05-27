import { App, Astal, Gtk, Gdk } from "astal/gtk3"
import { Variable, exec, execAsync, bind } from "astal"

interface ImageSample {
    path: string
    sampleCount: number
    lastSampled: number
}

class WeightedImageSampler {
    private images: Map<string, ImageSample> = new Map()
    private totalSamples: number = 0
    
    constructor() {
        this.loadImages()
    }
    
    private async loadImages() {
        try {
            // Get home directory first
            const homeDir = await execAsync("echo $HOME")
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
        } catch (error) {
            console.error("Error loading wallpaper images:", error)
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

// Current wallpaper path - change every 30 seconds
const currentWallpaper = Variable<string>("").poll(30000, async () => {
    const nextImage = imageSampler.sampleNext()
    return nextImage || ""
})

// Refresh images periodically (check for new files every 5 minutes)
const imageRefresher = Variable("").poll(300000, async () => {
    await imageSampler.refreshImages()
    return ""
})

export default function Wallpaper(gdkmonitor: Gdk.Monitor) {
    const { TOP, LEFT, RIGHT, BOTTOM } = Astal.WindowAnchor

    return <window
        className="Wallpaper"
        gdkmonitor={gdkmonitor}
        exclusivity={Astal.Exclusivity.IGNORE}
        anchor={TOP | LEFT | RIGHT | BOTTOM}
        layer={Astal.Layer.BACKGROUND}
        keymode={Astal.Keymode.NONE}
        child={
            <box
                className="wallpaper-container"
                css={bind(currentWallpaper).as(path => {
                    if (!path) return "background: #2e3440;"
                    return `
                        background-image: url('file://${path}');
                        background-size: cover;
                        background-position: center;
                        background-repeat: no-repeat;
                    `
                })}
            />
        }
    />
}
