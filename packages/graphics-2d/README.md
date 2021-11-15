# @pixano/graphics-2d

Set of web components for image and video annotations.

## Installation

```bash
npm install @pixano/graphics-2d
```
Include with a module bundler like [rollup](http://rollupjs.org/) or [webpack](https://webpack.github.io/) using ES6 modules:

```javascript
// import all 2d elements
import "@pixano/graphics-2d";
// or a specific element
import "@pixano/graphics-2d/lib/pxn-rectangle";
```
The [UMD](https://github.com/umdjs/umd) build is also available on [unpkg](http://unpkg.com/):
```html
<script src="https://unpkg.com/@pixano/graphics-2d/dist/graphics-2d.min.js"></script>
```

## Example: Rectangle annotation

Example usage:
```javascript
import { css, html, LitElement} from 'lit-element';
import '@pixano/graphics-2d';

const colors = [
  'blue', 'green', 'purple',
  'yellow', 'pink', 'orange', 'tan'
];

class MyDemoRectangle extends LitElement {

  onCreate(evt) {
    // listening to the create event dispatched
    // by the element to assign a nice color to
    // the new rectangle.
    const newObj = evt.detail;
    newObj.color = colors[this.element.shapes.size % colors.length];
    this.element.mode = 'edit';
  }

  get element() {
    // Utility getter of the element
    return this.shadowRoot.querySelector('pxn-rectangle');
  }

  render() {
    // Render the template with the rectangle element
    // enriched with some buttons to interact with it.
    return html`
    <pxn-rectangle image="image.jpg" @create=${this.onCreate}></pxn-rectangle>
    <div>
        <button @click=${() => this.element.mode = 'create'}>Add</button>
        <button @click=${() => this.element.zoomIn()}>+</button>
        <button @click=${() => this.element.zoomOut()}>-</button>
    </div>`;
  }
}

customElements.define('my-demo-rectangle', MyDemoRectangle);
```

## API

### Properties/Attributes

#### pxn-canvas

| Name             | Type           | Default  | Description
| ---------------- | -------------- | -------- |------------
| `image`          | `string|null` | `null `  | Sets the image url to be rendered on canvas.
| `input`          | `string|string[]` | `null `  | Sets the image url(s) to be rendered on canvas.
| `hideLabels`     | `boolean`      | `false`  | When `true`, hides the label layer.
| `color`          | `string `      | `#f3f3f5`| Background color
| `zoom`           | `number`       | `0.95`(readonly) | Zoom value

#### pxn-canvas-2d

Note: `pxn-canvas-2d` inherits from `pxn-canvas`.

| Name        | Type                | Default  | Description
| ----------- | ------------------- | -------- |------------
| `mode`      | `InteractionMode*`  | `edit `  | Sets the canvas interaction mode. Use `none` for no interactions at all.
| `shapes`    | `ShapeData**[]` | `[] `  | Sets the canvas shapes to be displayed.
| `selectedShapeIds` | `string[]`   | `[]` | List of selected shape ids
| `enableOutsideDrawing` | `boolean` | `false` | Enable 2d shape drawing outside of image bounds

*InteractionMode depends on the element:
```ts
// pxn-rectangle | pxn-polygon | pxn-graph
type InteractiveMode =  'edit' | 'create' | 'none';

// pxn-segmentation
type InteractiveMode =  'edit' | 'create' | 'create-brush' | 'none';

// pxn-smart-rectangle
type InteractiveMode =  'edit' | 'create' | 'smart-create' | 'none';


// pxn-smart-segmentation
type InteractiveMode =  'edit' | 'create' | 'create-brush' | 'smart-create' | 'none';
```

**The 2d shapes have the following format:
```ts
// 2d shape
interface ShapeData {
  // unique id
  id: string;
  // geometry of the shape
  geometry: Geometry;
  // optional color to be displayed
  color?: string;
  // category string for smart elements
  // that automatically assign category
  category?: string;
}

// 2d shape generic geometry format
interface Geometry {
  // flatten array of geometry normalized vertices
  // e.g. rectangle: [x_left, y_top, x_right, y_bottom]
  // e.g. polygon: [x1, y1, x2, y2, ...]
  // e.g. multi_polygon: []
  vertices: number[];
  // edges: [[0,1],[0,2]...]
  edges?: [number, number][];
  // edges: [true,false...]
  visibles?: boolean[];
  // geometry type: rectangle | polygon | multi_polygon
  type: GeometryType;
  // dimension
  dim?: number;
  // in case of multi polygon
  // array of array of vertices
  // e.g. multi_polygon: [[x1, y1, x2, y2...], [x'1, y'1, ...]]
  mvertices?: number[][];
}

type GeometryType = 'rectangle' | 'polygon' | 'multi_polygon';
```


#### pxn-rectangle

Note: `pxn-rectangle` inherits from `pxn-canvas-2d` so all properties in `pxn-canvas-2d` will be available on `pxn-rectangle`.

#### pxn-polygon

Note: `pxn-polygon` inherits from `pxn-canvas-2d` so all properties in `pxn-canvas-2d` will be available on `pxn-polygon`.

| Name             | Type      | Default  | Description
| ---------------- | --------- | -------- |------------
| `isOpenedPolygon`| `Boolean` | `false ` | Whether to open polygon into polylines

#### pxn-segmentation

Note: `pxn-segmentation` inherits from `pxn-canvas` so all properties in `pxn-canvas` will be available on `pxn-segmentation`.

| Name             | Type           | Default  | Description
| ---------------- | -------------- | -------- |------------
| `mask`           | `ImageData*|null` | `null `  | Segmentation mask to be drawn
| `mode`           | `select | update | create | none` | `select` | Sets the canvas interaction mode. Use `none` for no interactions at all.
| `maskVisuMode`   | `SEMANTIC|INSTANCE` | `SEMANTIC` | Display of colors by class (use given map class <=> color) or instance (random color based on instance index)
| `showroi` | `boolean` | `false` | Show ROI helper when creating a new mask instance.

*The mask is stored as an ImageData:
```ts
interface ImageData {
  // Data contains the ImageData object's pixel data. it is stored as a one-dimensional array in the RGBA order, with integer values between 0 and 255 (inclusive).
  // Here [R, G, B, A] correspond to:
  // R: instance index from 1 to 255 (0 is for background or semantic classes)
  // G: additional instance index if #instances > 255 (often equals to 0)
  // B: class index
  // E.g.: Person class corresponds to idx 2 / Car of idx 3
  // All the pixels of a new person A will have a [1, 0, 2] value
  // All the pixels of a new car B will have a [2, 0, 3] value
  // All the pixels of a new person C will have a [3, 0, 2] value
  data: Uint8ClampedArray;
  height: number;
  width: number;
}
```

It can be read using the following python script:
```python
import json
import base64
import cv2
import numpy as np

def readb64(uri):
  encoded_data = uri.split(',')[1]
  nparr = np.fromstring(base64.b64decode(encoded_data), np.uint8)
  img = cv2.imdecode(nparr, cv2.IMREAD_UNCHANGED)
  return img

def writeb64(img):
    retval, buffer = cv2.imencode('.png', img)
    pic_str = base64.b64encode(buffer)
    pic_str = pic_str.decode()
    return pic_str

# assuming you stored the mask in a json file of the following structure
# { annotations: [{mask: "data:image/png;base64,iVBORw0KGgoAA..."}]}
with open(filename, 'r') as f:
  annotations = json.load(f)["annotations"]
for ann in annotations:
  mask = readb64(ann["mask"])
  print(mask.shape)
  # should be (height,width,3)
  # corresponding to [id1, id2, classIdx]
  # id1 and id2 are zeros in case of semantic segmentation

```

#### pxn-smart-rectangle

Note: `pxn-smart-rectangle` inherits from `pxn-rectangle` so all properties in `pxn-rectangle` will be available on `pxn-smart-rectangle`. Its additional interaction mode consists in clicking on a pixel in the image cropping its context of given size and automatically generate the best fitted box in the area. Detector used is SSD mobilenet trained on MsCOCO. Generated boxes are assigned MsCOCO's categories.

| Name             | Type           | Default  | Description
| ---------------- | -------------- | -------- |------------
| `scale`          | `number`       | `1`      | Scaling factor from the base ROI used by the detector (256) to crop the image from

#### pxn-graph

Note: `pxn-graph` inherits from `pxn-canvas-2d` so all properties in `pxn-canvas-2d` will be available on `pxn-graph`. Additional properties are available:
| Name                 | Type           | Default  | Description
| -------------------- | -------------- | -------- |------------
| `graphType`          | `GraphSettings`| `defaultSkeleton`      | Skeleton structure

```ts
export interface IGraphSettings {
  radius: number;
  // Set list of node colors or empty if all take the shape color
  nodeColors: number[];
  // Set one color for all edges or same as nodes
  edgeColorType: "default" | "node";
  // Set skeleton #keypoints with their names
  vertexNames: string[];
  // Set skeleton links between its vertices
  edges: [number, number][];
  // Display node names during creation and edition
  showVertexName: boolean;
}

const defaultSkeletonSettings = {
  radius: 4,
  nodeColors: [
    0Xe6194b, 0X3cb44b, 0Xffe119, 0X4363d8, 0Xf58231, 0X911eb4,
    0X46f0f0, 0Xf032e6, 0Xbcf60c, 0Xfabebe, 0X008080, 0Xe6beff,
    0X9a6324, 0Xfffac8, 0X800000, 0Xaaffc3, 0X808000, 0Xffd8b1,
    0X000075, 0X808080, 0Xffffff, 0X000000
  ],
  edgeColorType: "node",
  edges: [[0,1], [0,2]],
  vertexNames: ['header', 'RFoot', 'LFoot'],
  showVertexName: true
};
```

### Methods

#### pxn-canvas

| Name               | Description       |
| ------------------ | ----------------- |
| `zoomIn() => void` | Zoom in   |
| `zoomOut() => void`| Zoom out |
| `fullScreen() => void` | Fullscreen |

#### pxn-canvas-2d

Note: `pxn-canvas-2d` inherits from `pxn-canvas`.

#### pxn-rectangle

Note: `pxn-rectangle` inherits from `pxn-canvas-2d` so all methods in `pxn-canvas-2d` will be available on `pxn-rectangle`.

#### pxn-polygon

Note: `pxn-polygon` inherits from `pxn-canvas-2d` so all methods in `pxn-canvas-2d` will be available on `pxn-polygon`.

| Name               | Description             |
| ------------------ | ----------------------- |
| `merge() => void`  | Merge selected shapes   |
| `split() => void`  | Split selected shape    |

#### pxn-segmentation

Note: `pxn-segmentation` inherits from `pxn-canvas` so all methods in `pxn-canvas` will be available on `pxn-segmentation`.

| Name                    | Description             |
| ----------------------- | ----------------------- |
| `setOpacity() => void`  | Set mask opacity [0,1]  |
| `filterLittle(numPixels: number = 10) => void`| Filter isolated regions containing less than given number of pixels  |

#### pxn-smart-rectangle

Note: `pxn-smart-rectangle` inherits from `pxn-rectangle` so all methods in `pxn-rectangle` will be available on `pxn-smart-rectangle`.

| Name               | Description       |
| ------------------ | ----------------- |
| `roiDown() => void` | Scale up ROI  |
| `roiUp() => void`| Scale down ROI |

### Events

#### pxn-canvas

None

#### pxn-canvas-2d

| Event Name | Detail              | Description
| ---------- | ------------------- | -----------
| `create`   | `ShapeDataDetail`   | Fired when a shape has been created.
| `update`   | `ShapeDataIdxDetail`| Fired when a shapes update has been made.
| `delete`   | `ShapeDataIdxDetail`| Fired when shapes are deleted. Detail is the list of the deleted shape ids.
| `selection`| `ShapeDatasDetail`  | Fired when shapes are selected.
| `mode`     | `ModeDetail`        | Fired when user interaction mode changed

```ts
interface ShapeDataDetail {
  detail: ShapeData;
}

interface ShapeDatasDetail {
  detail: ShapeData[];
}

interface ShapeDataIdxDetail {
  detail: string[];
}

interface ModeDetail {
  detail: InteractionMode;
}
```

### Shortcuts

#### pxn-canvas

| Key          | Description      |
| ------------ | ---------------- | 
| `m`          | `Darken   image` |
| `p`          | `Brighten image` |
| `Ctrl+C`     | `Copy in clipboard currently selected shapes/instance` |
| `Ctrl+V`     | `Create new shapes/instance (with new ids) from the clipboard content` |
| `Ctrl+Space` | `Toggle labels (hide / show)` |
| `Tab`        | `Loop throught the scene shapes/instances` |

#### pxn-canvas-2d

| Key          | Description      |
| ------------ | ---------------- | 
| `Escape`     | `Unselect shapes` |
| `Delete`     | `Delete selected shapes` |


#### segmentation / controller-mask

| Key          | Description      |
| ------------ | ---------------- | 
| `Escape`     | `Unselect instance` |
| `Delete`     | `Delete selected instance` |
