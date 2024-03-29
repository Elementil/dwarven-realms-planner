/**
 * @typedef {object} Node
 * @property {number} id
 * @property {string} type
 * @property {boolean?} rootNode
 * @property {boolean?} active
 * @property {number[]} neighbours
 * @property {number} x
 * @property {number} y
 * @property {SVGCircleElement?} circle
 * @property {SVGImageElement?} image
 */

/**
 * @typedef {object} NodeType
 * @property {string} label
 * @property {string} image
 * @property {string} description
 * @property {NodeEffect[]?} effects
 * @property {boolean?} triggerEffect
 * @property {string?} size
 */

/**
 * @typedef {object} NodeEffect
 * @property {string} type
 * @property {number} value
 * @property {string} unit
 */

/**
 * @typedef {object} EffectType
 * @property {string} label
 * @property {number} order
 */

import effectTypesImport from '../data/effect_types.json' assert { type: 'json' };
import nodeTypesImport from '../data/node_types.json' assert { type: 'json' };
import nodesImport from '../data/nodes.json' assert { type: 'json' };

var pt;

function alert_coords(evt, svg) {
    pt.x = evt.clientX;
    pt.y = evt.clientY;

    // The cursor point, translated into svg coordinates
    var cursorpt = pt.matrixTransform(svg.getScreenCTM().inverse());

    const newNode = `{"x": ${Math.round(cursorpt.x)}, "y": ${Math.round(cursorpt.y)}},`;
    navigator.clipboard.writeText(newNode);
    console.log(newNode);
}

/** @type {Map<string, EffectType>} */
const effectTypes = new Map(Object.entries(effectTypesImport));

/** @type {Map<string, NodeType>} */
const nodeTypes = new Map(Object.entries(nodeTypesImport));

/** @type {Node[]} */
const nodes = nodesImport;

/** @type {number} */
let playerLevel = 1;

/** @type {number} */
let availablePoints = 0;

document.addEventListener("DOMContentLoaded", () => {
    const planner = document.getElementById('planner');
    pt = planner.createSVGPoint();
    planner.addEventListener('click', event => alert_coords(event, planner));

    initNodes();
    updateAvailablePoints();
    initPlayerLevelInput();
    initResetButton();
});

/**
 * 
 * @returns {void}
 */
function initNodes() {
    const planner = document.getElementById('planner');
    nodes.forEach(node => {
        const circle = createNodeCircle(node);
        planner.appendChild(circle);

        const image = createNodeImage(node);
        planner.appendChild(image);
    });
}

/**
 * 
 * @returns {void}
 */
function updateAvailablePoints() {
    const availablePointsText = document.getElementById('planner').getElementById('available-points');
    availablePoints = Math.min(4 + +playerLevel, 204) - nodes.filter(n => n.active).length;
    availablePointsText.textContent = availablePoints;
}

/**
 * 
 * @returns {void}
 */
function initPlayerLevelInput() {
    const playerLevelInput = document.getElementById('player-level');
    playerLevelInput.addEventListener('keyup', event => {
        if (event.key === 'Enter' && playerLevelInput.value) {
            playerLevel = playerLevelInput.value;
            updateAvailablePoints();
        }
    });
    playerLevelInput.addEventListener('blur', () => {
        if (playerLevelInput.value) {
            playerLevel = playerLevelInput.value;
            updateAvailablePoints();
        }
    });
}

/**
 * 
 * @returns {void}
 */
function initResetButton() {
    const resetButton = document.querySelector('button.reset-all');
    resetButton.addEventListener('click', () => resetAll());
}

/**
 * 
 * @param {Node} node 
 * @returns {SVGCircleElement}
 */
function createNodeCircle(node) {
    const size = nodeTypes.get(node.type).size;
    let radius = '20px';
    if (size === 'large') {
        radius = '40px';
    } else if (size === 'medium') {
        radius = '33px';
    }
    const circle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
    circle.setAttribute("r", radius);
    circle.setAttribute("cx", node.x);
    circle.setAttribute("cy", node.y);
    circle.setAttribute("fill", "transparent");
    circle.style.cursor = 'pointer';
    circle.addEventListener('click', () => onNodeClicked(node));
    circle.addEventListener('mouseover', event => showTooltip(event, circle, node));
    circle.addEventListener('mouseout', hideTooltip);
    node.circle = circle;
    return circle;
}

/**
 * 
 * @param {Node} node 
 * @returns {SVGImageElement}
 */
