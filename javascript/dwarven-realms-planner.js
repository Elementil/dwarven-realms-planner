import node_types from '../data/node_types.json' assert { type: 'json' };
import nodes from '../data/nodes.json' assert { type: 'json' };

let playerLevel = 1;
let availablePoints;

document.addEventListener("DOMContentLoaded", () => {
    const planner = document.getElementById('planner');
    planner.addEventListener('click', event => console.log(`x: ${event.x}, y: ${event.y}`));

    initNodes();
    updateAvailablePoints();
    initPlayerLevelInput();
    initResetButton();
});

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

function updateAvailablePoints() {
    const availablePointsText = document.getElementById('planner').getElementById('available-points');
    availablePoints = Math.min(4 + +playerLevel, 204) - nodes.filter(n => n.active).length;
    availablePointsText.textContent = availablePoints;
}

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

function initResetButton() {
    const resetButton = document.querySelector('button.reset-all');
    resetButton.addEventListener('click', () => resetAll());
}

function createNodeCircle(node) {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
    circle.setAttribute("r", "18.5px");
    circle.setAttribute("cx", node.x);
    circle.setAttribute("cy", node.y);
    circle.setAttribute("fill", "transparent");
    circle.style.cursor = 'pointer';
    return circle;
}

function createNodeImage(node) {
    const image = document.createElementNS("http://www.w3.org/2000/svg", 'image');
    image.setAttribute("x", node.x - 18.5);
    image.setAttribute("y", node.y - 18.5);
    image.setAttribute("href", node_types[node.type].image);
    image.style.display = 'none';
    image.style.cursor = 'pointer';
    return image;
}

function onNodeClicked(node) {
    if (nodeStateChangable(node)) {
        setNodeActive(node, !node.active);
        updateAvailablePoints();
    }
}

function resetAll() {
    nodes.forEach(n => setNodeActive(n, false));
    updateAvailablePoints();
}

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

function nodeStateChangable(node) {
    const neighbours = getNeighbours(nodes, node);
    return (node.rootNode || getActiveNeighbours(node, neighbours).length > 0) && (!node.active || !(hasDependentNeighbour(node, neighbours) || requiredNode(node)));
}

function getNeighbours(allNodes, node) {
    return allNodes.filter(n => node.neighbours.includes(n.id));
}

function getActiveNeighbours(node, neighbours) {
    return neighbours.filter(n => n.active && n.neighbours.includes(node.id));
}

function hasDependentNeighbour(node, neighbours) {
    return !!neighbours.find(nb => nb.active && (!getNeighbours(nodes, nb).find(nbnb => nbnb.id !== node.id && nbnb.active && !node.rootNode) && !nb.rootNode));
}

function requiredNode(node) {
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

function hasConnectionToAnyRootNode(node, rootNodes, allNodes) {
    return !!rootNodes.find(rn => hasConnectionToRootNode(node, rn, allNodes));
}

function hasConnectionToRootNode(node, rootNode, allNodes) {
    if (node.id === rootNode.id) {
        return true;
    }

    const toDoSet = [node];
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