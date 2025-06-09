# On-Time: Task Manager MVP

On-Time is a simple, modern, and interactive Task Manager web application built to help users manage their daily tasks and subtasks efficiently. This project is focused on frontend development using vanilla JavaScript, HTML, and CSS, and is designed to be clean, responsive, and user-friendly.

---

## Features

- **Add, Edit, and Delete Tasks**: Quickly add new tasks, edit existing ones, or remove them as needed.
- **Due Dates**: Assign due dates to tasks for better planning.
- **Subtasks**: Break down tasks into smaller subtasks, each with its own completion state.
- **Task Completion**: Mark tasks and subtasks as completed. Completed tasks are visually indicated with a strikethrough.
- **Filter Tasks**: View all, only active, or only completed tasks using filter buttons.
- **Dropdown Subtasks**: Subtasks are hidden by default and can be toggled as a dropdown by clicking on the main task.
- **Persistent Storage**: All tasks and subtasks are saved in the browser's localStorage, so your data persists across sessions.
- **Responsive UI**: The interface is styled for clarity and usability on both desktop and mobile devices.

---

## File Structure

```
On-Time/
│
├── index.html         # Main HTML file
├── script.js          # Main JavaScript logic
├── style.css          # Main CSS for styling
├── assets/            # (Optional) Folder for images, icons, etc.
│   └── styles.css     # (Optional) Additional styles
├── js/                # (Optional) For modular JS files
└── README.md          # Project documentation
```

---

## Workflow

1. **Add a Task**: Enter a task description (and optionally a due date) in the input field and click 'Add Task'.
2. **View Tasks**: All tasks are listed. Use the filter buttons to view all, only active, or only completed tasks.
3. **Mark Complete**: Click the checkmark (✅) to toggle a task's completion. Completed tasks are shown with a strikethrough and can be filtered.
4. **Edit or Delete**: Use the pencil (✏️) to edit a task or the trash (🗑️) to delete it.
5. **Subtasks**: If a task has subtasks, click on the main task row to expand/collapse the subtasks dropdown. Subtasks can be completed or deleted individually.
6. **Persistence**: All changes are saved automatically to localStorage.

---

## Key JavaScript Logic Explained

### 1. Task Filtering and Index Mapping
To ensure that actions (toggle, edit, delete) work correctly even when filters are applied, the code maps each filtered task to its original index in the main `tasks` array:

```js
const filteredTasks = tasks
  .map((task, i) => ({ ...task, _originalIndex: i }))
  .filter(task => {
    if (currentFilter === 'all') return true;
    if (currentFilter === 'active') return !task.completed;
    if (currentFilter === 'completed') return task.completed;
  });
```
This allows the UI to always reference the correct task in the data array, regardless of the current filter.

### 2. Subtask Dropdown Toggle
Subtasks are hidden by default and shown only when the user clicks on the main task row. This is achieved by toggling the display of the subtasks container:

```js
function toggleSubtaskDropdown(id) {
  const el = document.getElementById(id);
  if (el) {
    el.style.display = (el.style.display === 'none' || el.style.display === '') ? 'block' : 'none';
  }
}
```
The `onclick` handler on the task row calls this function, making the subtasks appear as a dropdown.

### 3. Completion Logic for Tasks and Subtasks
When a task has subtasks, its completion state is determined by the state of its subtasks. If all subtasks are completed, the main task is marked as completed automatically:

```js
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
```
This ensures consistency between the main task and its subtasks.

### 4. Persistent Storage
All tasks and subtasks are saved to localStorage after every change:

```js
function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}
```
This means your data is preserved even if you close or refresh the browser.

---

## Customization & Extending
- You can easily add more features, such as task priorities, notifications, or drag-and-drop reordering, by extending the JavaScript and UI.
- The CSS is modular and can be themed as desired.

---

## License
This project is for educational and personal use. Feel free to fork and modify it for your own needs.

---

## Author
- Kiran Kumar A 

---

Enjoy staying productive with On-Time!
