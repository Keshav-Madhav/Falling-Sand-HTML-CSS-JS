////////// Variable Declerations //////////

// Dom elements
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const brushDisplay = document.getElementById('brush');
const typeDisplay = document.getElementById('type');
const countDisplay = document.getElementById('count');
const gravityDisplay = document.getElementById('gravity');

// Constants
const hueIncrement = 0.1;
const cellSize = 4;
const spawnFrequency = 50;

// Vars
var grid = createGrid();
var isMouseDown = false;
var isRightMouseDown = false;
var lastEvent;
var lastEvent2;
var radius = 2;
var hue = 0;
var platformStart, platformEnd;
var gravityX = 0;
var gravityY = 1;
var substract = false;
var platforms = []
var count = 0;


//////Event Listeners//////

// Event listener for the wheel event on the canvas
canvas.addEventListener('wheel', function(event) {
  if (event.deltaY < 0) {
    // Scroll up, increase the radius
    radius = Math.min(radius + 1, 9);
    brushDisplay.innerHTML = radius + 1;
  } else {
    // Scroll down, decrease the radius
    radius = Math.max(radius - 1, 0);
    brushDisplay.innerHTML = radius + 1;
  }

  event.preventDefault();
}, { passive: false });  // Add the passive option and set it to false to make preventDefault work

// Event listener for left or right mouse click
canvas.addEventListener('mousedown', function(event) {
  if(event.button === 0) {
    isMouseDown = true;
    lastEvent = event;
  }
  if (event.button === 2) {  // Right mouse button
    platformStart = { x: event.clientX, y: event.clientY };
    isRightMouseDown = true;
    lastEvent2 = event;
  }
});

// Event listener for left or right mouse up
canvas.addEventListener('mouseup', function(event) {
  if(event.button === 0) {
    isMouseDown = false;
  }
  if (event.button === 2) {  // Right mouse button
    platformEnd = { x: event.clientX, y: event.clientY };
    createPlatform(platformStart, platformEnd);
    isRightMouseDown = false;
    lastEvent2 = event;
  }
});

//  Event listener to detect mouse movement
canvas.addEventListener('mousemove', function(event) {
  if (isMouseDown) {
    lastEvent = event;
  }
  if (isRightMouseDown) {
    lastEvent2 = event;
  }
});

// Event Listeners for touch for touch screen devices
canvas.addEventListener('touchstart', function(event) {
  event.preventDefault();
  isMouseDown = true;
  lastEvent = event;
});
canvas.addEventListener('touchend', function() {
  isMouseDown = false;
});
canvas.addEventListener('touchmove', function(event) {
  if (isMouseDown) {
    lastEvent = event;
  }
});

// Continuously spawn sand at the last known mouse or touch position
setInterval(function() {
  if (isMouseDown) {
    spawnSand(lastEvent);
  }
}, spawnFrequency);

// Event listener to disable context(Right click menu)
canvas.addEventListener('contextmenu', function(event) {
  event.preventDefault();  // Prevent the context menu from showing
});


// Event listeners for reading key presses
window.addEventListener('keydown', function(event) {
  if (event.key === 'r') {
    for (var i = 0; i < grid.length; i++) {
      grid[i].fill(0);
    }
    count = 0;
    countDisplay.innerHTML = count;
  } else if (event.key === 'p') {
    substract = !substract;
    typeDisplay.innerHTML = substract ? 'Remove' : 'Spawn';
  } else if (event.key === 'ArrowUp') {
    gravityX = 0;
    gravityY = -1;
    gravityDisplay.innerHTML = 'Up';
  } else if (event.key === 'ArrowDown') {
    gravityX = 0;
    gravityY = 1;
    gravityDisplay.innerHTML = 'Down';
  } else if (event.key === 'ArrowLeft') {
    gravityX = -1;
    gravityY = 0;
    gravityDisplay.innerHTML = 'Left';
  } else if (event.key === 'ArrowRight') {
    gravityX = 1;
    gravityY = 0;
    gravityDisplay.innerHTML = 'Right';
  } else if (event.key === 'q') {
    gravityX = -1;
    gravityY = -1;
    gravityDisplay.innerHTML = 'Up Left';
  } else if (event.key === 'w') {
    gravityX = 1;
    gravityY = -1;
    gravityDisplay.innerHTML = 'Up Right';  
  } else if (event.key === 'a') {
    gravityX = -1;
    gravityY = 1;
    gravityDisplay.innerHTML = 'Down Left';
  } else if (event.key === 's') {
    gravityX = 1;
    gravityY = 1;
    gravityDisplay.innerHTML = 'Down Right';
  } else if (event.key === 'c') {
    if (platforms.length > 0) {
      // Get the starting point of the first platform that was created
      var platform = platforms.shift();
      removePlatform(platform.x, platform.y);
    }
  } else if (event.key === '+'){
    radius = Math.min(radius + 1, 9);
    brushDisplay.innerHTML = radius + 1;
  } else if (event.key === '-'){
    radius = Math.max(radius - 1, 0);
    brushDisplay.innerHTML = radius + 1;
  }
});



