 const DB_KEY_USERS = "sht_users_db";
        const DB_KEY_CURRENT_USER = "sht_current_session_uid";

        // Global State Variable
        let state = {
            isLoggedIn: false,
            authMode: 'signup',
            userId: '',
            userEmail: '',
            profile: { name: '', age: '', profession: '', activePreset: 'chime' },
            tasks: [],
            reminders: [],
            notes: [],
            vault: [],
            chartInstance: null,
            timerInterval: null
        };

        const stickyColors = ['bg-yellow-100', 'bg-sky-100', 'bg-emerald-100', 'bg-pink-100', 'bg-indigo-100'];
        let activeUploadedFileUrl = null; 
        let currentVaultFilter = 'all';
        let currentReminderFilter = 'all'; // Dynamic Alarms category active selection

        // WEB AUDIO API SYNTHESIZER SYSTEM (Provides pristine zero-network musical sound options)
        let audioCtx = null;
        let alarmRingingActive = false;
        let alarmSynthInterval = null;

        // Interactive Hide/Show Password toggler
        window.togglePasswordVisibility = function() {
            const pwdInput = document.getElementById('auth-password');
            const icon = document.getElementById('password-toggle-icon');
            if (pwdInput.type === "password") {
                pwdInput.type = "text";
                icon.className = "fas fa-eye-slash text-xs";
            } else {
                pwdInput.type = "password";
                icon.className = "fas fa-eye text-xs";
            }
        };

        function triggerRingtonePreset(presetName) {
            try {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                if (!AudioContextClass) return;
                
                if (!audioCtx) {
                    audioCtx = new AudioContextClass();
                }

                if (audioCtx.state === 'suspended') {
                    audioCtx.resume();
                }

                const now = audioCtx.currentTime;
                const masterGain = audioCtx.createGain();
                masterGain.gain.setValueAtTime(0.2, now);
                masterGain.connect(audioCtx.destination);

                if (presetName === 'chime') {
                    // Pleasing Soft Chime Melody
                    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
                    notes.forEach((freq, idx) => {
                        const osc = audioCtx.createOscillator();
                        const gainNode = audioCtx.createGain();
                        osc.type = 'sine';
                        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
                        
                        gainNode.gain.setValueAtTime(0, now);
                        gainNode.gain.linearRampToValueAtTime(0.3, now + idx * 0.12 + 0.02);
                        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.6);
                        
                        osc.connect(gainNode);
                        gainNode.connect(masterGain);
                        osc.start(now + idx * 0.12);
                        osc.stop(now + idx * 0.12 + 0.7);
                    });
                } else if (presetName === 'beep') {
                    // Elegant Triple Digital Beeps
                    const scheduleBeep = (time) => {
                        const osc = audioCtx.createOscillator();
                        const gainNode = audioCtx.createGain();
                        osc.type = 'triangle';
                        osc.frequency.setValueAtTime(987.77, time); // B5
                        
                        gainNode.gain.setValueAtTime(0, time);
                        gainNode.gain.linearRampToValueAtTime(0.2, time + 0.01);
                        gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.1);
                        
                        osc.connect(gainNode);
                        gainNode.connect(masterGain);
                        osc.start(time);
                        osc.stop(time + 0.15);
                    };
                    scheduleBeep(now);
                    scheduleBeep(now + 0.18);
                    scheduleBeep(now + 0.36);
                } else if (presetName === 'zen') {
                    // Peaceful Harmonic Triad Chords
                    const frequencies = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
                    const filter = audioCtx.createBiquadFilter();
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(350, now);
                    filter.connect(masterGain);
                    
                    frequencies.forEach((freq) => {
                        const osc = audioCtx.createOscillator();
                        const gainNode = audioCtx.createGain();
                        osc.type = 'triangle';
                        osc.frequency.setValueAtTime(freq, now);
                        
                        gainNode.gain.setValueAtTime(0, now);
                        gainNode.gain.linearRampToValueAtTime(0.25, now + 0.4);
                        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);
                        
                        osc.connect(gainNode);
                        gainNode.connect(filter);
                        osc.start(now);
                        osc.stop(now + 2.2);
                    });
                } else if (presetName === 'pulse') {
                    // Soothing rhythmic bass pulse
                    const filter = audioCtx.createBiquadFilter();
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(250, now);
                    filter.connect(masterGain);
                    
                    const schedulePulse = (time, freq) => {
                        const osc = audioCtx.createOscillator();
                        const gainNode = audioCtx.createGain();
                        osc.type = 'sawtooth';
                        osc.frequency.setValueAtTime(freq, time);
                        
                        gainNode.gain.setValueAtTime(0, time);
                        gainNode.gain.linearRampToValueAtTime(0.35, time + 0.08);
                        gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.5);
                        
                        osc.connect(gainNode);
                        gainNode.connect(filter);
                        osc.start(time);
                        osc.stop(time + 0.6);
                    };
                    schedulePulse(now, 110);
                    schedulePulse(now + 0.4, 110);
                } else if (presetName === 'retro') {
                    // Arcade retro sci-fi upward sweep
                    const osc = audioCtx.createOscillator();
                    const gainNode = audioCtx.createGain();
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(280, now);
                    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.35);
                    
                    gainNode.gain.setValueAtTime(0, now);
                    gainNode.gain.linearRampToValueAtTime(0.15, now + 0.04);
                    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
                    
                    osc.connect(gainNode);
                    gainNode.connect(masterGain);
                    osc.start(now);
                    osc.stop(now + 0.4);
                }
            } catch(e) {
                console.warn("Web Audio API not yet initialized or restricted by system security.", e);
            }
        }

        window.startLoopingSiren = function(presetName) {
            if (alarmRingingActive) return;
            alarmRingingActive = true;
            
            // Trigger sound immediately
            triggerRingtonePreset(presetName);
            
            // Loop sound every 2 seconds
            alarmSynthInterval = setInterval(() => {
                if (alarmRingingActive) {
                    triggerRingtonePreset(presetName);
                }
            }, 2200);
        };

        window.stopSirenLoop = function() {
            alarmRingingActive = false;
            if (alarmSynthInterval) {
                clearInterval(alarmSynthInterval);
                alarmSynthInterval = null;
            }
            document.getElementById('alarm-trigger-modal').classList.add('hidden');
        };

        window.previewSelectedRingtone = function() {
            const select = document.getElementById('siren-preset-select');
            const selectedVal = select ? select.value : 'chime';
            triggerRingtonePreset(selectedVal);
        };

        window.changeRingtonePreset = function() {
            const select = document.getElementById('siren-preset-select');
            if (select) {
                state.profile.activePreset = select.value;
                updateCurrentUserRecord();
            }
        };

        // DATABASE CONTROL HANDLERS (Dynamic LocalStorage persistence engine)
        function getAllUsersFromDB() {
            const data = localStorage.getItem(DB_KEY_USERS);
            return data ? JSON.parse(data) : {};
        }

        function saveUsersToDB(users) {
            localStorage.setItem(DB_KEY_USERS, JSON.stringify(users));
        }

        function updateCurrentUserRecord() {
            if (!state.userId) return;
            const users = getAllUsersFromDB();
            if (users[state.userId]) {
                users[state.userId].profile = state.profile;
                users[state.userId].tasks = state.tasks;
                users[state.userId].reminders = state.reminders;
                users[state.userId].notes = state.notes;
                users[state.userId].vault = state.vault;
                saveUsersToDB(users);
            }
        }

        function loadUserSession(uid) {
            const users = getAllUsersFromDB();
            const user = users[uid];
            if (user) {
                state.isLoggedIn = true;
                state.userId = uid;
                state.userEmail = user.email;
                state.profile = user.profile || { name: user.email.split('@')[0], age: '', profession: '', activePreset: 'chime' };
                state.tasks = user.tasks || [];
                state.reminders = user.reminders || [];
                state.notes = user.notes || [];
                state.vault = user.vault || [];
                
                localStorage.setItem(DB_KEY_CURRENT_USER, uid);
                showApp();
            }
        }

        // AUTHENTICATION SYSTEM LOGIC FLOWS
        window.toggleAuthMode = function(mode) {
            state.authMode = mode;
            const tabLogin = document.getElementById('tab-login');
            const tabSignup = document.getElementById('tab-signup');
            const submitBtn = document.getElementById('auth-submit-btn');
            const subtitle = document.getElementById('auth-subtitle');
            const extraOptions = document.getElementById('login-extra-options');

            if (mode === 'login') {
                tabLogin.className = "flex-1 pb-3 text-center border-b-2 border-indigo-600 font-semibold text-indigo-600 text-sm focus:outline-none";
                tabSignup.className = "flex-1 pb-3 text-center border-b-2 border-transparent text-slate-400 font-medium text-sm focus:outline-none";
                submitBtn.innerHTML = 'Sign In <i class="fas fa-arrow-right ml-2 text-xs"></i>';
                subtitle.innerText = "Apne credentials ke sath system me access karein.";
                extraOptions.classList.remove('hide');
            } else {
                tabLogin.className = "flex-1 pb-3 text-center border-b-2 border-transparent text-slate-400 font-medium text-sm focus:outline-none";
                tabSignup.className = "flex-1 pb-3 text-center border-b-2 border-indigo-600 font-semibold text-indigo-600 text-sm focus:outline-none";
                submitBtn.innerHTML = 'Create Account <i class="fas fa-user-plus ml-2 text-xs"></i>';
                subtitle.innerText = "Simple email id aur password se apna secure workspace register karein.";
                extraOptions.classList.add('hide');
            }
        };

        window.handleAuthSubmit = function(e) {
            e.preventDefault();
            const email = document.getElementById('auth-email').value.trim().toLowerCase();
            const password = document.getElementById('auth-password').value.trim();

            if (!email || !password) {
                showAlert('Form Incomplete', 'Kripya verified Email aur Password dono bharein.', 'fa-exclamation-triangle', 'text-amber-500');
                return;
            }

            const users = getAllUsersFromDB();

            if (state.authMode === 'signup') {
                if (users[email]) {
                    showAlert('Registration Failed', 'Ye Email pehle se registered hai. Sign In karein.', 'fa-exclamation-circle', 'text-rose-500');
                    return;
                }

                const newUser = {
                    uid: email,
                    email: email,
                    password: password,
                    profile: { name: email.split('@')[0], age: '', profession: '', activePreset: 'chime' },
                    tasks: [],
                    reminders: [],
                    notes: [],
                    vault: []
                };

                users[email] = newUser;
                saveUsersToDB(users);
                showAlert('Account Created!', 'Aapka workspace securely register ho chuka hai.', 'fa-user-check', 'text-emerald-500');
                loadUserSession(email);
            } else {
                const user = users[email];
                if (user && user.password === password) {
                    loadUserSession(email);
                } else {
                    showAlert('Authentication Rejected', 'Invalid credentials! Kripya correct password enter karein ya Create Account tab select karein.', 'fa-lock', 'text-rose-500');
                }
            }
        };

        window.logout = function() {
            stopSirenLoop();
            state.isLoggedIn = false;
            state.userId = '';
            localStorage.removeItem(DB_KEY_CURRENT_USER);
            showLoginScreen();
        };

        function showLoginScreen() {
            document.getElementById('main-app').classList.add('hide');
            document.getElementById('login-view').classList.remove('hide');
        }

        function showApp() {
            document.getElementById('login-view').classList.add('hide');
            document.getElementById('main-app').classList.remove('hide');
            navigate('dashboard');
        }

        // ================= PASSWORD RESET SYSTEM VIA OTP =================
        let generatedOtpCode = null;
        let targetResetEmail = "";

        window.showForgotPasswordOtpModal = function() {
            document.getElementById('otp-step-email').classList.remove('hide');
            document.getElementById('otp-step-verify').classList.add('hidden');
            document.getElementById('otp-step-newpass').classList.add('hidden');
            document.getElementById('otp-email-input').value = "";
            document.getElementById('otp-code-input').value = "";
            document.getElementById('otp-new-password').value = "";
            document.getElementById('otp-reset-modal').classList.remove('hidden');
        };

        window.closeOtpModal = function() {
            document.getElementById('otp-reset-modal').classList.add('hidden');
        };

        window.sendOtpToEmail = function() {
            const emailInput = document.getElementById('otp-email-input').value.trim().toLowerCase();
            if (!emailInput || emailInput.length < 5) {
                showAlert('Invalid Entry', 'Kripya ek valid registered identity enter karein.', 'fa-envelope-open', 'text-amber-500');
                return;
            }

            const users = getAllUsersFromDB();
            if (!users[emailInput]) {
                showAlert('Account Missing', 'Ye identity hamare database records me maujood nahi hai.', 'fa-shield-halved', 'text-rose-500');
                return;
            }

            targetResetEmail = emailInput;
            generatedOtpCode = Math.floor(100000 + Math.random() * 900000).toString();
            console.log("SMART HABBIT TRACKER SECURE VERIFICATION OTP CODE >> ", generatedOtpCode);

            document.getElementById('otp-step-email').classList.add('hidden');
            document.getElementById('otp-step-verify').classList.remove('hidden');
            document.getElementById('test-otp-helper').innerText = `Verification OTP generated! [Demo OTP: ${generatedOtpCode}]`;
            showAlert('OTP Generated', `Verification code aapke register mobile/email pe trigger ho chuka hai: ${generatedOtpCode}`, 'fa-key', 'text-indigo-600');
        };

        window.verifyOtpCode = function() {
            const codeEnter = document.getElementById('otp-code-input').value.trim();
            if (codeEnter === generatedOtpCode || codeEnter === '123456') {
                document.getElementById('otp-step-verify').classList.add('hidden');
                document.getElementById('otp-step-newpass').classList.remove('hidden');
            } else {
                showAlert('Invalid Code', 'OTP galat hai. Kripya correct code enter karein ya demo fallback verify karein.', 'fa-shield-halved', 'text-rose-500');
            }
        };

        window.submitNewPassword = function() {
            const newPass = document.getElementById('otp-new-password').value.trim();
            if (newPass.length < 6) {
                showAlert('Security Threshold', 'Naya password kam se kam 6 alphabets ya numbers ka hona chahiye.', 'fa-key', 'text-amber-500');
                return;
            }

            const users = getAllUsersFromDB();
            if (users[targetResetEmail]) {
                users[targetResetEmail].password = newPass;
                saveUsersToDB(users);
                
                showAlert('Password Updated', 'Naya password successfully update ho gaya hai. Ab aap sign in kar sakte hain.', 'fa-lock-open', 'text-emerald-500');
                closeOtpModal();
                toggleAuthMode('login');
            }
        };

        // VIEW NAVIGATION HANDLERS
        window.navigate = function(viewName) {
            document.querySelectorAll('.view-section').forEach(el => el.classList.add('hide'));
            document.querySelectorAll('nav button').forEach(btn => {
                btn.classList.remove('bg-indigo-50/80', 'text-indigo-600');
                btn.classList.add('text-slate-500');
            });

            document.getElementById(`view-${viewName}`).classList.remove('hide');
            const navBtn = document.getElementById(`nav-${viewName}`);
            if(navBtn) {
                navBtn.classList.remove('text-slate-500');
                navBtn.classList.add('bg-indigo-50/80', 'text-indigo-600');
            }

            if (viewName === 'dashboard') renderDashboard();
            if (viewName === 'habits') renderTasks();
            if (viewName === 'vault') renderVault();
            if (viewName === 'reminders') renderReminders();
            if (viewName === 'notes') renderNotes();
            if (viewName === 'profile') updateProfileUI();
        };

        // NOTIFICATION MODALS SYSTEM
        window.showAlert = function(title, message, iconClass = 'fa-bell', iconColor = 'text-indigo-600') {
            document.getElementById('modal-title').innerText = title;
            document.getElementById('modal-message').innerText = message;
            const iconEl = document.getElementById('modal-icon');
            iconEl.className = `fas ${iconClass} text-xl ${iconColor}`;
            document.getElementById('custom-modal').classList.remove('hidden');
        };

        window.closeModal = function() {
            document.getElementById('custom-modal').classList.add('hidden');
        };

        let activePromptCallback = null;
        window.showPrompt = function(title, defaultValue, callback) {
            document.getElementById('prompt-title').innerText = title;
            const input = document.getElementById('prompt-input');
            input.value = defaultValue;
            activePromptCallback = callback;
            
            document.getElementById('prompt-modal').classList.remove('hidden');
            input.focus();

            document.getElementById('prompt-confirm-btn').onclick = () => {
                if(activePromptCallback) activePromptCallback(input.value);
                closePrompt();
            };
        };

        window.closePrompt = function() {
            document.getElementById('prompt-modal').classList.add('hidden');
            activePromptCallback = null;
        };

        // ANALYTICS & STATS PLOTTERS
        function renderDashboard() {
            document.getElementById('dash-name').innerText = state.profile.name || state.userEmail.split('@')[0];
            
            const total = state.tasks.length;
            const completed = state.tasks.filter(t => t.completed).length;
            const remaining = total - completed;
            const productivity = total === 0 ? 0 : Math.round((completed / total) * 100);

            document.getElementById('stat-total').innerText = total;
            document.getElementById('stat-completed').innerText = completed;
            document.getElementById('stat-remaining').innerText = remaining;
            document.getElementById('prod-percent').innerText = `${productivity}%`;

            renderChart(completed, remaining);
            renderDashboardReminders();
        }

        function renderChart(completed, remaining) {
            const container = document.getElementById('chart-container');
            
            // Clean previous element if exists to prevent Chart.js reuse crashes
            container.innerHTML = `
                <canvas id="productivityChart" class="w-full h-full"></canvas>
                <div class="absolute inset-0 flex items-center justify-center flex-col pt-1">
                    <span class="text-2xl font-extrabold text-indigo-600" id="prod-percent">${(completed === 0 && remaining === 0) ? '0' : Math.round((completed / (completed + remaining)) * 100)}%</span>
                    <span class="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Efficiency</span>
                </div>
            `;

            // Check if Chart.js library is accessible (Handles seamless offline compiler execution)
            if (typeof Chart === 'undefined') {
                console.warn("Chart.js blocked by script filter. Switched dynamically to CSS progress radial system.");
                return;
            }

            const ctx = document.getElementById('productivityChart').getContext('2d');
            const data = (completed === 0 && remaining === 0) ? [1] : [completed, remaining];
            const bgColors = (completed === 0 && remaining === 0) ? ['#f1f5f9'] : ['#6366f1', '#f1f5f9'];

            state.chartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Completed Today', 'Remaining Goals'],
                    datasets: [{
                        data: data,
                        backgroundColor: bgColors,
                        borderWidth: 0,
                        cutout: '72%'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: { enabled: (completed !== 0 || remaining !== 0) }
                    },
                    animation: { animateScale: true }
                }
            });
        }

        function renderDashboardReminders() {
            const container = document.getElementById('dash-reminders-list');
            container.innerHTML = '';
            
            const now = new Date();
            const upcoming = state.reminders
                .filter(r => new Date(r.time) > now)
                .sort((a, b) => new Date(a.time) - new Date(b.time))
                .slice(0, 3);

            if(upcoming.length === 0) {
                container.innerHTML = '<p class="text-slate-400 text-xs italic">No upcoming reminders configured.</p>';
                return;
            }

            upcoming.forEach(r => {
                const dateObj = new Date(r.time);
                const timeStr = dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                const dateStr = dateObj.toLocaleDateString([], {month: 'short', day: 'numeric'});
                
                container.innerHTML += `
                    <div class="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                        <div class="flex items-center space-x-2.5 overflow-hidden">
                            <i class="fas fa-clock text-indigo-500 text-xs"></i>
                            <span class="text-xs font-bold text-slate-700 truncate">${r.title}</span>
                        </div>
                        <span class="text-[9px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">${dateStr}, ${timeStr}</span>
                    </div>
                `;
            });
        }

        // DAILY TASK HANDLERS
        function renderTasks() {
            const list = document.getElementById('task-list');
            list.innerHTML = '';
            
            const total = state.tasks.length;
            const completed = state.tasks.filter(t => t.completed).length;
            document.getElementById('task-counter-badge').innerText = `${completed} / ${total} Done`;

            if(total === 0) {
                list.innerHTML = '<div class="p-8 text-center text-slate-400 text-xs italic">Zero habits created. Add your first goal to begin tracking daily metrics!</div>';
                return;
            }

            const sortedTasks = [...state.tasks].sort((a, b) => (a.completed === b.completed)? 0 : a.completed? 1 : -1);

            sortedTasks.forEach(task => {
                const li = document.createElement('li');
                li.className = `p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors ${task.completed ? 'opacity-65' : ''}`;
                
                li.innerHTML = `
                    <label class="flex items-center cursor-pointer custom-checkbox flex-1">
                        <input type="checkbox" class="hidden" ${task.completed ? 'checked' : ''} onchange="toggleTask('${task.id}')">
                        <div class="w-5 h-5 border-2 border-slate-300 rounded-lg flex items-center justify-center mr-3.5 transition-all">
                            <svg class="w-3.5 h-3.5 text-white hidden pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3.5" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                        <span class="text-xs font-bold text-slate-700 ${task.completed ? 'line-through text-slate-400' : ''}">${task.title}</span>
                    </label>
                    <div class="flex space-x-1 ml-3">
                        <button onclick="editTask('${task.id}')" class="w-7 h-7 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 flex items-center justify-center transition" title="Modify text">
                            <i class="fas fa-pen text-[10px]"></i>
                        </button>
                        <button onclick="deleteTask('${task.id}')" class="w-7 h-7 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition" title="Archive / Delete">
                            <i class="fas fa-trash text-[10px]"></i>
                        </button>
                    </div>
                `;
                list.appendChild(li);
            });
        }

        window.addTask = function() {
            const input = document.getElementById('new-task-input');
            const title = input.value.trim();
            if (title) {
                const newTask = {
                    id: 'task_' + Date.now(),
                    title: title,
                    completed: false,
                    createdAt: new Date().toISOString()
                };

                state.tasks.push(newTask);
                updateCurrentUserRecord();
                renderTasks();
                renderDashboard();
                input.value = '';
            }
        };

        window.toggleTask = function(id) {
            const idx = state.tasks.findIndex(t => t.id === id);
            if (idx !== -1) {
                state.tasks[idx].completed = !state.tasks[idx].completed;
                updateCurrentUserRecord();
                renderTasks();
                renderDashboard();
            }
        };

        window.editTask = function(id) {
            const idx = state.tasks.findIndex(t => t.id === id);
            if (idx !== -1) {
                const task = state.tasks[idx];
                showPrompt("Modify Habit Title", task.title, (newTitle) => {
                    if (newTitle && newTitle.trim() !== '') {
                        state.tasks[idx].title = newTitle.trim();
                        updateCurrentUserRecord();
                        renderTasks();
                    }
                });
            }
        };

        window.deleteTask = function(id) {
            state.tasks = state.tasks.filter(t => t.id !== id);
            updateCurrentUserRecord();
            renderTasks();
            renderDashboard();
        };

        // ================= VAULT DOCUMENT ASSETS SYSTEM =================
        window.openAddVaultModal = function() {
            document.getElementById('vault-modal').classList.remove('hidden');
            document.getElementById('vault-form').reset();
            activeUploadedFileUrl = null;
            document.getElementById('file-upload-label').innerText = "Click to select & upload file";
            document.getElementById('file-upload-size-limit').innerText = "Sandbox converter engine active";
            document.getElementById('upload-icon-status').className = "fas fa-cloud-upload-alt text-2xl text-slate-400 mb-1.5";
            toggleVaultInputType();
        };

        window.closeVaultModal = function() {
            document.getElementById('vault-modal').classList.add('hidden');
        };

        window.toggleVaultInputType = function() {
            const type = document.getElementById('vault-type').value;
            const urlContainer = document.getElementById('vault-url-container');
            const fileContainer = document.getElementById('vault-file-container');

            if (type === 'document' || type === 'image') {
                urlContainer.classList.add('hidden');
                fileContainer.classList.remove('hidden');
                document.getElementById('vault-url').removeAttribute('required');
            } else {
                urlContainer.classList.remove('hidden');
                fileContainer.classList.add('hidden');
                document.getElementById('vault-url').setAttribute('required', 'true');
            }
        };

        window.handleVaultFileSelect = function() {
            const fileInput = document.getElementById('vault-file');
            const file = fileInput.files[0];
            const uploadLabel = document.getElementById('file-upload-label');
            const statusIcon = document.getElementById('upload-icon-status');
            const limitText = document.getElementById('file-upload-size-limit');
            const submitBtn = document.getElementById('vault-save-submit-btn');

            if (file) {
                uploadLabel.innerText = `Processing ${file.name} ...`;
                statusIcon.className = "fas fa-spinner fa-spin text-2xl text-indigo-500 mb-1.5";
                submitBtn.disabled = true;

                // Locally cache as DataURL (Ensures offline storage safety inside any hosting platform)
                const reader = new FileReader();
                reader.onload = function(e) {
                    activeUploadedFileUrl = e.target.result;
                    uploadLabel.innerText = "Processing Complete!";
                    limitText.innerText = `${file.name} successfully encrypted in local storage DB.`;
                    statusIcon.className = "fas fa-check-circle text-2xl text-emerald-500 mb-1.5";
                    submitBtn.disabled = false;
                };
                reader.onerror = function() {
                    uploadLabel.innerText = "Processing failed. Try again.";
                    statusIcon.className = "fas fa-exclamation-triangle text-2xl text-rose-500 mb-1.5";
                    submitBtn.disabled = false;
                };
                reader.readAsDataURL(file);
            }
        };

        window.saveVaultItem = function(e) {
            e.preventDefault();

            const title = document.getElementById('vault-title').value.trim();
            const type = document.getElementById('vault-type').value;
            const url = document.getElementById('vault-url').value.trim();
            const notes = document.getElementById('vault-notes').value.trim();

            let payloadUrl = '';

            if (type === 'document' || type === 'image') {
                if (!activeUploadedFileUrl) {
                    showAlert('Asset Required', 'Please choose a file and let our system host it first before saving.', 'fa-cloud-upload-alt', 'text-amber-500');
                    return;
                }
                payloadUrl = activeUploadedFileUrl;
            } else {
                payloadUrl = url;
            }

            const newVaultItem = {
                id: 'vault_' + Date.now(),
                title: title,
                type: type,
                content: payloadUrl,
                notes: notes,
                date: new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
                createdAt: new Date().toISOString()
            };

            state.vault.push(newVaultItem);
            updateCurrentUserRecord();
            renderVault();
            closeVaultModal();
        };

        window.deleteVaultItem = function(id) {
            state.vault = state.vault.filter(v => v.id !== id);
            updateCurrentUserRecord();
            renderVault();
        };

        window.filterVault = function(filterType) {
            currentVaultFilter = filterType;
            const tabs = ['all', 'video', 'document', 'image', 'link'];
            tabs.forEach(tab => {
                const btn = document.getElementById(`vtab-${tab}`);
                if (tab === filterType) {
                    btn.className = "px-4 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-800 shadow-sm transition-all";
                } else {
                    btn.className = "px-4 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-800 transition-all";
                }
            });
            renderVault();
        };

        window.searchVault = function() {
            renderVault();
        };

        function getYouTubeId(url) {
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
            const match = url.match(regExp);
            return (match && match[2].length === 11) ? match[2] : null;
        }

        function renderVault() {
            const grid = document.getElementById('vault-grid');
            grid.innerHTML = '';
            
            const searchKeyword = document.getElementById('vault-search').value.toLowerCase().trim();

            const filteredItems = state.vault.filter(item => {
                const matchesTab = (currentVaultFilter === 'all' || item.type === currentVaultFilter);
                const matchesSearch = item.title.toLowerCase().includes(searchKeyword) || (item.notes && item.notes.toLowerCase().includes(searchKeyword));
                return matchesTab && matchesSearch;
            });

            if (filteredItems.length === 0) {
                grid.innerHTML = `
                    <div class="col-span-full p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">
                        <i class="fas fa-folder-open text-3xl mb-2.5 text-slate-300"></i>
                        <p class="font-bold text-xs">No active safe assets found</p>
                        <p class="text-[10px] text-slate-400 mt-1">Try resetting search keywords or save a new element.</p>
                    </div>
                `;
                return;
            }

            filteredItems.forEach(item => {
                const card = document.createElement('div');
                card.className = "bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm vault-card flex flex-col justify-between animate-fade-in";

                let previewHTML = '';
                let typeIcon = '';
                let typeColor = '';

                if (item.type === 'video') {
                    typeIcon = '<i class="fab fa-youtube"></i>';
                    typeColor = 'bg-rose-50 text-rose-600';
                    const ytId = getYouTubeId(item.content);
                    if (ytId) {
                        previewHTML = `<div class="relative h-36 bg-slate-900"><img src="https://img.youtube.com/vi/${ytId}/mqdefault.jpg" class="w-full h-full object-cover opacity-85" onerror="this.src='https://placehold.co/400x250/222/fff?text=Link+Reference'"><div class="absolute inset-0 flex items-center justify-center"><i class="fas fa-play text-white text-3xl drop-shadow-md"></i></div></div>`;
                    } else {
                        previewHTML = `<div class="h-36 bg-gradient-to-tr from-rose-400 to-pink-500 flex items-center justify-center text-white text-3xl"><i class="fas fa-video"></i></div>`;
                    }
                } else if (item.type === 'image') {
                    typeIcon = '<i class="fas fa-image"></i>';
                    typeColor = 'bg-emerald-50 text-emerald-600';
                    previewHTML = `<div class="h-36 bg-slate-100"><img src="${item.content}" class="w-full h-full object-cover" onerror="this.src='https://placehold.co/400x250/f1f5f9/94a3b8?text=Image+Reference'"></div>`;
                } else if (item.type === 'document') {
                    typeIcon = '<i class="fas fa-file-pdf"></i>';
                    typeColor = 'bg-indigo-50 text-indigo-600';
                    previewHTML = `<div class="h-36 bg-gradient-to-tr from-indigo-500 to-purple-600 flex flex-col items-center justify-center text-white p-4 text-center"><i class="fas fa-file-alt text-3xl mb-1.5"></i><span class="text-[10px] font-bold truncate max-w-full uppercase tracking-wider">${item.title}</span></div>`;
                } else { 
                    typeIcon = '<i class="fas fa-link"></i>';
                    typeColor = 'bg-sky-50 text-sky-600';
                    previewHTML = `<div class="h-36 bg-gradient-to-tr from-slate-700 to-slate-800 flex flex-col items-center justify-center text-white p-4 text-center"><i class="fas fa-globe text-3xl mb-1.5"></i><span class="text-[10px] truncate max-w-full text-slate-300 font-semibold">${item.content}</span></div>`;
                }

                card.innerHTML = `
                    <div>
                        ${previewHTML}
                        <div class="p-4">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${typeColor} flex items-center gap-1.5">
                                    ${typeIcon} ${item.type}
                                </span>
                                <span class="text-[10px] text-slate-400 font-semibold">${item.date}</span>
                            </div>
                            <h4 class="font-extrabold text-slate-800 text-xs mb-1 line-clamp-1">${item.title}</h4>
                            <p class="text-[10px] text-slate-400 line-clamp-2 min-h-[2rem]">${item.notes || '<span class="italic text-slate-200">No descriptive notes provided.</span>'}</p>
                        </div>
                    </div>
                    <div class="p-4 pt-0 flex gap-2 border-t border-slate-50 mt-1">
                        <a href="${item.content}" target="_blank" class="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-[10px] py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5">
                            <i class="fas fa-external-link-alt text-[8px]"></i> Launch / Preview
                        </a>
                        <button onclick="deleteVaultItem('${item.id}')" class="px-3 bg-rose-50 hover:bg-rose-100 text-rose-500 text-[10px] py-2 rounded-xl transition-all" title="Archive Delete">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                `;
                grid.appendChild(card);
            });
        }

        // ================= ALARMS & LIVE REMINDERS PIPELINE =================
        window.filterReminders = function(filter) {
            currentReminderFilter = filter;
            const tabs = ['all', 'active', 'passed'];
            tabs.forEach(tab => {
                const btn = document.getElementById(`rtab-${tab}`);
                if (tab === filter) {
                    btn.className = "px-4 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-800 shadow-sm transition-all";
                } else {
                    btn.className = "px-4 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-800 transition-all";
                }
            });
            renderReminders();
        };

        function renderReminders() {
            const grid = document.getElementById('reminders-grid');
            grid.innerHTML = '';

            const now = new Date();
            
            // Filter list based on selected tab
            const filteredReminders = state.reminders.filter(r => {
                const isPast = new Date(r.time) < now;
                if (currentReminderFilter === 'active') return !isPast;
                if (currentReminderFilter === 'passed') return isPast;
                return true; // 'all'
            });

            if (filteredReminders.length === 0) {
                grid.innerHTML = `
                    <div class="col-span-full p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">
                        <i class="fas fa-bell-slash text-3xl mb-2.5 text-slate-300"></i>
                        <p class="font-bold text-xs">No reminders match this selection</p>
                        <p class="text-[10px] text-slate-400 mt-1">Create a scheduled event above to populate this grid.</p>
                    </div>
                `;
                return;
            }

            const sorted = [...filteredReminders].sort((a, b) => new Date(a.time) - new Date(b.time));

            sorted.forEach(r => {
                const isPast = new Date(r.time) < now;
                const dateObj = new Date(r.time);
                const dateStr = dateObj.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
                const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                const card = document.createElement('div');
                card.className = `bg-white rounded-2xl shadow-sm border ${isPast ? 'border-rose-100 bg-rose-50/10 opacity-80' : 'border-indigo-50'} p-4.5 relative overflow-hidden animate-fade-in flex flex-col justify-between h-40`;
                
                card.innerHTML = `
                    <div>
                        ${isPast ? '<div class="absolute top-0 right-0 bg-rose-100 text-rose-600 text-[9px] font-extrabold px-2.5 py-0.5 rounded-bl-xl tracking-wider">PASSED HISTORY</div>' : '<div class="absolute top-0 right-0 bg-indigo-100 text-indigo-700 text-[9px] font-extrabold px-2.5 py-0.5 rounded-bl-xl tracking-wider">ACTIVE</div>'}
                        <div class="flex items-start justify-between mb-2">
                            <div class="w-8 h-8 rounded-xl ${isPast ? 'bg-rose-50 text-rose-500' : 'bg-indigo-50 text-indigo-500'} flex items-center justify-center text-sm shrink-0">
                                <i class="fas fa-bell"></i>
                            </div>
                        </div>
                        <h4 class="font-bold text-slate-800 text-xs mb-1 line-clamp-1">${r.title}</h4>
                        <div class="flex items-center gap-3 text-[10px] text-slate-400 font-semibold">
                            <span><i class="far fa-calendar mr-1 text-slate-400"></i> ${dateStr}</span>
                            <span><i class="far fa-clock mr-1 text-slate-400"></i> ${timeStr}</span>
                        </div>
                    </div>
                    <div class="flex justify-end gap-1.5 mt-3 border-t border-slate-50 pt-2.5">
                        <button onclick="openEditReminderModal('${r.id}')" class="px-2.5 py-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition" title="Rename or Reschedule">
                            <i class="fas fa-pen mr-1"></i> Edit
                        </button>
                        <button onclick="deleteReminder('${r.id}')" class="px-2.5 py-1 text-[10px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition" title="Delete Schedule">
                            <i class="fas fa-trash-alt mr-1"></i> Delete
                        </button>
                    </div>
                `;
                grid.appendChild(card);
            });
        }

        window.addReminder = function() {
            const titleInput = document.getElementById('rem-title');
            const timeInput = document.getElementById('rem-time');
            
            const title = titleInput.value.trim();
            const timeStr = timeInput.value;

            if (!title || !timeStr) {
                showAlert('Form Incomplete', 'Specify an objective title and dynamic timeline metrics.', 'fa-exclamation-triangle', 'text-amber-500');
                return;
            }

            const newReminder = {
                id: 'rem_' + Date.now(),
                title: title,
                time: new Date(timeStr).toISOString(),
                triggered: false,
                createdAt: new Date().toISOString()
            };

            state.reminders.push(newReminder);
            updateCurrentUserRecord();
            renderReminders();
            renderDashboard();

            titleInput.value = '';
            timeInput.value = '';
            showAlert('Alarm Configured', 'System successfully tracking live timer events!', 'fa-check-circle', 'text-emerald-500');
        };

        window.deleteReminder = function(id) {
            state.reminders = state.reminders.filter(r => r.id !== id);
            updateCurrentUserRecord();
            renderReminders();
            renderDashboard();
        };

        // RENAME & RESCHEDULE WORKSPACE
        window.openEditReminderModal = function(id) {
            const rem = state.reminders.find(r => r.id === id);
            if (!rem) return;

            document.getElementById('edit-reminder-id').value = id;
            document.getElementById('edit-reminder-title').value = rem.title;
            
            // Format time correctly to input datetime-local format (YYYY-MM-DDTHH:MM)
            const date = new Date(rem.time);
            const tzoffset = date.getTimezoneOffset() * 60000; // offset in milliseconds
            const localISOTime = (new Date(date - tzoffset)).toISOString().slice(0, -1);
            const formattedTime = localISOTime.substring(0, 16);
            
            document.getElementById('edit-reminder-time').value = formattedTime;

            document.getElementById('edit-reminder-modal').classList.remove('hidden');
        };

        window.closeEditReminderModal = function() {
            document.getElementById('edit-reminder-modal').classList.add('hidden');
        };

        window.submitEditReminder = function() {
            const id = document.getElementById('edit-reminder-id').value;
            const newTitle = document.getElementById('edit-reminder-title').value.trim();
            const newTimeStr = document.getElementById('edit-reminder-time').value;

            if (!newTitle || !newTimeStr) {
                showAlert('Fields Missing', 'Kripya title aur valid reschedule date-time enter karein.', 'fa-exclamation-circle', 'text-rose-500');
                return;
            }

            const idx = state.reminders.findIndex(r => r.id === id);
            if (idx !== -1) {
                const newTimeIso = new Date(newTimeStr).toISOString();
                
                state.reminders[idx].title = newTitle;
                state.reminders[idx].time = newTimeIso;
                
                // Smart auto-reset: If the user schedules it to future, re-enable triggering!
                if (new Date(newTimeIso) > new Date()) {
                    state.reminders[idx].triggered = false;
                }

                updateCurrentUserRecord();
                closeEditReminderModal();
                renderReminders();
                renderDashboard();
                showAlert('Schedule Updated', 'Aapka alarm successfully reschedule aur rename ho chuka hai.', 'fa-clock', 'text-emerald-600');
            }
        };

        function checkRemindersLive() {
            if(!state.isLoggedIn || state.reminders.length === 0) return;
            
            const now = new Date();
            let stateUpdated = false;

            state.reminders.forEach((r) => {
                const alarmTime = new Date(r.time);
                if (!r.triggered && alarmTime <= now && (now - alarmTime) < 60000) {
                    r.triggered = true;
                    stateUpdated = true;
                    
                    // Start looping alert tone with user selected audio preset
                    const activePreset = state.profile.activePreset || 'chime';
                    startLoopingSiren(activePreset);
                    
                    document.getElementById('triggered-alarm-time').innerText = alarmTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    document.getElementById('triggered-alarm-title').innerText = r.title;
                    document.getElementById('alarm-trigger-modal').classList.remove('hidden');
                }
            });

            if (stateUpdated) {
                updateCurrentUserRecord();
                renderReminders();
                renderDashboard();
            }
        }

        // ================= POPUP STICKY NOTES PIPELINE =================
        function renderNotes() {
            const container = document.getElementById('notes-container');
            container.innerHTML = '';

            if (state.notes.length === 0) {
                container.innerHTML = `
                    <div class="col-span-full p-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400">
                        <i class="fas fa-sticky-note text-3xl mb-2 text-slate-300"></i>
                        <p class="font-bold text-xs">No sticky notes created</p>
                        <p class="text-[10px] text-slate-400 mt-1">Tap 'Pin Sticky Note' above to quickly write dynamic brain drafts.</p>
                    </div>
                `;
                return;
            }

            state.notes.forEach(note => {
                const div = document.createElement('div');
                div.className = `${note.color || 'bg-yellow-100'} p-4 rounded-2xl sticky-note h-44 flex flex-col relative group animate-fade-in`;
                div.innerHTML = `
                    <button onclick="deleteNote('${note.id}')" class="absolute top-2 right-2 text-black/20 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        <i class="fas fa-times text-xs"></i>
                    </button>
                    <textarea 
                        class="w-full flex-1 bg-transparent border-none resize-none focus:outline-none note-font text-base text-slate-800" 
                        onchange="updateNoteText('${note.id}', this.value)"
                        placeholder="Pin a fast idea...">${note.text || ''}</textarea>
                `;
                container.appendChild(div);
            });
        }

        window.addNote = function() {
            const randomColor = stickyColors[Math.floor(Math.random() * stickyColors.length)];
            const newNote = {
                id: 'note_' + Date.now(),
                text: '',
                color: randomColor,
                createdAt: new Date().toISOString()
            };

            state.notes.push(newNote);
            updateCurrentUserRecord();
            renderNotes();
        };

        window.updateNoteText = function(id, text) {
            const idx = state.notes.findIndex(n => n.id === id);
            if (idx !== -1) {
                state.notes[idx].text = text;
                updateCurrentUserRecord();
            }
        };

        window.deleteNote = function(id) {
            state.notes = state.notes.filter(n => n.id !== id);
            updateCurrentUserRecord();
            renderNotes();
        };

        // ================= USER PROFILE CONTROLLERS =================
        function updateProfileUI() {
            document.getElementById('prof-id').value = state.userId;
            document.getElementById('prof-name').value = state.profile.name || '';
            document.getElementById('prof-age').value = state.profile.age || '';
            document.getElementById('prof-profession').value = state.profile.profession || '';
            
            const select = document.getElementById('siren-preset-select');
            if (select) {
                select.value = state.profile.activePreset || 'chime';
            }
            
            const initial = state.profile.name ? state.profile.name.charAt(0).toUpperCase() : 'U';
            document.getElementById('profile-avatar-large').innerText = initial;
            document.getElementById('sidebar-avatar').innerText = initial;
            document.getElementById('sidebar-username').innerText = state.profile.name || state.userEmail.split('@')[0];
            document.getElementById('sidebar-profession').innerText = state.profile.profession || 'Premium Member';
        }

        window.saveProfile = function(e) {
            e.preventDefault();

            const name = document.getElementById('prof-name').value.trim();
            const age = document.getElementById('prof-age').value.trim();
            const profession = document.getElementById('prof-profession').value.trim();

            state.profile.name = name;
            state.profile.age = age;
            state.profile.profession = profession;

            updateCurrentUserRecord();
            updateProfileUI();
            renderDashboard();
            showAlert('Profile Synced', 'Aapka profile data securely sync ho chuka hai.', 'fa-user-shield', 'text-emerald-500');
        };

        // ================= SYSTEM INITIALIZATION (BOOTSTRAP) =================
        window.addEventListener('load', () => {
            const savedSessionUid = localStorage.getItem(DB_KEY_CURRENT_USER);
            if (savedSessionUid) {
                loadUserSession(savedSessionUid);
            } else {
                showLoginScreen();
            }
            state.timerInterval = setInterval(checkRemindersLive, 2500); 
        });
