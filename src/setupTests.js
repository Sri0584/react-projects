import "@testing-library/jest-dom";
// Fix for JSDOM missing createRange
global.document.createRange = () => ({
	setStart: () => {},
	setEnd: () => {},
	commonAncestorContainer: {
		nodeName: "BODY",
		ownerDocument: document,
	},
});
// Fix for JSDOM missing getSelection
global.document.getSelection = () => ({
	removeAllRanges: () => {},
	addRange: () => {},
});
// Fix for JSDOM missing MutationObserver
global.MutationObserver = class {
	constructor(callback) {}
	disconnect() {}
	observe(element, initObject) {}
	takeRecords() {
		return [];
	}
};
