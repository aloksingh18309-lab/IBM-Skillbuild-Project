// Task Management System
class StudyPlanner {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentFilter = { priority: 'all', status: 'all' };
        this.init();
    }

    init() {
        // Set default due date to today
        document.getElementById('taskDueDate').valueAsDate = new Date();
        
        // Event Listeners
        document.getElementById('taskForm').addEventListener('submit', (e) => this.addTask(e));
        document.getElementById('editForm').addEventListener('submit', (e) => this.updateTask(e));
        document.getElementById('filterPriority').addEventListener('change', (e) => this.filterTasks(e));
        document.getElementById('filterStatus').addEventListener('change', (e) => this.filterTasks(e));
        document.getElementById('exportBtn').addEventListener('click', () => this.exportData());
        document.getElementById('clearCompletedBtn').addEventListener('click', () => this.clearCompleted());
        document.getElementById('setReminderBtn').addEventListener('click', () => this.setReminder());
        document.querySelector('.close-modal').addEventListener('click', () => this.hideModal());
        
        // Initialize motivation slider
        this.initMotivationSlider();
        
        // Render initial tasks and timeline
        this.renderTasks();
        this.renderTimeline();
        this.updateStats();
    }

    initMotivationSlider() {
        const slides = document.querySelectorAll('.slide');
        if (slides.length === 0) return;

        let currentSlide = 0;

        function nextSlide() {
            slides[currentSlide].classList.remove('active');
            currentSlide = (currentSlide + 1) % slides.length;
            slides[currentSlide].classList.add('active');
        }

        // Start sliding every 5 seconds
        setInterval(nextSlide, 5000);
    }

    loadTasks() {
        const savedTasks = localStorage.getItem('studyTasks');
        return savedTasks ? JSON.parse(savedTasks) : [];
    }

    saveTasks() {
        localStorage.setItem('studyTasks', JSON.stringify(this.tasks));
    }

    addTask(e) {
        e.preventDefault();
        
        const title = document.getElementById('taskTitle').value;
        const description = document.getElementById('taskDescription').value;
        const dueDate = document.getElementById('taskDueDate').value;
        const priority = document.getElementById('taskPriority').value;
        const estimatedTime = parseFloat(document.getElementById('taskEstimatedTime').value);
        
        const newTask = {
            id: Date.now(),
            title,
            description,
            dueDate,
            priority,
            estimatedTime,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        this.tasks.push(newTask);
        this.saveTasks();
        this.renderTasks();
        this.renderTimeline();
        this.updateStats();
        
        // Reset form
        document.getElementById('taskForm').reset();
        document.getElementById('taskDueDate').valueAsDate = new Date();
    }

    editTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;
        
        document.getElementById('editTaskId').value = task.id;
        document.getElementById('editTaskTitle').value = task.title;
        document.getElementById('editTaskDescription').value = task.description;
        document.getElementById('editTaskDueDate').value = task.dueDate;
        document.getElementById('editTaskPriority').value = task.priority;
        document.getElementById('editTaskEstimatedTime').value = task.estimatedTime;
        
        this.showModal();
    }

    updateTask(e) {
        e.preventDefault();
        
        const id = parseInt(document.getElementById('editTaskId').value);
        const taskIndex = this.tasks.findIndex(t => t.id === id);
        
        if (taskIndex === -1) return;
        
        this.tasks[taskIndex] = {
            ...this.tasks[taskIndex],
            title: document.getElementById('editTaskTitle').value,
            description: document.getElementById('editTaskDescription').value,
            dueDate: document.getElementById('editTaskDueDate').value,
            priority: document.getElementById('editTaskPriority').value,
            estimatedTime: parseFloat(document.getElementById('editTaskEstimatedTime').value)
        };
        
        this.saveTasks();
        this.renderTasks();
        this.renderTimeline();
        this.updateStats();
        this.hideModal();
    }

    deleteTask(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.saveTasks();
            this.renderTasks();
            this.renderTimeline();
            this.updateStats();
        }
    }

    toggleComplete(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
        }
    }

    filterTasks(e) {
        const filterType = e.target.id === 'filterPriority' ? 'priority' : 'status';
        this.currentFilter[filterType] = e.target.value;
        
        this.renderTasks();
    }

    getFilteredTasks() {
        return this.tasks.filter(task => {
            const matchesPriority = this.currentFilter.priority === 'all' || task.priority === this.currentFilter.priority;
            
            let matchesStatus = true;
            if (this.currentFilter.status === 'completed') {
                matchesStatus = task.completed;
            } else if (this.currentFilter.status === 'pending') {
                matchesStatus = !task.completed && new Date(task.dueDate) >= new Date();
            } else if (this.currentFilter.status === 'overdue') {
                matchesStatus = !task.completed && new Date(task.dueDate) < new Date();
            }
            
            return matchesPriority && matchesStatus;
        });
    }

    renderTasks() {
        const container = document.getElementById('tasksContainer');
        const filteredTasks = this.getFilteredTasks();
        
        if (filteredTasks.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No tasks found. Add a new task to get started!</p>';
            return;
        }
        
        container.innerHTML = filteredTasks.map(task => `
            <div class="task-item ${task.completed ? 'completed' : ''}">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} 
                       onchange="studyPlanner.toggleComplete(${task.id})">
                <div class="task-content">
                    <div class="task-title">${task.title}</div>
                    <div class="task-meta">
                        <span>Due: ${new Date(task.dueDate).toLocaleDateString()}</span>
                        <span>Estimated: ${task.estimatedTime}h</span>
                        <span class="task-priority priority-${task.priority}">${task.priority}</span>
                    </div>
                    ${task.description ? `<div style="margin-top: 5px; color: #666; font-size: 0.9rem;">${task.description}</div>` : ''}
                </div>
                <div class="task-actions">
                    <button class="btn-icon btn-edit" onclick="studyPlanner.editTask(${task.id})">✏️</button>
                    <button class="btn-icon btn-delete" onclick="studyPlanner.deleteTask(${task.id})">🗑️</button>
                </div>
            </div>
        `).join('');
    }

    renderTimeline() {
        const timeline = document.getElementById('timeline');
        const today = new Date();
        const days = [];

        // Create 7 days including today and next 6 days
        for (let i = -3; i <= 3; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            days.push(date);
        }

        timeline.innerHTML = days.map(day => {
            const dayTasks = this.tasks.filter(task => {
                const taskDate = new Date(task.dueDate);
                return taskDate.toDateString() === day.toDateString();
            });

            // Determine priority class
            let priorityClass = 'no-tasks-day';
            if (dayTasks.length > 0) {
                const hasHigh = dayTasks.some(task => task.priority === 'high');
                const hasMedium = dayTasks.some(task => task.priority === 'medium');
                const hasLow = dayTasks.some(task => task.priority === 'low');
                if (hasHigh) {
                    priorityClass = 'high-priority-day';
                } else if (hasMedium) {
                    priorityClass = 'medium-priority-day';
                } else if (hasLow) {
                    priorityClass = 'low-priority-day';
                }
            }

            // Check if today
            const isToday = day.toDateString() === today.toDateString();
            const todayClass = isToday ? 'today' : '';

            return `
                <div class="timeline-day ${priorityClass} ${todayClass}">
                    <div class="timeline-date">${day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                    <div class="timeline-tasks">
                        ${dayTasks.map(task => `
                            <div class="timeline-task ${task.completed ? 'completed' : ''}">
                                ${task.title} (${task.priority})
                            </div>
                        `).join('')}
                        ${dayTasks.length === 0 ? '<div style="text-align: center; color: #999; font-size: 0.8rem;">No tasks</div>' : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    updateStats() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(t => t.completed).length;
        const pendingTasks = this.tasks.filter(t => !t.completed && new Date(t.dueDate) >= new Date()).length;
        const overdueTasks = this.tasks.filter(t => !t.completed && new Date(t.dueDate) < new Date()).length;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        document.getElementById('totalTasks').textContent = totalTasks;
        document.getElementById('completedTasks').textContent = completedTasks;
        document.getElementById('pendingTasks').textContent = pendingTasks;
        document.getElementById('overdueTasks').textContent = overdueTasks;
        document.getElementById('progressFill').style.width = `${completionRate}%`;
    }

    clearCompleted() {
        if (confirm('Are you sure you want to clear all completed tasks?')) {
            this.tasks = this.tasks.filter(t => !t.completed);
            this.saveTasks();
            this.renderTasks();
            this.renderTimeline();
            this.updateStats();
        }
    }

    exportData() {
        const dataStr = JSON.stringify(this.tasks, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'study-tasks.json';
        link.click();
        URL.revokeObjectURL(url);
    }

    setReminder() {
        if (Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    this.scheduleReminder();
                }
            });
        } else if (Notification.permission === 'granted') {
            this.scheduleReminder();
        }
    }

    scheduleReminder() {
        // Set a reminder for 8 AM daily
        const now = new Date();
        const reminderTime = new Date();
        reminderTime.setHours(8, 0, 0, 0);
        
        if (now > reminderTime) {
            reminderTime.setDate(reminderTime.getDate() + 1);
        }
        
        const timeUntilReminder = reminderTime.getTime() - now.getTime();
        
        setTimeout(() => {
            const pendingTasks = this.tasks.filter(t => !t.completed && new Date(t.dueDate) >= new Date());
            
            if (pendingTasks.length > 0) {
                new Notification('Study Planner Reminder', {
                    body: `You have ${pendingTasks.length} pending study tasks today!`,
                    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">📚</text></svg>'
                });
            }
            
            // Schedule next reminder
            this.scheduleReminder();
        }, timeUntilReminder);
        
        alert('Daily reminder set for 8 AM!');
    }

    showModal() {
        document.getElementById('editModal').style.display = 'flex';
    }

    hideModal() {
        document.getElementById('editModal').style.display = 'none';
    }
}

// Initialize the application
const studyPlanner = new StudyPlanner();
