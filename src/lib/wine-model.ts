// Runs the *actual* trained Random Forest (200 trees) exported from
// predictor/ml/wine_model.pkl. No dummy math — same StandardScaler mean/scale
// and same tree splits as the Django `model.predict` / `predict_proba` calls.

type LeafNode = [number, ...number[]]; // [-1, p0, p1, ...]
type InternalNode = [number, number, number, number]; // [feature, threshold, left, right]
type Node = LeafNode | InternalNode;
type Tree = Node[];

export interface WineModel {
  mean: number[];
  scale: number[];
  classes: number[];
  trees: Tree[];
}

let cache: Promise<WineModel> | null = null;

export function loadWineModel(): Promise<WineModel> {
  if (!cache) {
    cache = fetch("/wine_model.json").then((r) => {
      if (!r.ok) throw new Error(`Failed to load model: ${r.status}`);
      return r.json() as Promise<WineModel>;
    });
  }
  return cache;
}

function standardize(x: number[], mean: number[], scale: number[]): number[] {
  const out = new Array(x.length);
  for (let i = 0; i < x.length; i++) out[i] = (x[i] - mean[i]) / scale[i];
  return out;
}

function treePredictProba(tree: Tree, x: number[], nClasses: number): number[] {
  let i = 0;
  // Safety cap on depth
  for (let step = 0; step < 200; step++) {
    const node = tree[i];
    if (node[0] === -1) {
      // Leaf: probabilities were normalized at export time
      const probs = new Array(nClasses);
      for (let c = 0; c < nClasses; c++) probs[c] = (node as LeafNode)[c + 1] ?? 0;
      return probs;
    }
    const [f, th, l, r] = node as InternalNode;
    i = x[f] <= th ? l : r;
  }
  return new Array(nClasses).fill(1 / nClasses);
}

export function predictProba(model: WineModel, rawFeatures: number[]): number[] {
  const x = standardize(rawFeatures, model.mean, model.scale);
  const nClasses = model.classes.length;
  const sum = new Array(nClasses).fill(0);
  for (const tree of model.trees) {
    const p = treePredictProba(tree, x, nClasses);
    for (let c = 0; c < nClasses; c++) sum[c] += p[c];
  }
  const n = model.trees.length;
  return sum.map((v) => v / n);
}

export function predict(model: WineModel, rawFeatures: number[]): { classIndex: number; proba: number[] } {
  const proba = predictProba(model, rawFeatures);
  let best = 0;
  for (let i = 1; i < proba.length; i++) if (proba[i] > proba[best]) best = i;
  return { classIndex: model.classes[best], proba };
}