function createNodeImage(node) {
    const nodeType = nodeTypes.get(node.type);
    let scaleFactor = 1;
    if(nodeType.size === 'large') {
        scaleFactor = 2;
    } else if(nodeType.size === 'medium') {
        scaleFactor = 1.65;
    }
    const image = document.createElementNS("http://www.w3.org/2000/svg", 'image');
    image.setAttribute("x", node.x - scaleFactor * 20);
    image.setAttribute("y", node.y - scaleFactor * 20);
    image.setAttribute("width", scaleFactor * 40);
    image.setAttribute("height", scaleFactor * 40);
    image.setAttribute("href", nodeType.image);
    image.style.display = 'none';
    image.style.cursor = 'pointer';
    image.addEventListener('click', () => onNodeClicked(node));
    image.addEventListener('mouseover', event => showTooltip(event, image, node));
    image.addEventListener('mouseout', hideTooltip);
    node.image = image;
    return image;
}

/**
 * 
 * @param {MouseEvent} event 
 * @param {SVGGraphicsElement} svgElement 
 * @param {Node} node
 * @returns {void} 
 */
function showTooltip(event, svgElement, node) {
    const nodeType = nodeTypes.get(node.type);
    const tooltip = document.getElementById('tooltip');
    tooltip.querySelector('.node-id').textContent = node.id;
    tooltip.querySelector('.tooltip-title').textContent = nodeType.label;
    tooltip.querySelector('.tooltip-description').textContent = nodeType.description;
    tooltip.querySelector('.tooltip-effect').textContent = nodeType.triggerEffect ? '' : `Level 1: ${nodeType.effects.map(e => `+${e.value}${e.unit} ${effectTypes.get(e.type).label}`).join(', ')}`;
    tooltip.style.display = 'block';

    let left = (event.x + (svgElement.getBBox().width / 2));
    let top = (event.y + (svgElement.getBBox().height / 2));

    if (left < 0) {
        left = 0;
    } else if (left + tooltip.getBoundingClientRect().width > window.innerWidth) {
        left = window.innerWidth - tooltip.getBoundingClientRect().width;
    }

    if (top < 0) {
        top = 0;
    } else if (top + tooltip.getBoundingClientRect().height > window.innerHeight) {
        top = window.innerHeight - tooltip.getBoundingClientRect().height;
    }

    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
}

/**
 * 
 * @returns {void}
 */
function hideTooltip() {
    const tooltip = document.getElementById('tooltip');
    tooltip.style.display = 'none';
}

/**
 * 
 * @param {Node} node 
 */
function onNodeClicked(node) {
    if (isNodeStateChangable(node)) {
        if (setNodeActive(node, !node.active)) {
            updateSummary();
            updateAvailablePoints();
        }
    }
}

/**
 * 
 * @returns {void}
 */
function resetAll() {
    nodes.forEach(n => setNodeActive(n, false));
    updateAvailablePoints();
    updateSummary();
}

/**
 * 
 * @returns {void}
 */
function updateSummary() {
    const summaryWrapper = document.querySelector('#summary .summary-entries');
    summaryWrapper.replaceChildren();
    Array.from(getActiveEffects().entries())
        .sort(([type1,], [type2,]) => effectTypes.get(type1).order - effectTypes.get(type2).order)
        .forEach(([type, effects]) => {
            const effectsByUnit = new Map();
            effects.forEach(e => {
                if (!effectsByUnit.has(e.unit)) {
                    effectsByUnit.set(e.unit, []);
                }
                effectsByUnit.get(e.unit).push(e);
            });
            summaryWrapper.appendChild(createSummaryEntry(type, effectsByUnit));
        });
}

/**
 * 
 * @param {string} type 
 * @param {Map<string, NodeEffect[]>} effectsByUnit 
 * @returns {HTMLDivElement}
 */
function createSummaryEntry(type, effectsByUnit) {
    const triggerEffect = type === 'trigger_effect';
    const summaryEntry = document.createElement('div');
    summaryEntry.className = 'summary-entry';
    const entryLabel = document.createElement('div');
    entryLabel.style.fontSize = '0.8rem';
    entryLabel.textContent = effectTypes.get(type).label;
    summaryEntry.appendChild(entryLabel);
    Array.from(effectsByUnit.entries())
        .forEach(([unit, effects]) => {
            const unitEntry = document.createElement('div');
            unitEntry.style.marginTop = '0.5rem';
            if (triggerEffect) {
                unitEntry.className = 'bright-orange';
            }
            const value = effects.reduce((sum, e) => sum + e.value, 0);
            unitEntry.textContent = `${triggerEffect ? '' : '+' + value.toFixed(2)}${unit}`;
            summaryEntry.appendChild(unitEntry);
        });
    return summaryEntry;
}

