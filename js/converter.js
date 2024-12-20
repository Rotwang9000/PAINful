class PAINConverter {
	static painToJson(painText) {
		const lines = painText.split("\n");
		const declarations = {};
		const relationships = [];
		let inRelationships = false;
		let currentArray = null;
		let currentArrayItems = [];
		let lastPath = null;

		// Helper to resolve relative path
		const resolvePath = (path, lastPath) => {
			if (path.startsWith('..')) {
				if (!lastPath) throw new Error('No previous path for relative notation');
				const parentParts = lastPath.split('.');
				return [...parentParts.slice(0, -1), path.slice(2)].join('.');
			}
			return path;
		};

		// Helper to set nested value
		const setNestedValue = (obj, path, value) => {
			const parts = path.split('.');
			let current = obj;
			for (let i = 0; i < parts.length - 1; i++) {
				current[parts[i]] = current[parts[i]] || {};
				current = current[parts[i]];
			}
			current[parts[parts.length - 1]] = value;
		};

		// Parse content
		for (const line of lines) {
			const trimmed = line.trim();

			// Handle section separator
			if (trimmed === "§") {
				inRelationships = true;
				continue;
			}

			if (!inRelationships) {
				// Parse declarations
				const match = trimmed.match(/^§(\d+)\s+(.+)$/);
				if (match) {
					declarations[match[1]] = match[2].trim();
				}
			} else {
				// Parse relationships
				if (trimmed.includes("=")) {
					// Handle assignment
					const [src, dest] = trimmed.split("=").map((x) => x.trim());
					
					// Handle relative path
					const resolvedSrc = resolvePath(src, lastPath);
					lastPath = resolvedSrc;

					// Parse source path
					const srcParts = resolvedSrc.split('.');
					const srcRefs = srcParts.map(part => {
						if (part.startsWith('§')) {
							return declarations[part.slice(1)];
						}
						return part;
					});

					// Get destination value
					const destId = dest.replace("§", "");
					const destValue = declarations[destId];

					relationships.push(["assign", srcRefs.join('.'), destValue]);
				} else if (trimmed.includes(":")) {
					// Start new array
					if (currentArray) {
						relationships.push(["array", currentArray, currentArrayItems]);
					}
					currentArray = declarations[trimmed.split(":")[0].replace("§", "")];
					currentArrayItems = [];
				} else if (trimmed.startsWith("§") && currentArray) {
					// Add to current array
					const itemId = trimmed.replace("§", "");
					if (declarations[itemId]) {
						currentArrayItems.push(declarations[itemId]);
					}
				} else if (trimmed.includes("->")) {
					// Handle transformations
					const chain = trimmed.split("->").map((x) => x.trim());
					const values = chain.map((x) => declarations[x.replace("§", "")]);
					relationships.push(["transform", values]);
				}
			}
		}

		// Add final array if exists
		if (currentArray && currentArrayItems.length > 0) {
			relationships.push(["array", currentArray, currentArrayItems]);
		}

		// Build result
		const result = {};
		for (const [type, ...data] of relationships) {
			if (type === "assign") {
				const [path, value] = data;
				setNestedValue(result, path, value);
			} else if (type === "array") {
				const [name, items] = data;
				result[name] = items;
			} else if (type === "transform") {
				const [steps] = data;
				result["pipeline"] = steps;
			}
		}

		return JSON.stringify(result, null, 2);
	}

	static jsonToPain(jsonText) {
		const data = JSON.parse(jsonText);
		let pain = "";
		let counter = 1;
		const valueToId = new Map();
		const arrays = [];
		const assignments = [];

		// Collect all unique values first
		const collectValues = (obj) => {
			for (const [key, value] of Object.entries(obj)) {
				if (!valueToId.has(key)) {
					valueToId.set(key, counter++);
				}
				if (Array.isArray(value)) {
					// Track array relationship
					arrays.push([key, value]);
					// Add array items to declarations
					for (const item of value) {
						if (!valueToId.has(item)) {
							valueToId.set(item, counter++);
						}
					}
				} else if (typeof value === "string") {
					if (!valueToId.has(value)) {
						valueToId.set(value, counter++);
					}
					assignments.push([key, value]);
				}
			}
		};

		collectValues(data);

		// Output declarations
		for (const [value, id] of valueToId) {
			pain += `§${id} ${value}\n`;
		}

		// Section separator
		pain += "§\n";

		// Output array relationships
		for (const [arrayName, items] of arrays) {
			pain += `§${valueToId.get(arrayName)}:\n`;
			for (const item of items) {
				pain += `§${valueToId.get(item)}\n`;
			}
		}

		// Output assignments
		for (const [key, value] of assignments) {
			pain += `§${valueToId.get(key)}=§${valueToId.get(value)}\n`;
		}

		return pain;
	}
}

// Event Handlers
const painText = document.getElementById("painText");
const jsonText = document.getElementById("jsonText");
const painError = document.getElementById("painError");
const jsonError = document.getElementById("jsonError");

painText.addEventListener("input", () => {
	try {
		painError.textContent = "";
		const json = PAINConverter.painToJson(painText.value);
		jsonText.value = json;
		jsonError.textContent = "";
	} catch (e) {
		jsonError.textContent = e.message;
	}
});

jsonText.addEventListener("input", () => {
	try {
		jsonError.textContent = "";
		const pain = PAINConverter.jsonToPain(jsonText.value);
		painText.value = pain;
		painError.textContent = "";
	} catch (e) {
		painError.textContent = e.message;
	}
});
