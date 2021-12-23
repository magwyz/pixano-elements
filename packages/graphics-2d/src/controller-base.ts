/**
 * Base controller class to use for interaction modes (create a bounding box, edit a polygon, etc...)
 * @copyright CEA-LIST/DIASI/SIALV/LVA (2019)
 * @author CEA-LIST/DIASI/SIALV/LVA <pixano@cea.fr>
 * @license CECILL-C
 */

export abstract class Controller extends EventTarget {

	protected _activated: boolean = false;
	activate() {
		// this.deactivate();
		this._activated = true;
	};
	deactivate() {
		this._activated = false;
	};
	// Reset interaction mode
	public reset() {
		this.deactivate();
		this.activate();
	}
	/**
	 * Event dispatcher.
	 * If you want to overwrite with parent dispatchEvent, do not forget
	 * to pass dispatchEvent to constructor
	 * @param type Custom Event type name
	 * @param detail Content
	 */
	public emit(type: string, detail: any) {
		this.dispatchEvent(new CustomEvent(type, { detail }));
	}

	constructor(props: Partial<EventTarget> = {}) {
		super();
		this.dispatchEvent = props.dispatchEvent || this.dispatchEvent;
	}
}