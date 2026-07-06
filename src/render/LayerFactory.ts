export interface PixiLayerLike {
  sortableChildren: boolean;
  zIndex: number;
  children: Array<{ visible: boolean }>;
}

export interface PixiContainerLike {
  addChild(layer: PixiLayerLike): void;
}

export interface PixiLayerFactoryLike {
  Container: new () => PixiLayerLike;
}

export type LayerEntry<TName extends string = string> = readonly [TName, number];

export function createLayer(pixi: PixiLayerFactoryLike, zIndex: number): PixiLayerLike {
  const layer = new pixi.Container();
  layer.sortableChildren = true;
  layer.zIndex = zIndex;
  return layer;
}

export function createLayerSet<TName extends string>(
  pixi: PixiLayerFactoryLike,
  parent: PixiContainerLike,
  entries: Array<LayerEntry<TName>>,
): Record<TName, PixiLayerLike> {
  const layers = {} as Record<TName, PixiLayerLike>;
  for (const [name, zIndex] of entries) {
    const layer = createLayer(pixi, zIndex);
    layers[name] = layer;
    parent.addChild(layer);
  }
  return layers;
}

export function clearLayerSet(layerSet: Record<string, PixiLayerLike>): void {
  for (const layer of Object.values(layerSet)) {
    for (const child of layer.children) {
      child.visible = false;
    }
  }
}