/**
 * 
 * @returns {Map<string, NodeEffect[]>}
 */
function getActiveEffects() {
    /** @type {Map<string, NodeEffect[]>} */
    const effects = new Map();
    nodes.filter(n => n.active)
        .flatMap(n => {
            const nodeType = nodeTypes.get(n.type);
            return nodeType.triggerEffect ? [{ type: 'trigger_effect', value: 0, unit: nodeType.description }] : nodeType.effects;
        })
        .forEach(e => {
            if (!effects.has(e.type)) {
                effects.set(e.type, []);
            }
            effects.get(e.type).push(e);
        });
    return effects;
}

/**
 * 
 * @param {Node} node 
 * @param {boolean} active 
 * @returns {boolean}
 */
function setNodeActive(node, active) {
    if (active) {
        if (availablePoints < 1) {
            return false;
        }
        node.image.style.display = 'block';
        node.circle.style.display = 'none';
    } else {
        node.image.style.display = 'none';
        node.circle.style.display = 'block';
    }
    node.active = active;
    return true;
}

/**
 * 
 * @param {Node} node 
 * @returns {boolean}
 */
function isNodeStateChangable(node) {
    const neighbours = getNeighbours(nodes, node);
    return (node.rootNode || getActiveNeighbours(node, neighbours).length > 0) && (!node.active || !(hasDependentNeighbour(node, neighbours) || isRequiredNode(node)));
}

/**
 * 
 * @param {Node[]} allNodes 
 * @param {Node} node 
 * @returns {Node[]}
 */
function getNeighbours(allNodes, node) {
    return allNodes.filter(n => node.neighbours.includes(n.id));
}

/**
 * 
 * @param {Node} node 
 * @param {Node[]} neighbours 
 * @returns {Node[]}
 */
function getActiveNeighbours(node, neighbours) {
    return neighbours.filter(n => n.active && n.neighbours.includes(node.id));
}

/**
 * 
 * @param {Node} node 
 * @param {Node[]} neighbours 
 * @returns {boolean}
 */
function hasDependentNeighbour(node, neighbours) {
    return !!neighbours.find(nb => nb.active && (!getNeighbours(nodes, nb).find(nbnb => nbnb.id !== node.id && nbnb.active && !node.rootNode) && !nb.rootNode));
}

/**
 * 
 * @param {Node} node 
 * @returns {boolean}
 */
function isRequiredNode(node) {
    const nodesCopy = nodes.map(n => ({ id: n.id, neighbours: [...n.neighbours], rootNode: n.rootNode, active: n.active }));
    const simulatedNode = nodesCopy.find(n => n.id === node.id);
    const neighbours = getNeighbours(nodesCopy, simulatedNode);
    const activeNeighbours = getActiveNeighbours(simulatedNode, neighbours);

    if (activeNeighbours.length > 0) {
        simulatedNode.active = false;
        const rootNodes = nodesCopy.filter(n => n.rootNode);
        return activeNeighbours.filter(an => hasConnectionToAnyRootNode(an, rootNodes, nodesCopy)).length !== activeNeighbours.length;
    }

    return false;
}

/**
 * 
 * @param {Node} node 
 * @param {Node[]} rootNodes 
 * @param {Node[]} allNodes 
 * @returns {boolean}
 */
function hasConnectionToAnyRootNode(node, rootNodes, allNodes) {
    return !!rootNodes.find(rn => hasConnectionToRootNode(node, rn, allNodes));
}

/**
 * 
 * @param {Node} node 
 * @param {Node} rootNode 
 * @param {Node[]} allNodes 
 * @returns {boolean}
 */
function hasConnectionToRootNode(node, rootNode, allNodes) {
    if (node.id === rootNode.id) {
        return true;
    }

    const toDoSet = [node];

    /** @type {number[]} */
    const doneSet = [];

    while (toDoSet.length > 0) {
        const currentNode = toDoSet.splice(0, 1)[0];
        doneSet.push(currentNode.id);
        const neighbours = getNeighbours(allNodes, currentNode);
        for (const an of getActiveNeighbours(currentNode, neighbours)) {
            if (an.id === rootNode.id) {
                return true;
            }

            if (!doneSet.includes(an.id)) {
                toDoSet.push(an);
            }
        };
    }

    return false;
}