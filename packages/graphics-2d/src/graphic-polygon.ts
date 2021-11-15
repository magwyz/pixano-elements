/**
 * Implementations of 2 graphical shapes.
 * @copyright CEA-LIST/DIASI/SIALV/LVA (2019)
 * @author CEA-LIST/DIASI/SIALV/LVA <pixano@cea.fr>
 * @license CECILL-C
 */

import {
	Graphics as PIXIGraphics,
	Circle as PIXICircle, Polygon as PIXIPolygon
} from 'pixi.js';
import { Graphic } from './graphic';
import { observable } from '@pixano/core';
import { isValid } from './utils';
import { ShapeData } from './types';

/**
 * Polygon graphic.
 * If isOpened field is set to true, the polygon is left open.
 */
export class GraphicPolygon extends Graphic {

	public midnodes: PIXIGraphics[] = [];

	public nodes: PIXIGraphics[] = [];

	protected nodeListeners: Map<string, (evt: any) => void> = new Map();

	protected midnodeListeners: Map<string, (evt: any) => void> = new Map();

	constructor(args: any) {
		super(args);
		this.createNodes();
	}

	get lastXn() {
		return this.data.geometry.vertices[this.data.geometry.vertices.length - 2];
	}

	get lastYn() {
		return this.data.geometry.vertices[this.data.geometry.vertices.length - 1];
	}

	get lastX() {
		return this.data.geometry.vertices[this.data.geometry.vertices.length - 2] * this.scaleX;
	}

	get lastY() {
		return this.data.geometry.vertices[this.data.geometry.vertices.length - 1] * this.scaleY;
	}

	/**
	 * Is polygon actually a polyline
	 */
	get isOpen() {
		return this.data.geometry.isOpened;
	}

	addNodeListener(type: string, fn: (arg: any) => void) {
		this.nodeListeners.set(type, fn);
		this.applyNodeListeners();
	}

	addMidnodeListener(type: string, fn: (arg: any) => void) {
		this.midnodeListeners.set(type, fn);
		this.applyMidnodeListeners();
	}

	removeNodeListeners() {
		this.midnodeListeners.clear();
		this.nodeListeners.clear();
		this.applyMidnodeListeners();
		this.applyNodeListeners();
	}

	applyMidnodeListeners() {
		this.midnodes.forEach((n, idx) => {
			n.removeAllListeners();
			n.interactive = false;
			n.buttonMode = false;
			this.midnodeListeners.forEach((v, type) => {
				n.interactive = true;
				n.buttonMode = true;
				n.cursor = 'cell';
				n.on(type, (evt: any) => {
					evt.nodeIdx = idx;
					v(evt);
				});
			})
		});
	}

	applyNodeListeners() {
		this.nodes.forEach((n, idx) => {
			n.removeAllListeners();
			n.interactive = false;
			n.buttonMode = false;
			this.nodeListeners.forEach((v, type) => {
				n.interactive = true;
				n.buttonMode = true;
				n.cursor = 'grab';
				n.on(type, (evt: any) => {
					evt.nodeIdx = idx;
					v(evt);
				});
			})
		});
	}

	createNodes() {
		this.nodes = new Array(0.5 * this.data.geometry.vertices.length).fill(null).map(() => {
			const n = new PIXIGraphics();
			this.nodeContainer.addChild(n);
			return n;
		});
		this.midnodes =
			new Array(0.5 * this.data.geometry.vertices.length).fill(null).map(() => {
				const n = new PIXIGraphics();
				this.nodeContainer.addChild(n);
				return n;
			});
		this.applyNodeListeners();
		this.applyMidnodeListeners();
	}

	deleteNodes() {
		this.nodes.forEach((n) => { n.destroy(); this.nodeContainer.removeChild(n) });
		this.midnodes.forEach((n) => { n.destroy(); this.nodeContainer.removeChild(n) });
	}

