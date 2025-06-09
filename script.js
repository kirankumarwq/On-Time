const form = document.getElementById('task-form');
const input = document.getElementById('task-input');
const dateInput = document.getElementById('task-date');
const list = document.getElementById('task-list');
let currentFilter = 'all';

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function allSubtasksComplete(task) {
  return task.subtasks && task.subtasks.length > 0 && task.subtasks.every(st => st.completed);
}

function updateTaskCompletionBasedOnSubtasks(index) {
  const task = tasks[index];
  if (allSubtasksComplete(task)) {
    task.completed = true;
  } else if (task.completed && !allSubtasksComplete(task)) {
    task.completed = false;
  }
}

function renderTasks() {
  list.innerHTML = '';

  // Attach original index to each task for correct mapping after filtering
  const filteredTasks = tasks
    .map((task, i) => ({ ...task, _originalIndex: i }))
    .filter(task => {
      if (currentFilter === 'all') return true;
      if (currentFilter === 'active') return !task.completed;
      if (currentFilter === 'completed') return task.completed;
    });

  filteredTasks.forEach((task) => {
    // Sync completion status with subtasks before rendering
    updateTaskCompletionBasedOnSubtasks(task._originalIndex);

    const li = document.createElement('li');
    li.className = task.completed ? 'completed' : '';

    li.innerHTML = `
      <div class="task-main">
        <span>${escapeHTML(task.text)}</span>
        ${task.dueDate ? `<small>Due: ${task.dueDate}</small>` : ''}
        <div class="task-actions">
          <button title="Toggle Complete" onclick="toggleTask(${task._originalIndex})">✅</button>
          <button title="Edit Task" onclick="editTask(${task._originalIndex})">✏️</button>
          <button title="Delete Task" onclick="deleteTask(${task._originalIndex})">🗑️</button>
        </div>
      </div>
      <div class="subtasks" id="subtasks-${task._originalIndex}">
        ${renderSubtasks(task.subtasks || [], task._originalIndex)}
      </div>
    `;

    list.appendChild(li);
  });

  saveTasks();
}

