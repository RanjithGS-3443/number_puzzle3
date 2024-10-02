// Web Worker for A* Solver
self.onmessage = function (event) {
    const { initialState, goalState, size } = event.data;
    const goalMap = createGoalMap(goalState); // Create a goal map for the Manhattan Distance function
    const solution = aStarSolver(initialState, goalState, goalMap, size);
    self.postMessage(solution);
};

// A* algorithm to find the shortest path
function aStarSolver(initialState, goalState, goalMap, size) {
    const openSet = [initialState];
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();

    gScore.set(initialState.toString(), 0);
    fScore.set(initialState.toString(), manhattanDistance(initialState, goalMap, size));

    while (openSet.length > 0) {
        // Use reduce to find the node with the lowest fScore
        const current = openSet.reduce((a, b) => fScore.get(a.toString()) < fScore.get(b.toString()) ? a : b);

        if (arraysEqual(current, goalState)) {
            return reconstructPath(cameFrom, current);
        }

        openSet.splice(openSet.indexOf(current), 1);

        getNeighbors(current, size).forEach(neighbor => {
            const tentative_gScore = gScore.get(current.toString()) + 1;

            if (!gScore.has(neighbor.toString()) || tentative_gScore < gScore.get(neighbor.toString())) {
                cameFrom.set(neighbor.toString(), current);
                gScore.set(neighbor.toString(), tentative_gScore);
                fScore.set(neighbor.toString(), tentative_gScore + manhattanDistance(neighbor, goalMap, size));

                if (!openSet.some(p => arraysEqual(p, neighbor))) {
                    openSet.push(neighbor);
                }
            }
        });
    }

    return [];
}

// Reconstruct path from A* algorithm
function reconstructPath(cameFrom, current) {
    const totalPath = [current];
    while (cameFrom.has(current.toString())) {
        current = cameFrom.get(current.toString());
        totalPath.unshift(current);
    }
    return totalPath;
}

// Manhattan distance heuristic (Optimized with goal map)
function createGoalMap(goalState) {
    const goalMap = new Map();
    goalState.forEach((value, index) => {
        if (value !== null) {
            goalMap.set(value, index);
        }
    });
    return goalMap;
}

function manhattanDistance(state, goalMap, size) {
    let distance = 0;
    state.forEach((value, index) => {
        if (value !== null) {
            const goalIndex = goalMap.get(value);
            const x1 = Math.floor(index / size);
            const y1 = index % size;
            const x2 = Math.floor(goalIndex / size);
            const y2 = goalIndex % size;
            distance += Math.abs(x1 - x2) + Math.abs(y1 - y2);
        }
    });
    return distance;
}

// Get neighboring states
function getNeighbors(state, size) {
    const neighbors = [];
    const blankIndex = state.indexOf(null);
    const row = Math.floor(blankIndex / size);
    const col = blankIndex % size;

    const directions = [
        { r: -1, c: 0 }, // up
        { r: 1, c: 0 },  // down
        { r: 0, c: -1 }, // left
        { r: 0, c: 1 }   // right
    ];

    directions.forEach(({ r, c }) => {
        const newRow = row + r;
        const newCol = col + c;
        if (newRow >= 0 && newRow < size && newCol >= 0 && newCol < size) {
            const newIndex = newRow * size + newCol;
            const newState = state.slice();
            [newState[blankIndex], newState[newIndex]] = [newState[newIndex], newState[blankIndex]];
            neighbors.push(newState);
        }
    });

    return neighbors;
}

// Utility function to compare arrays
function arraysEqual(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
}
