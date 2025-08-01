// State
let tasks = JSON.parse(localStorage.getItem('tasks-v2') || '[]');
let filter = 'all';
let editingTaskIndex = null;
let editingSubtask = { taskIdx: null, subIdx: null };

// DOM
const form = document.getElementById('task-form');
const input = document.getElementById('task-input');
const dueDateInput = document.getElementById('due-date');

dueDateInput.addEventListener('focus', (e) => {
  e.target.type = 'date';
});

dueDateInput.addEventListener('blur', (e) => {
  if (!e.target.value) {
    e.target.type = 'text';
  }
});
const subtaskInput = document.getElementById('subtask-input');
const addSubtaskBtn = document.getElementById('add-subtask-btn');
const list = document.getElementById('task-list');
const menuBtn = document.getElementById('menu-btn');
const menuDropdown = document.getElementById('menu-dropdown');

// Modal DOM
const modal = document.getElementById('confirm-modal');
const modalText = document.getElementById('modal-text');
const modalCancelBtn = document.getElementById('modal-cancel-btn');
const modalConfirmBtn = document.getElementById('modal-confirm-btn');

let confirmCallback = null;

function showModal(text, callback) {
  modalText.textContent = text;
  confirmCallback = callback;
  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('visible'), 10);
}

function hideModal() {
  modal.classList.remove('visible');
  setTimeout(() => {
    modal.style.display = 'none';
    confirmCallback = null;
  }, 200);
}

modalCancelBtn.addEventListener('click', hideModal);
modalConfirmBtn.addEventListener('click', () => {
  if (confirmCallback) {
    confirmCallback();
  }
  hideModal();
});

let subtasksBuffer = [];
const subtasksBufferContainer = document.getElementById('subtasks-buffer-container');

function saveTasks() {
  localStorage.setItem('tasks-v2', JSON.stringify(tasks));
}

function clearForm() {
  input.value = '';
  dueDateInput.value = '';
  subtaskInput.value = '';
  subtasksBuffer = [];
  renderSubtasksBuffer();
}

function escapeHTML(str) {
  return str.replace(/[&<>]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;'
  }[tag]));
}