// Escape HTML to prevent injection (basic)
function escapeHTML(str) {
  return str.replace(/[&<>"']/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[tag]));
}

function renderSubtasks(subtasks, taskIndex) {
  if (!subtasks.length) return '';

  const items = subtasks.map((subtask, idx) => `
    <li class="${subtask.completed ? 'completed' : ''}">
      <span>${escapeHTML(subtask.text)}</span>
      <div class="subtask-actions">
        <button title="Toggle Complete" onclick="toggleSubtask(${taskIndex},${idx})">✅</button>
        <button title="Delete Subtask" onclick="deleteSubtask(${taskIndex},${idx})">🗑️</button>
      </div>
    </li>
  `).join('');

  return `<ul>${items}</ul>`;
}

// Add a new task
form.addEventListener('submit', e => {
  e.preventDefault();

  const text = input.value.trim();
  const dueDate = dateInput.value;
  if (text) {
    tasks.push({
      text,
      completed: false,
      dueDate: dueDate || null,
      subtasks: []
    });
    saveTasks();
    renderTasks();
    input.value = '';
    dateInput.value = '';
  }
});

// Toggle task complete (manual toggle)
function toggleTask(index) {
  const task = tasks[index];
  // If subtasks present, toggling main task manually turns subtasks off (for consistency)
  if (task.subtasks.length > 0) {
    task.subtasks.forEach(st => (st.completed = task.completed ? false : true));
  }
  task.completed = !task.completed;
  saveTasks();
  renderTasks();
}

// Toggle subtask complete
function toggleSubtask(taskIndex, subtaskIndex) {
  const subtask = tasks[taskIndex].subtasks[subtaskIndex];
  subtask.completed = !subtask.completed;

  // Update main task completion accordingly
  updateTaskCompletionBasedOnSubtasks(taskIndex);

  saveTasks();
  renderTasks();
}

// Delete task
function deleteTask(index) {
  tasks.splice(index, 1);
  saveTasks();
  renderTasks();
}

// Delete subtask
function deleteSubtask(taskIndex, subtaskIndex) {
  tasks[taskIndex].subtasks.splice(subtaskIndex, 1);
  // After deleting, update main task completion
  updateTaskCompletionBasedOnSubtasks(taskIndex);
  saveTasks();
  renderTasks();
}

let editingIndex = null;
let editingSubtasksAllowed = false;

// Edit task + manage subtasks
function editTask(index) {
  if (editingIndex !== null) {
    alert('Please save current edit before editing another task.');
    return;
  }
  editingIndex = index;
  editingSubtasksAllowed = true;

  const task = tasks[index];
  const li = list.children[index];

  li.innerHTML = `
    <input type="text" id="edit-task-input" value="${escapeHTML(task.text)}" />
    <input type="date" id="edit-task-date" value="${task.dueDate || ''}" />

    <div class="subtasks" id="edit-subtasks-container">
      <ul id="edit-subtasks-list">
        ${task.subtasks.map((st, i) => `
          <li>
            <input type="text" class="edit-subtask-input" data-subtask-index="${i}" value="${escapeHTML(st.text)}" style="${st.completed ? 'text-decoration: line-through; opacity: 0.5;' : ''}" />
            <button onclick="toggleSubtaskCompletedInEdit(${i})">✅</button>
            <button onclick="deleteSubtaskInEdit(${i})">🗑️</button>
          </li>
        `).join('')}
      </ul>
      <div class="edit-subtask">
        <input type="text" id="new-subtask-input" placeholder="Add new subtask" ${editingSubtasksAllowed ? '' : 'disabled'} />
        <button id="add-subtask-btn" ${editingSubtasksAllowed ? '' : 'disabled'}>Add</button>
      </div>
      <button id="save-subtasks-btn">Save Subtasks</button>
    </div>

    <div class="edit-task-actions">
      <button id="save-task-btn">Save Task</button>
      <button id="cancel-edit-btn">Cancel</button>
    </div>
  `;

  document.getElementById('add-subtask-btn').addEventListener('click', addSubtaskInEdit);
  document.getElementById('save-subtasks-btn').addEventListener('click', saveSubtasks);
  document.getElementById('save-task-btn').addEventListener('click', saveTaskEdit);
  document.getElementById('cancel-edit-btn').addEventListener('click', cancelEdit);
}

// Add subtask in edit mode
function addSubtaskInEdit(e) {
  e.preventDefault();
  if (!editingSubtasksAllowed) return;

  const input = document.getElementById('new-subtask-input');
  const val = input.value.trim();
  if (!val) return;

  const task = tasks[editingIndex];
  task.subtasks.push({ text: val, completed: false });
  input.value = '';
  renderEditSubtasks();
}

// Render subtasks list inside edit mode
function renderEditSubtasks() {
  const ul = document.getElementById('edit-subtasks-list');
  const task = tasks[editingIndex];

  ul.innerHTML = task.subtasks.map((st, i) => `
    <li>
      <input type="text" class="edit-subtask-input" data-subtask-index="${i}" value="${escapeHTML(st.text)}" style="${st.completed ? 'text-decoration: line-through; opacity: 0.5;' : ''}" />
      <button onclick="toggleSubtaskCompletedInEdit(${i})">✅</button>
      <button onclick="deleteSubtaskInEdit(${i})">🗑️</button>
    </li>
  `).join('');
}

// Toggle subtask completed in edit mode
function toggleSubtaskCompletedInEdit(i) {
  const task = tasks[editingIndex];
  task.subtasks[i].completed = !task.subtasks[i].completed;
  renderEditSubtasks();
}

// Delete subtask in edit mode
function deleteSubtaskInEdit(i) {
  const task = tasks[editingIndex];
  task.subtasks.splice(i, 1);
  renderEditSubtasks();
}

// Save subtasks: lock subtasks editing (disable adding new subtasks)
function saveSubtasks() {
  editingSubtasksAllowed = false;
  document.getElementById('new-subtask-input').disabled = true;
  document.getElementById('add-subtask-btn').disabled = true;
  alert('Subtasks saved. You cannot add new subtasks until you edit the task again.');
}

// Save entire task edit
function saveTaskEdit() {
  const input = document.getElementById('edit-task-input');
  const dateInput = document.getElementById('edit-task-date');
  const newText = input.value.trim();
  if (!newText) {
    alert('Task text cannot be empty');
    return;
  }

  tasks[editingIndex].text = newText;
  tasks[editingIndex].dueDate = dateInput.value || null;

  // Save subtasks text edits
  const subtaskInputs = document.querySelectorAll('.edit-subtask-input');
  subtaskInputs.forEach(inputEl => {
    const idx = parseInt(inputEl.getAttribute('data-subtask-index'), 10);
    tasks[editingIndex].subtasks[idx].text = inputEl.value.trim() || 'Untitled subtask';
  });

  // Update main task completion based on subtasks
  updateTaskCompletionBasedOnSubtasks(editingIndex);

  saveTasks();
  editingIndex = null;
  editingSubtasksAllowed = false;
  renderTasks();
}

// Cancel edit and revert view
function cancelEdit() {
  editingIndex = null;
  editingSubtasksAllowed = false;
  renderTasks();
}

// Set filter
function setFilter(filter) {
  currentFilter = filter;
  renderTasks();
  document.querySelectorAll('#filters button').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.toLowerCase() === filter);
  });
}

// Initial render
renderTasks();