	/**
	 * Draw hit polygon: for each poly point create point (+10px,+10px),
	 * then points (-10px,-10px).
	 * @param points polyline points
	 */
	getHitAreaForOpenPolygon(points: any[]) {
		const th = 10;
		return new PIXIPolygon(
			points.reduce((result, value, index) => {
				result.splice(index, 0, value - th)
				if (index % 2 === 0)
					result.splice(index + 1, 0, value + th);
				else
					result.splice(index + 2, 0, value + th);
				return result;
			}, [])
		);
	}

	draw() {
		let points = this.data.geometry.vertices.map((c, idx) => {
			if (idx % 2 === 0)
				return Math.round(c * this.scaleX);
			else
				return Math.round(c * this.scaleY);
		});
		if (!this.isOpen) {
			// closes the polygon by adding a last point equal to the first point
			points = points.concat([points[0], points[1]]);
		}
		this.area.clear();
		this.area.lineStyle(1, this.hex, 1, 0.5, true);
		if (this.data.geometry.vertices.length === 4) {
			this.area.moveTo(points[0], points[1]);
			this.area.lineTo(points[2], points[3]);
			if (this.isOpen) {
				this.area.hitArea = this.getHitAreaForOpenPolygon(points);
			}
		} else if (this.data.geometry.vertices.length > 4 && this.isOpen) {
			for (let i = 0; i <= this.data.geometry.vertices.length - 4; i = i + 2) {
				this.area.moveTo(points[i], points[i + 1]);
				this.area.lineTo(points[i + 2], points[i + 3]);
			}
			this.area.hitArea = this.getHitAreaForOpenPolygon(points);
		} else if (this.data.geometry.vertices.length > 4) {
			this.area.beginFill(this.hex, 0.15);
			this.area.drawPolygon(points);
			this.area.endFill();
		}
		this.box.clear();
		this.controls.forEach((n) => n.clear());
		if (this.nodes.length !== this.data.geometry.vertices.length * 0.5) {
			this.deleteNodes();
			this.createNodes();
		} else {
			this.nodes.forEach((n) => n.clear());
			this.midnodes.forEach((n) => n.clear());
		}

		this.controls.forEach((c) => {
			c.interactive = false;
			c.buttonMode = false;
		});
		if (this.state === 'box') {
			this.drawBox();
		} else if (this.state === 'contour' || this.state === 'nodes') {
			this.box.lineStyle(1, 0XFFFFFF, 1, 0.5, true);
			this.area.lineStyle(1, 0XFFFFFF, 1, 0.5, true);
			if (this.data.geometry.vertices.length === 4) {
				this.area.moveTo(points[0], points[1]);
				this.area.lineTo(points[2], points[3]);
			} else if (this.data.geometry.vertices.length > 4 && this.isOpen) {
				for (let i = 0; i <= this.data.geometry.vertices.length - 4; i = i + 2) {
					this.area.moveTo(points[i], points[i + 1]);
					this.area.lineTo(points[i + 2], points[i + 3]);
				}
			} else if (this.data.geometry.vertices.length > 4) {
				this.area.drawPolygon(points);
			}
			if (this.state === 'nodes') {
				// NB: setting/unsetting interactive does not
				// remove event listeners
				for (let i = 0; i < 0.5 * this.data.geometry.vertices.length; i++) {
					const x = this.data.geometry.vertices[i * 2];
					const y = this.data.geometry.vertices[i * 2 + 1];
					this.nodes[i].clear();
					this.nodes[i].beginFill(0xa6d8e7, 1);
					this.nodes[i].lineStyle(1, 0X426eff, 1, 0.5, true);
					this.nodes[i].drawCircle(0, 0, 4);
					this.nodes[i].x = Math.round(x * this.scaleX);
					this.nodes[i].y = Math.round(y * this.scaleY);
					this.nodes[i].endFill();
					this.nodes[i].scale.x = 1.5 / this.parent.parent.scale.x;
					this.nodes[i].scale.y = 1.5 / this.parent.parent.scale.y;
					this.midnodes[i].interactive = true;
					this.midnodes[i].buttonMode = true;
					this.midnodes[i].beginFill(0x000000, 1);
					this.midnodes[i].lineStyle(1, this.hex, 1, 0.5, true);
					const xm = (0.5 * (points[2 * i] + points[2 * i + 2]));
					const ym = (0.5 * (points[2 * i + 1] + points[2 * i + 3]));
					this.midnodes[i].drawCircle(0, 0, 3);
					this.midnodes[i].hitArea = new PIXICircle(0, 0, 4);
					this.midnodes[i].x = xm;
					this.midnodes[i].y = ym;
					this.midnodes[i].visible = true;
					this.midnodes[i].endFill();
					this.midnodes[i].cursor = 'cell';
					this.midnodes[i].scale.x = 1.5 / this.parent.parent.scale.x;
					this.midnodes[i].scale.y = 1.5 / this.parent.parent.scale.y;
				}
			}
		} else {
			this.nodeContainer.interactive = false;
			this.nodes.forEach((c) => c.interactive = false);
			this.controls.forEach((c) => c.interactive = false);
		}
	}

