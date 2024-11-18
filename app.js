const todoInput = document.getElementById('todo-input');
const deadlineInput = document.getElementById('deadline-input');
const priorityInput = document.getElementById('priority-input');
const reminderInput = document.getElementById('reminder-input');
const addButton = document.getElementById('add-btn');
const calendar = document.getElementById('calendar');
const currentMonthYear = document.getElementById('current-month-year');
const prevMonthButton = document.getElementById('prev-month');
const nextMonthButton = document.getElementById('next-month');
const toggleThemeButton = document.getElementById('toggle-theme');
const pomodoroStatus = document.getElementById('pomodoro-status');
const startTimerButton = document.getElementById('start-timer');
const stopTimerButton = document.getElementById('stop-timer');
const pendingTasksContainer = document.getElementById('pending-tasks');

let todos = JSON.parse(localStorage.getItem('todos')) || {};
let currentDate = new Date();
let pomodoroTimer;
let isWorking = true;
let timeRemaining = 25 * 60; // 25 minutes in seconds
let isPomodoroRunning = false;

// Request Notification Permission
function requestNotificationPermission() {
    if (Notification.permission !== "granted") {
        Notification.requestPermission();
    }
}
requestNotificationPermission();

// Schedule reminder for a task
function scheduleReminder(task, date, reminderTime) {
    const reminderDate = new Date(date.getTime() - reminderTime * 60000);
    const timeToReminder = reminderDate - new Date();

    if (timeToReminder > 0) {
        setTimeout(() => {
            if (Notification.permission === "granted") {
                new Notification("Reminder", {
                    body: `Task: "${task}" is due soon!`,
                    icon: 'icon.png'
                });
            }
        }, timeToReminder);
    }
}

// Render Calendar
function renderCalendar() {
    calendar.innerHTML = '';
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();

    currentMonthYear.innerText = `${currentDate.toLocaleString('default', { month: 'long' })} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const headers = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    headers.forEach(day => {
        const header = document.createElement('div');
        header.className = 'header';
        header.innerText = day;
        calendar.appendChild(header);
    });

    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'day';
        calendar.appendChild(emptyCell);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'day';
        dayCell.innerText = day;

        const dateKey = new Date(year, month, day).toISOString().split('T')[0];

        if (todos[dateKey]) {
            todos[dateKey].forEach((todo, index) => {
                const taskItem = document.createElement('div');
                taskItem.className = todo.priority;
                taskItem.innerText = todo.task;

                // Progress Dropdown
                const progressDropdown = document.createElement('select');
                ['Not Started', 'In Progress', 'Completed'].forEach(status => {
                    const option = document.createElement('option');
                    option.value = status.toLowerCase();
                    option.textContent = status;
                    if (todo.status === status.toLowerCase()) option.selected = true;
                    progressDropdown.appendChild(option);
                });
                progressDropdown.addEventListener('change', () => updateTaskProgress(dateKey, index, progressDropdown.value));
                taskItem.appendChild(progressDropdown);

                // Complete Icon
                const completeIcon = document.createElement('i');
                completeIcon.className = 'fas fa-check-circle icon';
                completeIcon.addEventListener('click', () => completeTask(dateKey, index));
                taskItem.appendChild(completeIcon);

                // Edit Icon
                const editIcon = document.createElement('i');
                editIcon.className = 'fas fa-edit icon';
                editIcon.addEventListener('click', () => editTask(dateKey, index));
                taskItem.appendChild(editIcon);

                // Delete Icon
                const deleteIcon = document.createElement('i');
                deleteIcon.className = 'fas fa-trash-alt icon';
                deleteIcon.addEventListener('click', () => deleteTask(dateKey, index));
                taskItem.appendChild(deleteIcon);

                dayCell.appendChild(taskItem);
            });
        }
        calendar.appendChild(dayCell);
    }
    renderPendingTasks();
}

// Add Task
addButton.addEventListener('click', () => {
    const task = todoInput.value.trim();
    const deadline = deadlineInput.value;
    const priority = priorityInput.value;
    const reminder = parseInt(reminderInput.value) || 0;

    if (task && deadline) {
        const dateKey = deadline;
        const newTask = { task, priority, status: 'not started' };

        if (!todos[dateKey]) {
            todos[dateKey] = [];
        }
        todos[dateKey].push(newTask);

        scheduleReminder(task, new Date(deadline), reminder);

        localStorage.setItem('todos', JSON.stringify(todos));
        renderCalendar();
        todoInput.value = '';
        deadlineInput.value = '';
    }
});

// Update Task Progress
function updateTaskProgress(date, index, status) {
    todos[date][index].status = status;
    localStorage.setItem('todos', JSON.stringify(todos));
    renderCalendar();
}

// Complete Task with Notification
function completeTask(date, index) {
    todos[date][index].status = 'completed';
    localStorage.setItem('todos', JSON.stringify(todos));
    renderCalendar();

    if (Notification.permission === "granted") {
        new Notification("Congratulations!", {
            body: "You have completed a task!",
            icon: 'icon.png'
        });
    }
}

// Edit Task
function editTask(date, index) {
    const updatedTask = prompt("Edit your task:", todos[date][index].task);
    if (updatedTask) {
        todos[date][index].task = updatedTask;
        localStorage.setItem('todos', JSON.stringify(todos));
        renderCalendar();
    }
}

// Delete Task
function deleteTask(date, index) {
    todos[date].splice(index, 1);
    if (todos[date].length === 0) delete todos[date];
    localStorage.setItem('todos', JSON.stringify(todos));
    renderCalendar();
}

// Render Pending Tasks
function renderPendingTasks() {
    pendingTasksContainer.innerHTML = '';
    Object.keys(todos).forEach(date => {
        todos[date].forEach(todo => {
            if (todo.status !== 'completed') {
                const taskElement = document.createElement('div');
                taskElement.textContent = `${todo.task} - ${date}`;
                pendingTasksContainer.appendChild(taskElement);
            }
        });
    });
}

// Navigation for Calendar
prevMonthButton.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
});

nextMonthButton.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
});

// Dark Mode Toggle
toggleThemeButton.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
});

renderCalendar();