function createTaskInput(value, onSave, onCancel) {
  const input = document.createElement('input');
  input.type = 'text';
  input.value = value;
  input.className = 'edit-input';
  input.onkeydown = (e) => {
    if (e.key === 'Enter') {
      onSave(input.value);
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };
  input.onblur = () => onCancel();
  setTimeout(() => input.focus(), 0);
  return input;
}

function toggleTaskComplete(idx) {
  tasks[idx].completed = !tasks[idx].completed;
  saveTasks();
  renderTasks();
}

function toggleSubtaskComplete(taskIdx, subIdx) {
  tasks[taskIdx].subtasks[subIdx].completed = !tasks[taskIdx].subtasks[subIdx].completed;
  saveTasks();
  renderTasks();
}

function deleteTask(idx) {
  showModal('Delete this task?', () => {
    tasks.splice(idx, 1);
    saveTasks();
    renderTasks();
  });
}

function deleteSubtask(taskIdx, subIdx) {
  showModal('Delete this subtask?', () => {
    tasks[taskIdx].subtasks.splice(subIdx, 1);
    saveTasks();
    renderTasks();
  });
}

function startEditTask(idx) {
  editingTaskIndex = idx;
  renderTasks();
}

function startEditSubtask(taskIdx, subIdx) {
  editingSubtask = { taskIdx, subIdx };
  renderTasks();
}

function renderSubtasksBuffer() {
  subtasksBufferContainer.innerHTML = '';
  if (subtasksBuffer.length === 0) return;
  const ul = document.createElement('ul');
  ul.className = 'subtasks-buffer';
  subtasksBuffer.forEach((st, i) => {
    const li = document.createElement('li');
    li.className = 'subtask'; // Re-using subtask class for styling consistency
    li.innerHTML = `<span>${escapeHTML(st)}</span> <button class="subtask-delete-btn" data-index="${i}" title="Remove subtask"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2,0,0,0,8,21H16A2,2,0,0,0,18,19V7H6V19Z"/></svg></button>`;
    ul.appendChild(li);
  });
  subtasksBufferContainer.appendChild(ul);
}

addSubtaskBtn.addEventListener('click', e => {
  e.preventDefault();
  const val = subtaskInput.value.trim();
  if (val) {
    subtasksBuffer.push(val);
    subtaskInput.value = '';
    renderSubtasksBuffer();
  }
});

// Event listener for deleting buffered subtasks
subtasksBufferContainer.addEventListener('click', e => {
  if (e.target.closest('.subtask-delete-btn')) {
    const btn = e.target.closest('.subtask-delete-btn');
    const idx = +btn.getAttribute('data-index');
    subtasksBuffer.splice(idx, 1);
    renderSubtasksBuffer();
  }
});

form.addEventListener('submit', e => {
  e.preventDefault();
  const text = input.value.trim();
  const due = dueDateInput.value;
  if (!text) return;
  tasks.push({
    text,
    dueDate: due || null,
    completed: false,
    subtasks: subtasksBuffer.map(st => ({ text: st, completed: false }))
  });
  saveTasks();
  clearForm();
  renderTasks();
});

function renderTasks() {
  list.innerHTML = '';
  let filtered = tasks.filter(task => {
    if (filter === 'all') return true;
    if (filter === 'pending') return !task.completed;
    if (filter === 'completed') return task.completed;
  });
  filtered.forEach((task, i) => {
    const li = document.createElement('li');
    li.className = 'task-item' + (task.completed ? ' task-completed' : '');
    li.tabIndex = 0;
    li.onmouseover = () => li.classList.add('active');
    li.onmouseout = () => li.classList.remove('active');

    // Main Task Section
    const mainTask = document.createElement('div');
    mainTask.className = 'main-task';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = !!task.completed;
    checkbox.onchange = e => { toggleTaskComplete(i); };

    const content = document.createElement('div');
    content.className = 'task-content';

    if (editingTaskIndex === i) {
      const input = createTaskInput(task.text, (newText) => {
        tasks[i].text = newText;
        editingTaskIndex = null;
        saveTasks();
        renderTasks();
      }, () => {
        editingTaskIndex = null;
        renderTasks();
      });
      content.appendChild(input);
    } else {
      const title = document.createElement('span');
      title.className = 'task-title';
      title.textContent = task.text;
      content.appendChild(title);
      if (task.dueDate) {
        const due = document.createElement('span');
        due.className = 'task-due';
        due.textContent = 'Due: ' + task.dueDate;
        content.appendChild(due);
      }
    }

    // More Options Button
    const moreOptionsBtn = document.createElement('button');
    moreOptionsBtn.className = 'more-options-btn';
    moreOptionsBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12,16a2,2,0,1,1,2-2A2,2,0,0,1,12,16Zm0-6a2,2,0,1,1,2-2A2,2,0,0,1,12,10Zm0-6a2,2,0,1,1,2-2A2,2,0,0,1,12,4Z"/></svg>';
    moreOptionsBtn.onclick = (e) => {
      e.stopPropagation();
      const popup = li.querySelector('.actions-popup');
      if (popup) {
        popup.classList.toggle('visible');
      }
    };

    mainTask.append(checkbox, content, moreOptionsBtn);
    li.appendChild(mainTask);

    // Actions Popup
    const actionsPopup = document.createElement('div');
    actionsPopup.className = 'actions-popup';

    const completeBtn = document.createElement('button');
    completeBtn.className = 'action-btn complete-btn';
    completeBtn.textContent = task.completed ? 'Uncomplete' : 'Complete';
    completeBtn.onclick = e => { e.stopPropagation(); toggleTaskComplete(i); };

    const editBtn = document.createElement('button');
    editBtn.className = 'action-btn edit-btn';
    editBtn.textContent = 'Edit';
    editBtn.onclick = e => { e.stopPropagation(); startEditTask(i); actionsPopup.classList.remove('visible'); };

    const delBtn = document.createElement('button');
    delBtn.className = 'action-btn delete-btn';
    delBtn.textContent = 'Delete';
    delBtn.onclick = e => { e.stopPropagation(); deleteTask(i); actionsPopup.classList.remove('visible'); };

    actionsPopup.append(completeBtn, editBtn, delBtn);
    li.appendChild(actionsPopup);

    // Subtasks Section
    if (task.subtasks && task.subtasks.length) {
      const subUl = document.createElement('ul');
      subUl.className = 'subtasks';
      task.subtasks.forEach((st, j) => {
        const subLi = document.createElement('li');
        subLi.className = 'subtask' + (st.completed ? ' subtask-completed' : '');

        const subCheck = document.createElement('input');
        subCheck.type = 'checkbox';
        subCheck.className = 'subtask-checkbox';
        subCheck.checked = !!st.completed;
        subCheck.onchange = e => { toggleSubtaskComplete(i, j); };

        if (editingSubtask.taskIdx === i && editingSubtask.subIdx === j) {
          const input = createTaskInput(st.text, (newText) => {
            tasks[i].subtasks[j].text = newText;
            editingSubtask = { taskIdx: null, subIdx: null };
            saveTasks();
            renderTasks();
          }, () => {
            editingSubtask = { taskIdx: null, subIdx: null };
            renderTasks();
          });
          subLi.append(subCheck, input);
        } else {
          const subText = document.createElement('span');
          subText.textContent = st.text;

          const subMoreOptionsBtn = document.createElement('button');
          subMoreOptionsBtn.className = 'more-options-btn';
          subMoreOptionsBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12,16a2,2,0,1,1,2-2A2,2,0,0,1,12,16Zm0-6a2,2,0,1,1,2-2A2,2,0,0,1,12,10Zm0-6a2,2,0,1,1,2-2A2,2,0,0,1,12,4Z"/></svg>';
          subMoreOptionsBtn.onclick = (e) => {
            e.stopPropagation();
            const popup = subLi.querySelector('.actions-popup');
            if (popup) {
              popup.classList.toggle('visible');
            }
          };

          subLi.append(subCheck, subText, subMoreOptionsBtn);

          const subActionsPopup = document.createElement('div');
          subActionsPopup.className = 'actions-popup';

          const subCompleteBtn = document.createElement('button');
          subCompleteBtn.className = 'action-btn complete-btn';
          subCompleteBtn.textContent = st.completed ? 'Uncomplete' : 'Complete';
          subCompleteBtn.onclick = e => { e.stopPropagation(); toggleSubtaskComplete(i, j); };

          const subEdit = document.createElement('button');
          subEdit.className = 'action-btn edit-btn';
          subEdit.textContent = 'Edit';
          subEdit.onclick = e => { e.stopPropagation(); startEditSubtask(i, j); subActionsPopup.classList.remove('visible'); };

          const subDel = document.createElement('button');
          subDel.className = 'action-btn delete-btn';
          subDel.textContent = 'Delete';
          subDel.onclick = e => { e.stopPropagation(); deleteSubtask(i, j); subActionsPopup.classList.remove('visible'); };

          subActionsPopup.append(subCompleteBtn, subEdit, subDel);
          subLi.appendChild(subActionsPopup);
        }
        subUl.appendChild(subLi);
      });
      li.appendChild(subUl);
    }
    list.appendChild(li);
  });
}

// Close popups when clicking outside (added once)
document.addEventListener('click', (event) => {
  document.querySelectorAll('.actions-popup.visible').forEach(popup => {
    // Check if the click was outside the popup and not on a more-options-btn
    if (!popup.contains(event.target) && !event.target.closest('.more-options-btn')) {
      popup.classList.remove('visible');
    }
  });
});

renderTasks();
