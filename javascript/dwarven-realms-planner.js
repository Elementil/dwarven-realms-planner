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
 * @typedef {object} NodeEffect
 * @property {string} type
 * @property {number} value
 * @property {string} unit
 */

/**
 * @typedef {object} NodeType
 * @property {string} label
 * @property {string} image
 * @property {string} description
 * @property {NodeEffect[]} effects
 */

import nodeTypesImport from '../data/node_types.json' assert { type: 'json' };
import nodesImport from '../data/nodes.json' assert { type: 'json' };

/** @type Map<string, NodeType> */
const nodeTypes = new Map(Object.entries(nodeTypesImport));

/** @type Array<Node> */
const nodes = nodesImport;

/** @type number */
let playerLevel = 1;

/** @type number */
let availablePoints = 0;

document.addEventListener("DOMContentLoaded", () => {
    const planner = document.getElementById('planner');
    planner.addEventListener('click', event => console.log(`x: ${event.x}, y: ${event.y}`));

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
        node.circle = circle;

        const image = createNodeImage(node);
        planner.appendChild(image);
        node.image = image;

        circle.addEventListener('click', () => onNodeClicked(node));
        image.addEventListener('click', () => onNodeClicked(node));
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
    const circle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
    circle.setAttribute("r", "18.5px");
    circle.setAttribute("cx", node.x);
    circle.setAttribute("cy", node.y);
    circle.setAttribute("fill", "transparent");
    circle.style.cursor = 'pointer';
    return circle;
}

/**
 * 
 * @param {Node} node 
 * @returns {SVGImageElement}
 */
function createNodeImage(node) {
    const image = document.createElementNS("http://www.w3.org/2000/svg", 'image');
    image.setAttribute("x", node.x - 18.5);
    image.setAttribute("y", node.y - 18.5);
    image.setAttribute("href", nodeTypes.get(node.type).image);
    image.style.display = 'none';
    image.style.cursor = 'pointer';
    return image;
}

/**
 * 
 * @param {Node} node 
 */
function onNodeClicked(node) {
    if (isNodeStateChangable(node)) {
        setNodeActive(node, !node.active);
        updateAvailablePoints();
    }
}

/**
 * 
 * @returns {void}
 */
function resetAll() {
    nodes.forEach(n => setNodeActive(n, false));
    updateAvailablePoints();
}

/**
 * 
 * @param {Node} node 
 * @param {boolean} active 
 * @returns {void}
 */
function setNodeActive(node, active) {
    if (active) {
        if (availablePoints < 1) {
            return;
        }
        node.image.style.display = 'block';
        node.circle.style.display = 'none';
    } else {
        node.image.style.display = 'none';
        node.circle.style.display = 'block';
    }
    node.active = active;
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

    /** @type number[] */
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