// ---------- Constants & selectors ----------
const STORAGE_KEY = 'portfolio_todo_tasks_v2';
const THEME_KEY = 'portfolio_todo_theme';
const taskForm = document.getElementById('task-form');
const titleInput = document.getElementById('task-title');
const dateInput = document.getElementById('task-due');
const tasksList = document.getElementById('tasks');
const totalCount = document.getElementById('total-count');
const titleError = document.getElementById('title-error');
const dateError = document.getElementById('date-error');
const searchInput = document.getElementById('task-search');
const sortSelect = document.getElementById('sort-select');
const progressFill = document.getElementById('progress-fill');
const themeToggle = document.getElementById('theme-toggle');

let tasks = [];
let currentFilter = 'all';
let currentSearch = '';
let currentSort = 'created';
let vantaEffect;

// ---------- Utilities ----------
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);
const isValidDateString = d => !isNaN(Date.parse(d));
const isOverdue = task => !task.completed && new Date(task.dueDate+'T23:59:59') < new Date();
const formatDate = iso => new Date(iso+'T00:00:00').toLocaleDateString(undefined, { year:'numeric', month:'short', day:'numeric' });

// ---------- Storage ----------
const saveToLocalStorage = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
const loadFromLocalStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
};
const saveTheme = theme => localStorage.setItem(THEME_KEY, theme);
const loadTheme = () => localStorage.getItem(THEME_KEY) || 'light';

// ---------- CRUD ----------
function addTask(title,dueDate){
  tasks.unshift({id:uid(), title:title.trim(), dueDate, completed:false, createdAt:new Date().toISOString()});
  saveToLocalStorage(); renderTasks();
}
function deleteTask(id){ tasks=tasks.filter(t=>t.id!==id); saveToLocalStorage(); renderTasks(); }
function toggleTaskComplete(id){ tasks=tasks.map(t=>t.id===id?{...t,completed:!t.completed}:t); saveToLocalStorage(); renderTasks(); }
function updateTaskTitle(id,newTitle){ const clean=newTitle.trim(); if(!clean) return; tasks=tasks.map(t=>t.id===id?{...t,title:clean}:t); saveToLocalStorage(); renderTasks(); }
function filterTasks(f){ currentFilter=f; renderTasks(); }

// ---------- Render ----------
function renderTasks(){
  let visible=[...tasks];
  if(currentFilter==='active') visible=visible.filter(t=>!t.completed);
  if(currentFilter==='completed') visible=visible.filter(t=>t.completed);
  if(currentSearch.trim()) visible=visible.filter(t=>t.title.toLowerCase().includes(currentSearch.toLowerCase()));
  if(currentSort==='due') visible.sort((a,b)=>new Date(a.dueDate)-new Date(b.dueDate));
  else visible.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));

  totalCount.textContent = visible.length;
  tasksList.innerHTML='';

  if(visible.length===0){
    const li=document.createElement('li');
    li.className='task-item empty'; li.textContent='No tasks found';
    tasksList.appendChild(li); updateProgress(); return;
  }

  visible.forEach(task=>{
    const li=document.createElement('li'); li.className='task-item fade-in'; li.dataset.id=task.id;
    if(isOverdue(task)) li.classList.add('task-overdue'); if(task.completed) li.classList.add('task-completed');

    const left=document.createElement('div'); left.className='task-left';
    const checkbox=document.createElement('button'); checkbox.className='task-checkbox';
    checkbox.setAttribute('aria-pressed', String(task.completed));
    checkbox.title=task.completed?'Mark incomplete':'Mark complete';
    checkbox.innerHTML=task.completed?'✓':'';
    checkbox.addEventListener('click',()=>toggleTaskComplete(task.id));

    const textWrap=document.createElement('div'); textWrap.style.minWidth='0';
    const title=document.createElement('div'); title.className='task-title'; title.textContent=task.title; title.contentEditable=false;

    title.addEventListener('dblclick',()=>{ title.contentEditable=true; title.focus(); });
    title.addEventListener('blur',()=>{ if(title.contentEditable==='true'){ updateTaskTitle(task.id,title.textContent); title.contentEditable=false; } });
    title.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); title.blur(); } });

    const meta=document.createElement('div'); meta.className='task-meta'; meta.textContent=`Due ${formatDate(task.dueDate)}`;

    textWrap.appendChild(title); textWrap.appendChild(meta); left.appendChild(checkbox); left.appendChild(textWrap);

    const actions=document.createElement('div'); actions.className='task-actions';
    const delBtn=document.createElement('button'); delBtn.className='icon-btn'; delBtn.title='Delete task'; delBtn.textContent='🗑️';
    delBtn.addEventListener('click', () => {showConfirm('Are you sure you want to delete this task?', () => {deleteTask(task.id);});});    
    actions.appendChild(delBtn);

    li.appendChild(left); li.appendChild(actions); tasksList.appendChild(li);
  });

  updateProgress();
}

