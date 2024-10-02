let puzzle = [];
let size = 4; // Default size of 4x4
let intervalId = null;

const puzzleGrid = document.getElementById('puzzleGrid');
const movesList = document.getElementById('movesList'); // Add a container for moves

// Function to create a puzzle of a specific size
function createPuzzle() {
    size = parseInt(document.getElementById('gridSize').value);
    puzzleGrid.style.gridTemplateColumns = `repeat(${size}, 60px)`; // Adjust the grid layout based on size

    // Generate the ordered puzzle (1 to size^2 - 1 with one blank)
    puzzle = Array.from({ length: size * size - 1 }, (_, i) => i + 1);
    puzzle.push(null); // The last cell is blank (null)

    renderPuzzle();
    movesList.innerHTML = ''; // Clear the moves list when a new puzzle is created
}
function createInputPuzzle() {
    size = parseInt(document.getElementById('gridSize').value);
    puzzleGrid.style.gridTemplateColumns = `repeat(${size}, 60px)`;
    puzzle = Array(size * size).fill(null); // Create an empty array for user inputs
    renderInputPuzzle(); // Render the puzzle with input fields
}

function renderInputPuzzle() {
    puzzleGrid.innerHTML = ''; // Clear the existing grid

    for (let i = 0; i < size * size; i++) {
        const cellInput = document.createElement('input');
        cellInput.type = 'number';
        cellInput.min = '1';
        cellInput.max = (size * size - 1).toString();
        cellInput.placeholder = i < size * size - 1 ? i + 1 : ''; // Show placeholder for default numbers
        cellInput.classList.add('cell');
        cellInput.classList.add('input-cell'); // For custom styles
        cellInput.id = `cell-${i}`;
        puzzleGrid.appendChild(cellInput);
    }
}
// Collect user inputs and generate the puzzle
function collectUserInputs() {
    const userInputPuzzle = [];
    const usedNumbers = new Set();

    for (let i = 0; i < size * size; i++) {
        const input = document.getElementById(`cell-${i}`).value;
        const value = input === '' ? null : parseInt(input);

        if (value !== null && (value < 1 || value > size * size - 1 || usedNumbers.has(value))) {
            alert('Invalid input! Ensure all numbers are unique and within the valid range.');
            return; // Stop if there are invalid inputs
        }

        userInputPuzzle.push(value);
        if (value !== null) usedNumbers.add(value);
    }
 // Ensure there's exactly one blank cell (null)
 const blankCount = userInputPuzzle.filter(v => v === null).length;
 if (blankCount !== 1) {
     alert('There must be exactly one blank cell.');
     return;
 }

 puzzle = userInputPuzzle;
 if (isSolvable(puzzle)) {
     renderPuzzle(); // Render the puzzle with the collected inputs
 } else {
     alert('The puzzle is not solvable. Please enter valid numbers.');
 }
}
// Function to render the puzzle grid
function renderPuzzle() {
    puzzleGrid.innerHTML = ''; // Clear the existing grid

    puzzle.forEach((number) => {
        const cell = document.createElement('div');
        cell.classList.add('cell');

        if (number) {
            cell.textContent = number;
        } else {
            cell.classList.add('blank'); // Blank cell
        }

        puzzleGrid.appendChild(cell);
    });
}

// Fisher-Yates shuffle algorithm to randomly shuffle the puzzle
function shufflePuzzle() {
    do {
        for (let i = puzzle.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [puzzle[i], puzzle[j]] = [puzzle[j], puzzle[i]];
        }
    } while (!isSolvable(puzzle)); // Ensure the puzzle is solvable

    renderPuzzle();
    movesList.innerHTML = ''; // Clear the moves list when the puzzle is shuffled
}

// Check if a puzzle is solvable
function isSolvable(puzzle) {
    let inversions = 0;
    const flatPuzzle = puzzle.filter(n => n !== null); // Flatten the puzzle (ignore the blank)

    for (let i = 0; i < flatPuzzle.length; i++) {
        for (let j = i + 1; j < flatPuzzle.length; j++) {
            if (flatPuzzle[i] > flatPuzzle[j]) inversions++;
        }
    }

    if (size % 2 !== 0) {
        // Odd grid size: Solvable if inversions are even
        return inversions % 2 === 0;
    } else {
        // Even grid size: Solvable if inversions + row of the blank are odd
        const blankRow = Math.floor(findBlank(puzzle) / size);
        return (inversions + blankRow) % 2 === 1;
    }
}

// Function to order the puzzle
function orderPuzzle() {
    puzzle = Array.from({ length: size * size - 1 }, (_, i) => i + 1);
    puzzle.push(null); // The last cell is blank
    renderPuzzle();
    movesList.innerHTML = ''; // Clear the moves list when the puzzle is reset
}

// Function to find the position of the blank cell
function findBlank(puzzle) {
    return puzzle.indexOf(null);
}

// A* Solver algorithm to calculate the moves needed to solve the puzzle
// Function to solve the puzzle and display the number of moves
function solvePuzzle() {
    const initialState = puzzle.slice();
    const goalState = Array.from({ length: size * size - 1 }, (_, i) => i + 1).concat([null]);

    const solution = aStarSolver(initialState, goalState);

    if (solution.length > 0) {
        const numberOfMoves = solution.length - 1; // Exclude the initial state
        alert(`Puzzle solved in ${numberOfMoves} moves.`);
        animateSolution(solution);
        displaySolutionMatrices(solution); // Display the solution matrices
    } else {
        alert('No solution found.');
    }
}


