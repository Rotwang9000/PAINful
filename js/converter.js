class PAINConverter {
    static painToJson(painText) {
        const lines = painText.split("\n");
        const declarations = {};
        let inRelationships = false;
        let lastPath = null;
        let objectStack = [];
        let currentArrayDepth = 0;
        const result = {};

        const setNestedValue = (obj, path, value) => {
            const parts = path.split(".");
            let current = obj;
            let depth = 0;
            
            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                
                if (!part) {  // Array marker
                    depth++;
                    if (i > 0) {
                        const arrayKey = parts[i-1];
                        if (!Array.isArray(current[arrayKey])) {
                            current[arrayKey] = [];
                            objectStack = objectStack.slice(0, depth);
                        }
                        current = current[arrayKey];
                        
                        if (!objectStack.includes(current) || depth > currentArrayDepth) {
                            current.push({});
                            currentArrayDepth = depth;
                        }
                        current = current[current.length - 1];
                        if (!objectStack.includes(current)) {
                            objectStack.push(current);
                        }
                    }
                    continue;
                }
                
                if (i === parts.length - 1) {
                    current[part] = value;
                } else {
                    current[part] = current[part] || {};
                    current = current[part];
                }
            }
        };

        const resolvePath = (path, lastPath) => {
            if (!path.startsWith('.')) return path;
            
            if (!lastPath) 
                throw new Error("No previous path for relative notation");
                
            const dots = path.match(/^\.+/)[0];
            const upLevels = dots.length - 1;
            const lastParts = lastPath.split('.');
            
            objectStack = objectStack.slice(0, -upLevels);
            currentArrayDepth = Math.max(0, currentArrayDepth - upLevels);
            
            return lastParts
                .slice(0, lastParts.length - upLevels)
                .concat(path.slice(dots.length))
                .join('.');
        };

        // Parse content
        for (const line of lines) {
            const trimmed = line.trim();

            if (trimmed === "§") {
                inRelationships = true;
                continue;
            }

            if (!inRelationships) {
                const match = trimmed.match(/^§(\d+)\s+(.+)$/);
                if (match) {
                    declarations["§" + match[1]] = match[2].trim();
                }
            } else {
                if (trimmed.length === 0) continue;

                if (trimmed.includes("=")) {
                    const [src, dest] = trimmed.split("=").map(x => x.trim());
                    const resolvedSrc = resolvePath(src, lastPath);
                    const srcParts = resolvedSrc.split(".");
                    const srcRefs = srcParts.map(part => {
                        if (part.startsWith("§")) {
                            return declarations[part];
                        }
                        return part;
                    });

                    const destValue = declarations[dest];
                    setNestedValue(result, srcRefs.join("."), destValue);
                    lastPath = resolvedSrc;
                }
            }
        }

        return JSON.stringify(result, null, 2);
    }

    static jsonToPain(jsonText) {
        const data = JSON.parse(jsonText);
        let counter = 1;
        const valueToId = new Map();
        const pathToId = new Map();
        const assignments = [];
        let lastPath = null;

        const getValueId = (value) => {
            const strValue = String(value);
            if (!valueToId.has(strValue)) {
                valueToId.set(strValue, counter++);
            }
            return valueToId.get(strValue);
        };

        const getPathId = (pathSegment) => {
            if (!pathToId.has(pathSegment)) {
                pathToId.set(pathSegment, counter++);
            }
            return pathToId.get(pathSegment);
        };

        const collectPaths = (obj, currentPath = "", inArray = false) => {
            if (Array.isArray(obj)) {
                obj.forEach((item, index) => {
                    // Add empty segment for array level
                    const arrayPath = currentPath + "..";
                    collectPaths(item, arrayPath, true);
                });
                return;
            }

            if (typeof obj === "object" && obj !== null) {
                for (const [key, value] of Object.entries(obj)) {
                    const pathSegment = key;
                    getPathId(pathSegment);
                    const newPath = currentPath ? `${currentPath}.${pathSegment}` : pathSegment;
                    
                    if (typeof value === "object" && value !== null) {
                        collectPaths(value, newPath, Array.isArray(value));
                    } else {
                        const valueId = getValueId(value);
                        assignments.push({
                            path: newPath,
                            valueId,
                            inArray
                        });
                    }
                }
            }
        };

        collectPaths(data);

        let pain = "";

        // Output declarations
        for (const [pathSegment, id] of pathToId) {
            pain += `§${id} ${pathSegment}\n`;
        }
        for (const [value, id] of valueToId) {
            pain += `§${id} ${value}\n`;
        }

        pain += "§\n";

         // Modified relationship output
        for (const assignment of assignments) {
            const pathParts = assignment.path.split(".");
            const refs = pathParts.map(part => part ? `§${getPathId(part)}` : "");
            let path = refs.join(".");

            if (lastPath) {
                const lastParts = lastPath.split(".");
                let commonIndex = 0;
                while (
                    commonIndex < pathParts.length && 
                    commonIndex < lastParts.length && 
                    pathParts[commonIndex] === lastParts[commonIndex]
                ) {
                    commonIndex++;
                }

                // Adjust by subtracting 1 so one dot means stay at same level
                let upMoves = (lastParts.length - commonIndex) - 1;
                if (upMoves < 0) upMoves = 0; // No negative

                if (upMoves > 0) {
                    path = ".".repeat(upMoves) + refs.slice(commonIndex).join(".");
                } else if (commonIndex === lastParts.length) {
                    // Single dot indicates same level
                    path = "." + refs.slice(commonIndex).join(".");
                }
            }

            pain += `${path} = §${assignment.valueId}\n`;
            lastPath = assignment.path;
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
