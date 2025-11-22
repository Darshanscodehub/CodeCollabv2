// frontend/js/dashboard.js

// Use relative paths for API calls
const API_BASE = ''; 
const token = localStorage.getItem('token') || null;

// --- Modal Elements ---
const folderModal = document.getElementById('folder-modal');
const renameModal = document.getElementById('rename-modal');
const createFolderBtn = document.getElementById('create-folder-btn');
const cancelFolderBtn = document.getElementById('cancel-folder-btn');
const confirmFolderBtn = document.getElementById('confirm-folder-btn');
const folderNameInput = document.getElementById('folder-name-input');
const cancelRenameBtn = document.getElementById('cancel-rename-btn');
const confirmRenameBtn = document.getElementById('confirm-rename-btn');
const renameNameInput = document.getElementById('rename-name-input');

// --- Context Menu Elements ---
const contextMenu = document.getElementById('context-menu');
const contextRenameBtn = document.getElementById('context-rename');
const contextDeleteBtn = document.getElementById('context-delete');

let currentFileId = null;
let currentFileTitle = null;

// --- API Functions ---

async function renameFile(fileId, newTitle) {
    if (!newTitle || !fileId) return;
    try {
        const res = await fetch(`${API_BASE}/snippets/${fileId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title: newTitle.trim() })
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Failed to rename file.');
        }
        renderFileExplorer();
    } catch (error) {
        console.error('Error renaming file:', error);
        alert(error.message);
    }
}

async function deleteFile(fileId, fileName) {
    try {
        const res = await fetch(`${API_BASE}/snippets/${fileId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) { throw new Error('Failed to delete snippet.'); }
        renderFileExplorer();
    } catch (error) {
        console.error('Error deleting snippet:', error);
        alert(error.message);
    }
}

async function createFolder(folderName) {
    if (!folderName) return;
    try {
        const res = await fetch(`${API_BASE}/folders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ folderName })
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Failed to create folder.');
        }
        renderFileExplorer();
    } catch (error) {
        console.error('Error creating folder:', error);
        alert(error.message);
    }
}

// --- UI Functions ---

function showFolderModal() {
    folderNameInput.value = '';
    folderModal.classList.add('visible');
    folderNameInput.focus();
}

function closeFolderModal() {
    folderModal.classList.remove('visible');
}

function showRenameModal(fileId, oldTitle) {
    currentFileId = fileId;
    currentFileTitle = oldTitle;
    renameNameInput.value = oldTitle;
    renameModal.classList.add('visible');
    renameNameInput.focus();
}

function closeRenameModal() {
    renameModal.classList.remove('visible');
    currentFileId = null;
    currentFileTitle = null;
}

function showContextMenu(event, fileId, fileTitle) {
    event.preventDefault();
    currentFileId = fileId;
    currentFileTitle = fileTitle;
    contextMenu.style.top = `${event.clientY}px`;
    contextMenu.style.left = `${event.clientX}px`;
    contextMenu.style.display = 'block';
    window.addEventListener('click', hideContextMenu, { once: true });
}

function hideContextMenu() {
    contextMenu.style.display = 'none';
    currentFileId = null;
    currentFileTitle = null;
}

// --- NEW: Helper function to get file icon ---
function getFileIcon(language) {
    switch (language) {
        case 'javascript':
            return '<svg class="file-icon" style="color: var(--icon-js-color);"><use href="#icon-js"/></svg>';
        case 'python':
            return '<svg class="file-icon" style="color: var(--icon-py-color);"><use href="#icon-py"/></svg>';
        case 'cpp':
            return '<svg class="file-icon" style="color: var(--icon-cpp-color);"><use href="#icon-cpp"/></svg>';
        case 'c':
            return '<svg class="file-icon" style="color: var(--icon-c-color);"><use href="#icon-c"/></svg>';
        default:
            return '<svg class="file-icon" style="color: var(--icon-default-color);"><use href="#icon-file"/></svg>';
    }
}

// --- Main File Rendering Function ---
async function renderFileExplorer() {
    const fileExplorerElement = document.getElementById('file-explorer');
    if (!fileExplorerElement) return;

    if (!token) {
        fileExplorerElement.innerHTML = '<div class="empty-state">Please log in to view your files.</div>';
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/files`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '/login';
                return;
            }
            throw new Error(`Failed to fetch files: ${response.statusText}`);
        }

        const folders = await response.json();
        fileExplorerElement.innerHTML = ''; // Clear existing content

        if (folders.length === 0) {
            fileExplorerElement.innerHTML = '<div class="empty-state">You have no files or folders yet.</div>';
            return;
        }

        folders.forEach(folderData => {
            const folderContainer = document.createElement('div');
            
            const folderHeader = document.createElement('div');
            folderHeader.className = 'folder-item open'; // Start open
            folderHeader.innerHTML = `
                <svg class="folder-icon"><use href="#icon-arrow-down"/></svg>
                <span>${folderData.folder}</span>
            `;
            
            folderContainer.appendChild(folderHeader);

            const fileList = document.createElement('ul');
            fileList.className = 'file-list';

            if (folderData.files.length === 0) {
                 fileList.innerHTML = '<div class="empty-state" style="padding: 20px 0;">This folder is empty.</div>';
            }

            folderData.files.forEach(file => {
                const fileItem = document.createElement('li');
                fileItem.className = 'file-item';
                fileItem.dataset.id = file.id;

                fileItem.innerHTML = `
                    <div class="file-item-name" title="${file.title} (Open in editor)">
                        ${getFileIcon(file.language)}
                        <span>${file.title}</span>
                    </div>
                    <div class="file-item-actions">
                        <button class="action-btn rename" title="Rename">
                            <svg class="btn-icon"><use href="#icon-edit"/></svg>
                        </button>
                        <button class="action-btn delete" title="Delete">
                            <svg class="btn-icon"><use href="#icon-trash"/></svg>
                        </button>
                    </div>
                `;
                
                // Click to open in editor
                fileItem.querySelector('.file-item-name').addEventListener('click', () => {
                    window.location.href = `/editor?fileId=${file.id}`;
                });

                // Right-click context menu
                fileItem.addEventListener('contextmenu', (e) => {
                    showContextMenu(e, file.id, file.title);
                });

                // Rename button
                fileItem.querySelector('.action-btn.rename').addEventListener('click', async (e) => {
                    e.stopPropagation();
                    showRenameModal(file.id, file.title);
                });

                // Delete button
                fileItem.querySelector('.action-btn.delete').addEventListener('click', async (e) => {
                    e.stopPropagation();
                    if (confirm(`Are you sure you want to delete "${file.title}"?`)) {
                        await deleteFile(file.id, file.title);
                    }
                });

                fileList.appendChild(fileItem);
            });
            
            folderContainer.appendChild(fileList);
            fileExplorerElement.appendChild(folderContainer);
            
            // Toggle folder open/close
            folderHeader.addEventListener('click', () => {
                folderHeader.classList.toggle('open');
                const icon = folderHeader.querySelector('.folder-icon use');
                icon.setAttribute('href', folderHeader.classList.contains('open') ? '#icon-arrow-down' : '#icon-arrow-right');
            });
        });

    } catch (error) {
        console.error('Error fetching files:', error);
        fileExplorerElement.innerHTML = `<div class="empty-state">Error: ${error.message}</div>`;
    }
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    if (!token) {
        window.location.href = '/login';
    } else {
        renderFileExplorer();
    }
    
    // "Create Folder" button
    if (createFolderBtn) {
        createFolderBtn.addEventListener('click', showFolderModal);
    }

    // Folder Modal listeners
    cancelFolderBtn.addEventListener('click', closeFolderModal);
    confirmFolderBtn.addEventListener('click', () => {
        const name = folderNameInput.value.trim();
        if (name) {
            createFolder(name);
            closeFolderModal();
        } else {
            alert("Please enter a folder name.");
        }
    });

    // Rename Modal listeners
    cancelRenameBtn.addEventListener('click', closeRenameModal);
    confirmRenameBtn.addEventListener('click', () => {
        const newTitle = renameNameInput.value.trim();
        if (newTitle && currentFileId) {
            renameFile(currentFileId, newTitle);
            closeRenameModal();
        } else {
            alert("Please enter a new name.");
        }
    });

    // Context Menu listeners
    contextRenameBtn.addEventListener('click', () => {
        if (currentFileId && currentFileTitle) {
            showRenameModal(currentFileId, currentFileTitle);
        }
        hideContextMenu();
    });

    contextDeleteBtn.addEventListener('click', () => {
        if (currentFileId && currentFileTitle) {
            if (confirm(`Are you sure you want to delete "${currentFileTitle}"? This cannot be undone.`)) {
                deleteFile(currentFileId, currentFileTitle);
            }
        }
        hideContextMenu();
    });

    // Close modals if background is clicked
    folderModal.addEventListener('click', (e) => {
        if (e.target === folderModal) closeFolderModal();
    });
    renameModal.addEventListener('click', (e) => {
        if (e.target === renameModal) closeRenameModal();
    });
});