	public isValid(): boolean {
		if (this.isOpen && this.data.geometry.vertices.length > 3) return true;
		if (this.data.geometry.vertices.length < 6) return false;
		if (!isValid(this.data.geometry.vertices)) {
			return false;
		} else {
			const bounds = this.bounds;
			if ((bounds[3] - bounds[1]) * this.scaleY < 1
				|| (bounds[2] - bounds[0]) * this.scaleX < 1) {
				return false;
			}
		}
		return true;
	}

	public insertMidNode(idx: number) {
		const midIdx = (idx + 1 + this.data.geometry.vertices.length) % this.data.geometry.vertices.length;
		this.data.geometry.vertices = [
			...this.data.geometry.vertices.slice(0, midIdx * 2),
			(0.5 * (this.data.geometry.vertices[2 * idx] + this.data.geometry.vertices[2 * midIdx])),
			(0.5 * (this.data.geometry.vertices[2 * idx + 1] + this.data.geometry.vertices[2 * midIdx + 1])),
			...this.data.geometry.vertices.slice(midIdx * 2)
		];
	}

	public pushNode(x: number, y: number) {
		// check no duplicate
		for (const [idx, c] of this.data.geometry.vertices.slice(0, this.data.geometry.vertices.length - 2)
			.entries()) {
			if (idx % 2 === 0 &&
				Math.round(c * this.scaleX) === Math.round(x * this.scaleX)) {
				if (Math.round(this.data.geometry.vertices[idx + 1] * this.scaleY) ===
					Math.round(y * this.scaleY)) {
					console.warn('Same location. Abort.');
					return;
				}
			}
		}
		this.data.geometry.vertices = [...this.data.geometry.vertices, x, y];
	}

	/**
	 * Remove ultimate or penultimate node
	 * @param isLast is ultimate
	 */
	public popNode(isLast: boolean = true) {
		if (isLast) {
			this.data.geometry.vertices = this.data.geometry.vertices.slice(0, -2);
		} else {
			this.data.geometry.vertices = [
				...this.data.geometry.vertices.slice(0, -4),
				...this.data.geometry.vertices.slice(-2)
			]
		}
	}

	public removeNode(idx: number) {
		this.data.geometry.vertices = [
			...this.data.geometry.vertices.slice(0, idx * 2),
			...this.data.geometry.vertices.slice(idx * 2 + 2)
		]
	}
}

/**
 * Multi-polygon graphic (e.g. when object is split in the image)
 */
export class GraphicMultiPolygon extends Graphic {

	private subShapes: GraphicPolygon[] = [];

	constructor(data: ShapeData) {
		super(data);
		data.geometry.mvertices!.forEach((sub, _) => {
			const newSub = { ...data, geometry: { vertices: sub, type: 'polygon' }, id: data.id };
			const shape = new GraphicPolygon(observable(newSub));
			this.subShapes.push(shape);
			this.area.addChild(shape);
		});
	}

	onChange(prop: string) {
		if (prop === 'color') {
			this.updateColorHex();
			this.draw();
		}
	}

	draw() {
		this.subShapes.forEach((s) => {
			s.state = this.state === 'none' ? 'none' : 'contour';
			s.scaleX = this.scaleX;
			s.scaleY = this.scaleY;
			s.data.color = this.data.color;
			s.draw();
		});
	}
}