// A* algorithm to find the shortest path with Priority Queue
function aStarSolver(initialState, goalState) {
    const openSet = new PriorityQueue();
    openSet.enqueue(initialState, 0);

    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();

    gScore.set(initialState.toString(), 0);
    fScore.set(initialState.toString(), manhattanDistance(initialState, goalState));

    while (!openSet.isEmpty()) {
        const current = openSet.dequeue().element;

        if (arraysEqual(current, goalState)) {
            return reconstructPath(cameFrom, current);
        }

        getNeighbors(current).forEach(neighbor => {
            const tentative_gScore = gScore.get(current.toString()) + 1;

            if (!gScore.has(neighbor.toString()) || tentative_gScore < gScore.get(neighbor.toString())) {
                cameFrom.set(neighbor.toString(), current);
                gScore.set(neighbor.toString(), tentative_gScore);
                const fScoreValue = tentative_gScore + manhattanDistance(neighbor, goalState);
                fScore.set(neighbor.toString(), fScoreValue);

                if (!openSet.contains(neighbor)) {
                    openSet.enqueue(neighbor, fScoreValue);
                }
            }
        });
    }

    return [];
}

// Manhattan distance heuristic
function manhattanDistance(state, goalState) {
    let distance = 0;
    const size = Math.sqrt(state.length);

    state.forEach((value, index) => {
        if (value !== null) {
            const goalIndex = goalState.indexOf(value);
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
function getNeighbors(state) {
    const neighbors = [];
    const blankIndex = findBlank(state);
    const size = Math.sqrt(state.length);
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
function displaySolutionMatrices(solution) {
    const solutionContainer = document.getElementById('solutionContainer'); // Get the solution container
    solutionContainer.innerHTML = ''; // Clear previous solutions

    solution.forEach((step, index) => {
        const matrixDiv = document.createElement('div');
        matrixDiv.classList.add('matrix');
        matrixDiv.style.gridTemplateColumns = `repeat(${size}, 65px)`; // Set columns based on size

        const stepLabel = document.createElement('div');
        stepLabel.classList.add('stepLabel');

        // Label first step as 'Initial State' and last step as 'Goal State'
        if (index === 0) {
            stepLabel.textContent = `Step ${index}: Initial State`; // Label Step 0 as Initial State
        } else if (index === solution.length - 1) {
            stepLabel.textContent = `Step ${index}: Goal State/Solution 👍`; // Label the final step as Goal State
        } else {
            stepLabel.textContent = `Step ${index}`; // Label intermediate steps normally
        }

        solutionContainer.appendChild(stepLabel); // Add label before the matrix

        step.forEach((number) => {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.textContent = number !== null ? number : ''; // Show blank for null
            matrixDiv.appendChild(cell);
        });

        solutionContainer.appendChild(matrixDiv); // Add matrix after label
    });
}



// Animate the solution and display the moves with directions
function animateSolution(moves) {
    let index = 0;
    movesList.innerHTML = ''; // Clear previous moves
    intervalId = setInterval(() => {
        if (index < moves.length) {
            if (index > 0) {
                const previousState = moves[index - 1];
                const currentState = moves[index];
                const movedTile = getMovedTile(previousState, currentState);
                const direction = getMoveDirection(previousState, currentState); // Get direction
                displayMove(movedTile, direction); // Display move with reversed direction
            }
            puzzle = moves[index];
            renderPuzzle(); // Update the grid after each move
            index++;
        } else {
            clearInterval(intervalId);
        }
    }, 500); // Change this delay to control speed of animation
}

// Function to get the moved tile between two states
function getMovedTile(previousState, currentState) {
    for (let i = 0; i < previousState.length; i++) {
        if (previousState[i] !== currentState[i]) {
            if (previousState[i] !== null) {
                return previousState[i];
            }
        }
    }
    return null;
}

// Function to get the direction of the move
function getMoveDirection(previousState, currentState) {
    const blankIndexPrev = previousState.indexOf(null);
    const blankIndexCurr = currentState.indexOf(null);

    const size = Math.sqrt(previousState.length);
    const prevRow = Math.floor(blankIndexPrev / size);
    const prevCol = blankIndexPrev % size;
    const currRow = Math.floor(blankIndexCurr / size);
    const currCol = blankIndexCurr % size;

    if (prevRow === currRow && prevCol > currCol) return "left";
    if (prevRow === currRow && prevCol < currCol) return "right";
    if (prevRow > currRow && prevCol === currCol) return "up";
    if (prevRow < currRow && prevCol === currCol) return "down";

    return "";
}

// Function to display the move and direction (reversed)
function displayMove(tile, direction) {
    const moveItem = document.createElement('li');

    // Reverse the direction
    let reversedDirection = '';
    if (direction === "left") reversedDirection = "right";
    else if (direction === "right") reversedDirection = "left";
    else if (direction === "up") reversedDirection = "down";
    else if (direction === "down") reversedDirection = "up";

    moveItem.textContent = `Move tile ${tile} ${reversedDirection}`;
    movesList.appendChild(moveItem);

    // Display the puzzle grid after each move
    renderPuzzle();
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

// Utility function to compare arrays
function arraysEqual(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
}

// Priority Queue implementation for A* algorithm
class PriorityQueue {
    constructor() {
        this.elements = [];
    }

    enqueue(element, priority) {
        this.elements.push({ element, priority });
    }

    dequeue() {
        let lowestIndex = 0;
        this.elements.forEach((item, index) => {
            if (item.priority < this.elements[lowestIndex].priority) {
                lowestIndex = index;
            }
        });
        return this.elements.splice(lowestIndex, 1)[0];
    }

    isEmpty() {
        return this.elements.length === 0;
    }

    contains(element) {
        return this.elements.some(e => arraysEqual(e.element, element));
    }
}

// Initialize the puzzle
createPuzzle();
