use std::{cmp::Ordering, collections::{BinaryHeap, HashMap, HashSet}, env, path::PathBuf};
use anyhow::{Context, Result};
use rand::Rng;
use tokio::{fs, time::{Duration, interval}};

struct HeapItem {
    key: f64,
    path: PathBuf,
}

impl PartialEq for HeapItem {
    fn eq(&self, other: &Self) -> bool {
        self.key.eq(&other.key)
    }
}

impl Eq for HeapItem {}

impl PartialOrd for HeapItem {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        self.key.partial_cmp(&other.key)
    }
}

impl Ord for HeapItem {
    fn cmp(&self, other: &Self) -> Ordering {
        // Max-heap by key
        self.partial_cmp(other).unwrap()
    }
}

/// Collects only immediate files in the given directory
async fn collect_images(dir: &PathBuf) -> Result<Vec<PathBuf>> {
    let mut out = Vec::new();
    let mut rd = fs::read_dir(dir)
        .await
        .with_context(|| format!("reading dir {:?}", dir))?;
    while let Some(entry) = rd.next_entry().await? {
        let p = entry.path();
        if entry.file_type().await?.is_file() {
            if let Some(ext) = p.extension().and_then(|s| s.to_str()) {
                match ext.to_lowercase().as_str() {
                    "jpg" | "jpeg" | "png" | "bmp" | "gif" | "webp" | "tiff" | "tif" => out.push(p),
                    _ => {}
                }
            }
        }
    }
    Ok(out)
}

struct WeightedSampler {
    root: PathBuf,
    counts: HashMap<PathBuf, u64>,
    weights: HashMap<PathBuf, f64>,
    heap: BinaryHeap<HeapItem>,
    last: Option<PathBuf>,
}

impl WeightedSampler {
    fn calculate_weight(count: u64) -> f64 {
        let epsilon = 1.0;
        let base_initial_weight = 1.0;
        let t_over = 10.0;
        let lambda_decay = 0.5;
        let base_weight = base_initial_weight / ((count as f64) + epsilon);
        let penalty = if (count as f64) > t_over {
            (-lambda_decay * ((count as f64) - t_over)).exp()
        } else {
            1.0
        };
        (base_weight * penalty).max(0.000001)
    }

    /// Initialize sampler by reading current images
    async fn new(root: PathBuf) -> Result<Self> {
        let mut counts = HashMap::new();
        let mut weights = HashMap::new();
        let mut heap = BinaryHeap::new();

        let images = collect_images(&root).await?;
        for path in images {
            counts.insert(path.clone(), 0);
            let w = Self::calculate_weight(0);
            weights.insert(path.clone(), w);
            let u: f64 = rand::thread_rng().gen_range(0.0..1.0);
            let key = u.powf(1.0 / w);
            heap.push(HeapItem { key, path });
        }

        Ok(Self { root, counts, weights, heap, last: None })
    }

    /// Refresh the active set: remove deleted and include new images
    async fn refresh(&mut self) -> Result<()> {
        let current = collect_images(&self.root).await?;
        let set_current: HashSet<_> = current.iter().cloned().collect();

        // Remove stale
        self.counts.retain(|path, _| set_current.contains(path));
        self.weights.retain(|path, _| set_current.contains(path));

        // Add new
        for path in set_current.iter() {
            if !self.counts.contains_key(path) {
                self.counts.insert(path.clone(), 0);
                let w = Self::calculate_weight(0);
                self.weights.insert(path.clone(), w);
            }
        }

        // Rebuild heap
        self.heap.clear();
        for (path, &w) in &self.weights {
            let u: f64 = rand::thread_rng().gen_range(0.0..1.0);
            let key = u.powf(1.0 / w);
            self.heap.push(HeapItem { key, path: path.clone() });
        }

        Ok(())
    }

    /// Sample one image, never repeating the last selection
    pub async fn sample_one(&mut self) -> Result<PathBuf> {
        // Update to reflect file system changes
        self.refresh().await?;

        // Handle single-image case
        let chosen = if self.heap.len() <= 1 {
            self.heap.pop().context("sampling failed: heap empty")?
        } else {
            let first = self.heap.pop().context("sampling failed: heap empty")?;
            if self.last.as_ref().map(|p| p) == Some(&first.path) {
                let second = self.heap.pop().context("sampling failed: need second item")?;
                // Put the first back
                self.heap.push(first);
                second
            } else {
                first
            }
        };

        let path = chosen.path.clone();
        // Record last selection
        self.last = Some(path.clone());

        // Update count and weight for selected path
        let count = self.counts.get_mut(&path).unwrap();
        *count += 1;
        let new_w = Self::calculate_weight(*count);
        self.weights.insert(path.clone(), new_w);

        // Re-insert with new key
        let u: f64 = rand::thread_rng().gen_range(0.0..1.0);
        let new_key = u.powf(1.0 / new_w);
        self.heap.push(HeapItem { key: new_key, path: path.clone() });

        Ok(path)
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    let home = env::var("HOME").context("HOME env not set")?;
    let root = PathBuf::from(home).join("Pictures/Wallpapers");

    let mut sampler = WeightedSampler::new(root).await?;

    for _ in 1..50 {
        match sampler.sample_one().await {
            Ok(path) => println!("Chosen image: {}", path.display()),
            Err(e) => eprintln!("Error sampling image: {:?}", e),
        }
    }

    Ok(())
}
