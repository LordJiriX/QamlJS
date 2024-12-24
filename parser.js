/*GAML Parser
  All Rights Reserved
  Copyright © 2024 [LordJiriX]
This software is protected by copyright law and is provided under license terms. Unauthorized use, distribution, or reproduction of this software is strictly prohibited and will be prosecuted to the fullest extent of the law.
*/
    
const fs = require('fs');
const path = require('path');

const CURRENT_QAML_VERSION = "1.0.0";
const CURRENT_QAMLJS_VERSION = "1.0 alfa";

function parseQAMLFile(filePath) {
    const input = fs.readFileSync(filePath, 'utf8');
    return parseQAML(input, path.dirname(filePath));
}

function parseQAML(input, basePath = '') {
    const lines = input.split('\n');
    const result = {};
    let currentContext = result;
    const contextStack = [];
    const variables = {};

    lines.forEach(line => {
        line = line.trim();

        
        if (line.startsWith('//')) {
            return;
        }

        
        if (line.startsWith('%version(') && line.endsWith(')%')) {
            const version = line.slice(9, -2).replace(/"/g, '');
            if (version !== CURRENT_QAML_VERSION) {
                throw new Error(`Curretly QAML version is not compatible with ${version}`);
            }
            return;
        }

        
        if (line.startsWith('%use("') && line.endsWith('")%')) {
            const importPath = line.slice(6, -3).replace(/"/g, '');
            const absolutePath = path.resolve(basePath, importPath);
            const importedData = parseQAMLFile(absolutePath);
            mergeObjects(result, importedData);
            return;
        }

        if (line.includes('{')) {
            const key = line.replace('{', '').trim();
            const newObject = {};
            currentContext[key] = newObject;
            contextStack.push(currentContext);
            currentContext = newObject;
        } else if (line.includes('[')) {
            const key = line.replace('[', '').trim();
            const newArray = [];
            currentContext[key] = newArray;
            contextStack.push(currentContext);
            currentContext = newArray;
        } else if (line.includes(']')) {
            currentContext = contextStack.pop();
        } else if (line.includes('}')) {
            currentContext = contextStack.pop();
        } else if (Array.isArray(currentContext)) {
            currentContext.push(convertValue(line.replace(',', '').trim(), variables));
        } else {
            const [key, value] = line.split(':').map(s => s.trim());
            if (value !== undefined) {
                variables[key] = value.replace(/"/g, '');
                currentContext[key] = convertValue(value.replace(/"/g, ''), variables);
            } else {
                currentContext[key] = null;
            }
        }
    });

    return result;
}

function convertValue(value, variables) {
    if (variables[value]) {
        return variables[value];
    }
    if (value === "true" || value === "false") {
        return value === "true";
    } else if (!isNaN(value)) {
        return parseFloat(value);
    }
    return value;
}

function mergeObjects(target, source) {
    for (const key in source) {
        if (source.hasOwnProperty(key)) {
            if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                if (!target[key]) {
                    target[key] = {};
                }
                mergeObjects(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
    }
}

module.exports = { parseQAML, parseQAMLFile };
        