const confirmToast = document.getElementById('confirm-toast');
const confirmMessage = document.getElementById('confirm-message');
const confirmYes = document.getElementById('confirm-yes');
const confirmNo = document.getElementById('confirm-no');

function showConfirm(message, onYes) {
  confirmMessage.textContent = message;
  confirmToast.style.display = 'flex';

  const cleanUp = () => {
    confirmYes.removeEventListener('click', yesHandler);
    confirmNo.removeEventListener('click', noHandler);
    confirmToast.style.display = 'none';
  };

  const yesHandler = () => {
    cleanUp();
    onYes();
  };
  const noHandler = () => {
    cleanUp();
  };

  confirmYes.addEventListener('click', yesHandler);
  confirmNo.addEventListener('click', noHandler);
}


// ---------- Progress ----------
function updateProgress(){
  const percent = tasks.length===0?0:Math.round((tasks.filter(t=>t.completed).length/tasks.length)*100);
  progressFill.style.width=percent+'%'; progressFill.textContent=percent+'%';
}

// ---------- Form ----------
function clearErrors(){ titleError.textContent=''; dateError.textContent=''; }
taskForm.addEventListener('submit',e=>{
  e.preventDefault(); clearErrors();
  const title=titleInput.value, due=dateInput.value;
  if(!title.trim()){ titleError.textContent='Task title is required.'; titleInput.focus(); return; }
  if(!isValidDateString(due)){ dateError.textContent='Valid due date required.'; dateInput.focus(); return; }
  addTask(title,due); taskForm.reset();
});
taskForm.addEventListener('reset', clearErrors);

// ---------- Filters/Search/Sort ----------
document.querySelectorAll('input[name="filter"]').forEach(r=>r.addEventListener('change',e=>filterTasks(e.target.value)));
searchInput.addEventListener('input',e=>{ currentSearch=e.target.value; renderTasks(); });
sortSelect.addEventListener('change', e=>{ currentSort=e.target.value; renderTasks(); });

// ---------- Theme toggle ----------
themeToggle.addEventListener('click',()=>{
  document.documentElement.classList.toggle('dark');
  const isDark=document.documentElement.classList.contains('dark');
  themeToggle.textContent=isDark?'☀️ Light':'🌙 Dark';
  saveTheme(isDark?'dark':'light'); initVanta();
});

// ---------Toast notification----------
function showToast(message, duration = 2000) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

function addTask(title, dueDate) {
  const newTask = {
    id: uid(),
    title: title.trim(),
    dueDate,
    completed: false,
    createdAt: new Date().toISOString()
  };
  tasks.unshift(newTask);
  saveToLocalStorage();
  renderTasks();
  showToast('Task added successfully ✅');  // ✨
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveToLocalStorage();
  renderTasks();
  showToast('Task deleted ❌'); // ✨
}

// ---------- Vanta ----------
function initVanta(){
  if(vantaEffect) vantaEffect.destroy();
  const isDark=document.documentElement.classList.contains('dark');
  vantaEffect=VANTA.GLOBE({
    el:"#vanta-bg",
    mouseControls:true, touchControls:true,
    minHeight:200, minWidth:200, scale:1, scaleMobile:1,
    color:isDark?0x3ff0ff:0x0077ff,
    color2:isDark?0xffffff:0x000000,
    backgroundColor:isDark?0x0d1117:0xffffff,
  });
}


// ---------- Init ----------
function init(){
  tasks=loadFromLocalStorage();
  renderTasks();
  const savedTheme=loadTheme();
  if(savedTheme==='dark'){ document.documentElement.classList.add('dark'); themeToggle.textContent='☀️ Light'; }
  else themeToggle.textContent='🌙 Dark';
  initVanta();
}
init();