//////// Functions ////////


// Function to spawn sand around click's in the given radius.
function spawnSand(event) {
  var x, y;
  x = (event.touches ? event.touches[0].clientX : event.clientX) / cellSize | 0;
  y = (event.touches ? event.touches[0].clientY : event.clientY) / cellSize | 0;

  // Counter for the number of sand particles added or removed
  var deltaCount = 0;

  // Spawn sand in a radius around the click or touch point
  var absRadius = Math.abs(radius);
  for (var i = -absRadius; i <= absRadius; i++) {
    for (var j = -absRadius; j <= absRadius; j++) {
      if (i*i + j*j <= radius*radius) {  // Check if the cell is within the radius
        var newX = x + j;
        var newY = y + i;
        // Check if the new coordinates are within the grid
        if (newX >= 0 && newX < grid[0].length && newY >= 0 && newY < grid.length) {
          if (!substract && grid[newY][newX] === 0) {
            deltaCount++;  // Increment deltaCount for each new sand particle
            hue = (hue + hueIncrement) % 360;  // Increment and wrap the hue
            grid[newY][newX] = hue;  // Spawn sand with the current hue
          } else if (substract && grid[newY][newX] !== 0) {
            deltaCount--;  // Decrement deltaCount for each removed sand particle
            grid[newY][newX] = 0;  // Remove sand
          }
        }
      }
    }
  }

  // Update the count based on deltaCount
  count += deltaCount;
  countDisplay.innerHTML = count;
}


// Function to create a platform from start drag of right mouse click to end
function createPlatform(start, end) {
  var startX = Math.floor(start.x / cellSize);
  var startY = Math.floor(start.y / cellSize);
  var endX = Math.floor(end.x / cellSize);
  var endY = Math.floor(end.y / cellSize);

  // Add the starting point of the platform to the platforms array
  platforms.push({x: startY, y: startX});

  var dx = Math.abs(endX - startX);
  var dy = Math.abs(endY - startY);
  var sx = (startX < endX) ? 1 : -1;
  var sy = (startY < endY) ? 1 : -1;
  var err = dx - dy;

  while(true){
    grid[startY][startX] = -1;  // Set the grid cell to -1 to create the platform
    count++
    countDisplay.innerHTML=count

    if ((startX === endX) && (startY === endY)) break;
    var e2 = 2*err;
    if (e2 > -dy){ err -= dy; startX += sx; }
    if (e2 < dx){ err += dx; startY += sy; }
    if (e2 > -dy && e2 < dx) { // If stepping in both x and y direction
      grid[startY - sy][startX] = -1; // Fill in the extra cell
      grid[startY][startX - sx] = -1; // Fill in the extra cell
      count+=2
      countDisplay.innerHTML=count
    }
  }
}


// Function to remove the first platform that was added recursively.
function removePlatform(i, j) {
  if (i < 0 || i >= grid.length || j < 0 || j >= grid[0].length || grid[i][j] !== -1) {
    return;
  }

  // Find the platform this cell belongs to
  var index = platforms.findIndex(function(p) {
    return p.x === i && p.y === j;
  });

  // If the cell is in the platforms array, remove it
  if (index !== -1) {
    platforms.splice(index, 1);
  }

  grid[i][j] = 0; // Remove platform

  // Check neighboring cells
  removePlatform(i - 1, j);
  removePlatform(i + 1, j);
  removePlatform(i, j - 1);
  removePlatform(i, j + 1);
}


// Function to create a grid
function createGrid() {
  var width = window.innerWidth - 8;
  var height = window.innerHeight - 2;
  var cellsX = Math.ceil(width / cellSize);
  var cellsY = Math.ceil(height / cellSize);
  var grid = new Array(cellsY);
  for (var i = 0; i < cellsY; i++) {
      grid[i] = new Array(cellsX).fill(0);
  }
  return grid;
}

// Function to draw a grid on a canvas
function drawGrid(ctx, grid, cellSize) {
  for (var i = 0; i < grid.length; i++) {
    for (var j = 0; j < grid[i].length; j++) {
      if (grid[i][j] > 0) {
        ctx.fillStyle = 'hsl(' + grid[i][j] + ', 100%, 50%)';
        ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
      }
      else if (grid[i][j] === -1) {
        ctx.fillStyle = 'white';
        ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
      }
    }
  }
}


