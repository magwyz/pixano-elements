/**
 * @copyright CEA-LIST/DIASI/SIALV/LVA (2019)
 * @author CEA-LIST/DIASI/SIALV/LVA <pixano@cea.fr>
 * @license CECILL-C
 */


/**
 * Convert a hex color number into an [R, G, B] array
 * @param hex hexadecimal color number
 */
export const hexToRgb255 = (hex: number) => {
	const out = [0, 0, 0];
	out[0] = (hex >> 16 & 0xFF);
	out[1] = (hex >> 8 & 0xFF);
	out[2] = (hex & 0xFF);
	return out;
}

/**
 * Convert an [R, G, B] array to hex color number
 * @param rgb [R, G, B] array
 */
export function rgb2hex(rgb: number[]): number {
	return ((rgb[0] * 255 << 16) + (rgb[1] * 255 << 8) + rgb[2] * 255);
}

/**
 * Get normalized bounding box encompassing the shape.
 * Return [xmin,ymin,xmax,ymax]
 */
export function bounds(vertices: number[]) {
	let xMin = 1;
	let xMax = 0;
	let yMin = 1;
	let yMax = 0;
	vertices.forEach((c, idx) => {
		if (idx % 2 === 0) {
			if (c < xMin) xMin = c;
			if (c > xMax) xMax = c;
		} else {
			if (c < yMin) yMin = c;
			if (c > yMax) yMax = c;
		}
	});
	return [xMin, yMin, xMax, yMax];
}

/**
 * Insert a node into a flatten array of vertices
 * @param vertices flatten array of vertices
 * @param idx index of insertion
 */
export function insertMidNode(vertices: number[], idx: number): number[] {
	const midIdx = (idx + 1 + vertices.length) % vertices.length;
	return [
		...vertices.slice(0, midIdx * 2),
		(0.5 * (vertices[2 * idx] + vertices[2 * midIdx])),
		(0.5 * (vertices[2 * idx + 1] + vertices[2 * midIdx + 1])),
		...vertices.slice(midIdx * 2)
	];
}

// Check if the boundingbox g is included in s
export function isIncludedRect(g: number[], s: number[]) {
	const xminG = g[0];
	const yminG = g[1];
	const xmaxG = g[2];
	const ymaxG = g[3];
	const xminS = s[0];
	const yminS = s[1];
	const xmaxS = s[2];
	const ymaxS = s[3];
	if (xminG > xminS && xmaxG < xmaxS && yminG > yminS && ymaxG < ymaxS) {
		return true;
	} else {
		return false;
	}
}

export function chunk(arr: number[], chunkSize: number): number[][] {
	const chunkedArr: number[][] = [];
	for (const el of arr) {
		const last = chunkedArr[chunkedArr.length - 1];
		if (!last || last.length === chunkSize) {
			chunkedArr.push([el]);
		} else {
			last.push(el);
		}
	}
	return chunkedArr;
}


///////////// Polygon utils functions

/**
 * Check intersection of two lines.
 * @param a x of point 1 of line 1
 * @param b y of point 1 of line 1
 * @param c x of point 2 of line 1
 * @param d y of point 2 of line 1
 * @param p x of point 1 of line 2
 * @param q y of point 1 of line 2
 * @param r x of point 2 of line 2
 * @param s y of point 2 of line 2
 * returns: true iff the line from (a,b)->(c,d) intersects with (p,q)->(r,s)
 */
function intersects(a: number, b: number, c: number, d: number, p: number, q: number, r: number, s: number): boolean {
	const det = (c - a) * (s - q) - (r - p) * (d - b);
	if (det === 0) {
		return false;
	} else {
		const lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
		const gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
		return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
	}
};

/**
 * Check if polygon self intersects
 * TODO: implement Shamos-Hoey (faster)
 * @param inputVertices flatten array of 2d vertices
 */
export const isValid = (inputVertices: number[]) => {
	const vertices = chunk(inputVertices, 2);
	for (const [idx, value] of vertices.entries()) {
		const nextIdx = (idx + 1) % vertices.length;
		for (const [idx2, value2] of vertices.entries()) {
			if (idx2 === idx) continue;
			const nextIdx2 = (idx2 + 1) % vertices.length;
			if (idx2 === nextIdx || nextIdx2 === idx) {
				continue;
			}
			const inter = intersects(value[0],
				value[1],
				vertices[nextIdx][0],
				vertices[nextIdx][1],
				value2[0],
				value2[1],
				vertices[nextIdx2][0],
				vertices[nextIdx2][1]);
			if (inter) {
				return false;
			}
		}
	}
	return true;
}

