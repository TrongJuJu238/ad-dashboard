const floatBtn = document.getElementById('floatBtn');

let isDragging = false;
let startX, startY;
let winPosX, winPosY;

floatBtn.addEventListener('mousedown', async (e) => {
    if (e.button !== 0) return; // Only left click
    isDragging = true;
    startX = e.screenX;
    startY = e.screenY;
    
    const pos = await window.electronAPI.floatingGetPosition();
    winPosX = pos.x;
    winPosY = pos.y;
    
    document.body.style.cursor = 'grabbing';
});

window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const deltaX = e.screenX - startX;
    const deltaY = e.screenY - startY;
    
    window.electronAPI.floatingMove(winPosX + deltaX, winPosY + deltaY);
});

window.addEventListener('mouseup', (e) => {
    if (!isDragging) return;
    isDragging = false;
    document.body.style.cursor = 'default';
    
    // If delta is very small, treat as click
    const deltaX = Math.abs(e.screenX - startX);
    const deltaY = Math.abs(e.screenY - startY);
    
    if (deltaX < 5 && deltaY < 5) {
        window.electronAPI.floatingClick();
    }
});

// Context Menu (Right Click)
window.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (window.electronAPI.showFloatingMenu) {
        window.electronAPI.showFloatingMenu();
    } else {
        window.electronAPI.floatingClick();
    }
});