// Function to handle fall conditions for each sand particle found
function handleFallingSand(oldGrid, i, j, gravityX, gravityY) {
  var nextRow = i + gravityY;
  var nextCol = j + gravityX;
  var next = oldGrid[nextRow] && oldGrid[nextRow][nextCol];
  var nextUp, nextDown, nextLeft, nextRight;

  if (gravityX !== 0) { // For left and right gravity
    nextUp = oldGrid[nextRow - 1] && oldGrid[nextRow - 1][nextCol];
    nextDown = oldGrid[nextRow + 1] && oldGrid[nextRow + 1][nextCol];
  } else { // For up and down gravity
    nextLeft = oldGrid[nextRow] && oldGrid[nextRow][nextCol - 1];
    nextRight = oldGrid[nextRow] && oldGrid[nextRow][nextCol + 1];
  }

  if (next === 0) {
    oldGrid[nextRow][nextCol] = oldGrid[i][j];
    oldGrid[i][j] = 0;
  } else if ((nextUp === 0 && nextDown === 0) || (nextLeft === 0 && nextRight === 0)) {
    var direction = Math.random() < 0.5 ? -1 : 1;
    if (gravityX !== 0) { // For left and right gravity
      oldGrid[nextRow + direction][nextCol] = oldGrid[i][j];
    } else { // For up and down gravity
      oldGrid[nextRow][nextCol + direction] = oldGrid[i][j];
    }
    oldGrid[i][j] = 0;
  } else if (nextUp === 0 || nextLeft === 0) {
    if (gravityX !== 0) { // For left and right gravity
      oldGrid[nextRow - 1][nextCol] = oldGrid[i][j];
    } else { // For up and down gravity
      oldGrid[nextRow][nextCol - 1] = oldGrid[i][j];
    }
    oldGrid[i][j] = 0;
  } else if (nextDown === 0 || nextRight === 0) {
    if (gravityX !== 0) { // For left and right gravity
      oldGrid[nextRow + 1][nextCol] = oldGrid[i][j];
    } else { // For up and down gravity
      oldGrid[nextRow][nextCol + 1] = oldGrid[i][j];
    }
    oldGrid[i][j] = 0;
  }
}


// Function to find all cells which contain a cell particle which is not -1
function fallingSand(oldGrid, gravityX, gravityY) {
  if (gravityY !== 0) { // For up and down gravity
    var startI = gravityY === 1 ? oldGrid.length - 1 : 0;
    var endI = gravityY === 1 ? -1 : oldGrid.length;
    var stepI = gravityY === 1 ? -1 : 1;

    for (var i = startI; i !== endI; i += stepI) {
      var startJ = (i % 2 === 0) ? 0 : oldGrid[0].length - 1;
      var endJ = (i % 2 === 0) ? oldGrid[0].length : -1;
      var stepJ = (i % 2 === 0) ? 1 : -1;

      for (var j = startJ; j !== endJ; j += stepJ) {
        if (oldGrid[i][j] > 0) {
          handleFallingSand(oldGrid, i, j, gravityX, gravityY);
        }
      }
    }
  } else if (gravityX !== 0) { // For left and right gravity
    var startJ = gravityX === 1 ? oldGrid[0].length - 1 : 0;
    var endJ = gravityX === 1 ? -1 : oldGrid[0].length;
    var stepJ = gravityX === 1 ? -1 : 1;

    for (var j = startJ; j !== endJ; j += stepJ) {
      var startI = (j % 2 === 0) ? 0 : oldGrid.length - 1;
      var endI = (j % 2 === 0) ? oldGrid.length : -1;
      var stepI = (j % 2 === 0) ? 1 : -1;

      for (var i = startI; i !== endI; i += stepI) {
        if (oldGrid[i][j] > 0) {
          handleFallingSand(oldGrid, i, j, gravityX, gravityY);
        }
      }
    }
  }
}


// Draw function to re-render the grid with updated sand.
function animate(grid) {
  // Clear the canvas
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  fallingSand(grid, gravityX, gravityY);  // Update the grid

  drawGrid(ctx, grid, cellSize);

  // Draw the preview line
  if (platformStart && isRightMouseDown) {
    ctx.beginPath();
    ctx.moveTo(platformStart.x, platformStart.y);
    ctx.lineTo(lastEvent2.clientX, lastEvent2.clientY);
    ctx.strokeStyle = 'white';
    ctx.stroke();
  }

  drawFPS(ctx);

  requestAnimationFrame(function() {
    animate(grid);
  });
}
animate(grid);