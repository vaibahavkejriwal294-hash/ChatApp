/* ============================================
   TEAM CHAT - JavaScript Functionality
   ============================================ */

// DOM Elements
const usernameModal = document.getElementById('usernameModal');
const usernameInput = document.getElementById('usernameInput');
const joinBtn = document.getElementById('joinBtn');
const chatContainer = document.getElementById('chatContainer');
const messagesWrapper = document.getElementById('messagesWrapper');
const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const fileInput = document.getElementById('fileInput');
const imageInput = document.getElementById('imageInput');
const videoInput = document.getElementById('videoInput');
const attachFileBtn = document.getElementById('attachFileBtn');
const attachImageBtn = document.getElementById('attachImageBtn');
const attachVideoBtn = document.getElementById('attachVideoBtn');
const filePreviewContainer = document.getElementById('filePreviewContainer');
const currentUsernameEl = document.getElementById('currentUsername');
const userAvatarEl = document.getElementById('userAvatar');
const editNameBtn = document.getElementById('editNameBtn');
const clearChatBtn = document.getElementById('clearChatBtn');
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.querySelector('.sidebar');
const voiceRecordBtn = document.getElementById('voiceRecordBtn');
const recordingIndicator = document.getElementById('recordingIndicator');
const recordingTimeEl = document.getElementById('recordingTime');

// New modals and elements
const searchModal = document.getElementById('searchModal');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const searchBtn = document.getElementById('searchBtn');
const closeSearchBtn = document.getElementById('closeSearchBtn');
const settingsModal = document.getElementById('settingsModal');
const settingsBtn = document.getElementById('settingsBtn');
const editGroupNameInput = document.getElementById('editGroupNameInput');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
const newChatModal = document.getElementById('newChatModal');
const newChatBtn = document.getElementById('newChatBtn');
const groupNameInput = document.getElementById('groupNameInput');
const createGroupBtn = document.getElementById('createGroupBtn');
const cancelNewChatBtn = document.getElementById('cancelNewChatBtn');
const headerGroupName = document.getElementById('headerGroupName');
const headerGroupAvatar = document.getElementById('headerGroupAvatar');
const groupNameDisplay = document.getElementById('groupNameDisplay');
const groupAvatarSidebar = document.getElementById('groupAvatarSidebar');
const sidebarGroupName = document.getElementById('sidebarGroupName');

// Custom Modals
const confirmModal = document.getElementById('confirmModal');
const confirmTitle = document.getElementById('confirmTitle');
const confirmMessage = document.getElementById('confirmMessage');
const confirmOkBtn = document.getElementById('confirmOkBtn');
const confirmCancelBtn = document.getElementById('confirmCancelBtn');

const alertModal = document.getElementById('alertModal');
const alertTitle = document.getElementById('alertTitle');
const alertMessage = document.getElementById('alertMessage');
const alertOkBtn = document.getElementById('alertOkBtn');

// State
let currentUser = localStorage.getItem('chatUsername') || '';
let groupName = localStorage.getItem('chatGroupName') || 'Team Chat';
let pendingFiles = [];
let messages = [];

// Supabase Configuration
const supabaseUrl = 'https://whrlppccdctfabikllbx.supabase.co';
const supabaseKey = 'sb_publishable_sqH-t24Yl4ENXy_p5JuPzw_kCnO97e3';
let supabaseClient = null;
try {
    if (typeof supabase !== 'undefined') {
        supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
    } else {
        console.error('Supabase SDK not loaded.');
    }
} catch (e) {
    console.error('Error initializing Supabase:', e);
}

// Voice Recording State
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let recordingStartTime = null;
let recordingTimer = null;

// ============================================
// INITIALIZATION
// ============================================

function init() {
    loadMessages();
    setupRealtimeSubscription();
    updateGroupDisplay();

    if (currentUser) {
        showChat();
        updateUserDisplay();
    } else {
        showModal();
    }

    setupEventListeners();
    renderMessages();
}

function showModal() {
    usernameModal.classList.remove('hidden');
    chatContainer.classList.remove('active');
    usernameInput.focus();
}

function showChat() {
    usernameModal.classList.add('hidden');
    chatContainer.classList.add('active');
    messageInput.focus();
}

function updateUserDisplay() {
    currentUsernameEl.textContent = currentUser;
    userAvatarEl.textContent = currentUser.charAt(0).toUpperCase();
}

function updateGroupDisplay() {
    const initials = groupName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
    headerGroupName.textContent = groupName;
    headerGroupAvatar.textContent = initials;
    groupNameDisplay.textContent = groupName;
    groupAvatarSidebar.innerHTML = `<span>${initials}</span>`;
    sidebarGroupName.textContent = groupName;
    document.title = `${groupName} | Group Messaging`;
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    // Join chat
    joinBtn.addEventListener('click', handleJoin);
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleJoin();
    });

    // Send message
    sendBtn.addEventListener('click', handleSendMessage);
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });

    // Auto-resize textarea
    messageInput.addEventListener('input', autoResizeTextarea);

    // File inputs
    attachFileBtn.addEventListener('click', () => fileInput.click());
    attachImageBtn.addEventListener('click', () => imageInput.click());
    attachVideoBtn.addEventListener('click', () => videoInput.click());

    fileInput.addEventListener('change', (e) => handleFileSelect(e, 'file'));
    imageInput.addEventListener('change', (e) => handleFileSelect(e, 'image'));
    videoInput.addEventListener('change', (e) => handleFileSelect(e, 'video'));

    // Voice recording
    voiceRecordBtn.addEventListener('click', toggleVoiceRecording);

    // Edit name
    editNameBtn.addEventListener('click', handleEditName);

    // Clear chat
    clearChatBtn.addEventListener('click', handleClearChat);

    // Mobile menu toggle
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });

    // Close sidebar on outside click (mobile)
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 &&
            !sidebar.contains(e.target) &&
            !menuToggle.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    });

    // Search
    searchBtn.addEventListener('click', openSearchModal);
    closeSearchBtn.addEventListener('click', closeSearchModal);
    searchInput.addEventListener('input', handleSearch);

    // Settings
    settingsBtn.addEventListener('click', openSettingsModal);
    saveSettingsBtn.addEventListener('click', saveSettings);
    cancelSettingsBtn.addEventListener('click', closeSettingsModal);

    // New Chat
    newChatBtn.addEventListener('click', openNewChatModal);
    createGroupBtn.addEventListener('click', createNewGroup);
    cancelNewChatBtn.addEventListener('click', closeNewChatModal);
}

// ============================================
// USER MANAGEMENT
// ============================================

function handleJoin() {
    const name = usernameInput.value.trim();
    if (name.length < 2) {
        usernameInput.style.borderColor = '#ef4444';
        usernameInput.focus();
        return;
    }

    currentUser = name;
    localStorage.setItem('chatUsername', name);
    updateUserDisplay();
    showChat();

    // Add join message
    addSystemMessage(`${name} joined the chat`);
}

function handleEditName() {
    const newName = prompt('Enter your new name:', currentUser);
    if (newName && newName.trim().length >= 2) {
        const oldName = currentUser;
        currentUser = newName.trim();
        localStorage.setItem('chatUsername', currentUser);
        updateUserDisplay();
        addSystemMessage(`${oldName} changed their name to ${currentUser}`);
    }
}

// ============================================
// MESSAGE HANDLING
// ============================================

function handleSendMessage() {
    const text = messageInput.value.trim();

    if (!text && pendingFiles.length === 0) return;

    const message = {
        id: Date.now(),
        sender: currentUser,
        text: text,
        files: [...pendingFiles],
        timestamp: new Date().toISOString()
    };

    saveMessageToSupabase(message);

    // Clear input
    messageInput.value = '';
    autoResizeTextarea();

    // Clear file previews
    pendingFiles = [];
    renderFilePreviews();

    // Scroll to bottom
    scrollToBottom();
}

function addSystemMessage(text) {
    const sysMsg = {
        id: Date.now(),
        type: 'system',
        text: text,
        timestamp: new Date().toISOString()
    };
    saveMessageToSupabase(sysMsg);
}

function renderMessages() {
    messagesWrapper.innerHTML = '';

    // Default welcome if no messages
    if (messages.length === 0) {
        messagesWrapper.innerHTML = `
            <div class="system-message">
                <span>Welcome to ${groupName}! Start the conversation 🎉</span>
            </div>
        `;
        return;
    }

    messages.forEach(msg => {
        if (msg.type === 'system') {
            const div = document.createElement('div');
            div.className = 'system-message';
            div.innerHTML = `<span>${escapeHtml(msg.text)}</span>`;
            messagesWrapper.appendChild(div);
        } else {
            renderMessage(msg, false);
        }
    });

    scrollToBottom();
}

function renderMessage(message, animate = true) {
    const isSent = message.sender === currentUser;

    const div = document.createElement('div');
    div.className = `message ${isSent ? 'sent' : 'received'}`;
    div.setAttribute('data-message-id', message.id);
    if (!animate) div.style.animation = 'none';

    const time = formatTime(message.timestamp);

    let mediaHtml = '';

    if (message.files && message.files.length > 0) {
        message.files.forEach(file => {
            if (file.type === 'image') {
                mediaHtml += `
                    <div class="message-media">
                        <img src="${file.data}" alt="${escapeHtml(file.name)}" onclick="openLightbox(this.src)">
                    </div>
                `;
            } else if (file.type === 'video') {
                mediaHtml += `
                    <div class="message-media">
                        <video controls>
                            <source src="${file.data}" type="${file.mimeType}">
                        </video>
                    </div>
                `;
            } else if (file.type === 'voice') {
                const uniqueId = 'voice-' + message.id + '-' + Math.random().toString(36).substr(2, 9);
                mediaHtml += `
                    <div class="message-voice" data-voice-id="${uniqueId}">
                        <button class="voice-play-btn" onclick="toggleVoicePlayback('${uniqueId}')">
                            <span class="play-icon">▶</span>
                        </button>
                        <div class="voice-info">
                            <div class="voice-waveform">
                                ${generateWaveformBars()}
                            </div>
                            <span class="voice-duration">${file.duration || '0:00'}</span>
                        </div>
                        <audio id="${uniqueId}" src="${file.data}" onended="onVoiceEnded('${uniqueId}')"></audio>
                    </div>
                `;
            } else {
                mediaHtml += `
                    <div class="message-file">
                        <span class="file-icon">📄</span>
                        <div class="file-info">
                            <span class="file-name">${escapeHtml(file.name)}</span>
                            <span class="file-size">${formatFileSize(file.size)}</span>
                        </div>
                        <a href="${file.data}" download="${escapeHtml(file.name)}" class="file-download">Download</a>
                    </div>
                `;
            }
        });
    }

    div.innerHTML = `
        <div class="message-header">
            <span class="message-sender">${escapeHtml(message.sender)}</span>
            <span class="message-time">${time}</span>
        </div>
        <div class="message-bubble">
            ${message.text ? `<div class="message-text">${escapeHtml(message.text)}</div>` : ''}
            ${mediaHtml}
        </div>
    `;

    messagesWrapper.appendChild(div);
}

// ============================================
// FILE HANDLING
// ============================================

function handleFileSelect(event, type) {
    const files = Array.from(event.target.files);

    files.forEach(file => {
        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            showAlert('File Too Large', `File "${file.name}" is too large. Maximum size is 10MB.`);
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const fileData = {
                id: Date.now() + Math.random(),
                name: file.name,
                size: file.size,
                mimeType: file.type,
                type: type,
                data: e.target.result
            };

            pendingFiles.push(fileData);
            renderFilePreviews();
        };
        reader.readAsDataURL(file);
    });

    event.target.value = '';
}

function renderFilePreviews() {
    if (pendingFiles.length === 0) {
        filePreviewContainer.classList.remove('active');
        filePreviewContainer.innerHTML = '';
        return;
    }

    filePreviewContainer.classList.add('active');
    filePreviewContainer.innerHTML = '';

    pendingFiles.forEach((file, index) => {
        const div = document.createElement('div');
        div.className = 'file-preview-item';

        let previewContent = '';

        if (file.type === 'image') {
            previewContent = `<img src="${file.data}" alt="${escapeHtml(file.name)}">`;
        } else if (file.type === 'video') {
            previewContent = `<video src="${file.data}" muted></video>`;
        } else {
            previewContent = `<span class="file-icon" style="font-size: 2rem;">📄</span>`;
        }

        div.innerHTML = `
            ${previewContent}
            <div class="file-preview-info">
                <span class="file-preview-name">${escapeHtml(file.name)}</span>
                <span class="file-preview-size">${formatFileSize(file.size)}</span>
            </div>
            <button class="file-preview-remove" onclick="removePreviewFile(${index})">×</button>
        `;

        filePreviewContainer.appendChild(div);
    });
}

function removePreviewFile(index) {
    pendingFiles.splice(index, 1);
    renderFilePreviews();
}

// ============================================
// LIGHTBOX
// ============================================

function openLightbox(src) {
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.innerHTML = `
        <button class="lightbox-close">×</button>
        <img src="${src}" alt="Full size image">
    `;

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox || e.target.classList.contains('lightbox-close')) {
            lightbox.remove();
        }
    });

    document.body.appendChild(lightbox);
}

// ============================================
// VOICE RECORDING
// ============================================

async function toggleVoiceRecording() {
    if (isRecording) {
        stopRecording();
    } else {
        await startRecording();
    }
}

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                audioChunks.push(e.data);
            }
        };

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const reader = new FileReader();

            reader.onload = (e) => {
                const duration = formatRecordingTime(Date.now() - recordingStartTime);

                const voiceData = {
                    id: Date.now() + Math.random(),
                    name: 'Voice Message',
                    size: audioBlob.size,
                    mimeType: 'audio/webm',
                    type: 'voice',
                    data: e.target.result,
                    duration: duration
                };

                pendingFiles.push(voiceData);
                handleSendMessage();
            };

            reader.readAsDataURL(audioBlob);
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        isRecording = true;
        recordingStartTime = Date.now();

        voiceRecordBtn.classList.add('recording');
        recordingIndicator.classList.add('active');

        updateRecordingTime();
        recordingTimer = setInterval(updateRecordingTime, 1000);

    } catch (error) {
        console.error('Error starting recording:', error);
        showAlert('Microphone Error', 'Could not access microphone. Please allow microphone access and try again.');
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }

    isRecording = false;
    voiceRecordBtn.classList.remove('recording');
    recordingIndicator.classList.remove('active');
    clearInterval(recordingTimer);
    recordingTimeEl.textContent = '0:00';
}

function updateRecordingTime() {
    const elapsed = Date.now() - recordingStartTime;
    recordingTimeEl.textContent = formatRecordingTime(elapsed);
}

function formatRecordingTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function generateWaveformBars() {
    let bars = '';
    for (let i = 0; i < 20; i++) {
        const height = Math.random() * 16 + 8;
        bars += `<div class="voice-bar" style="height: ${height}px;"></div>`;
    }
    return bars;
}

function toggleVoicePlayback(audioId) {
    const audio = document.getElementById(audioId);
    const container = document.querySelector(`[data-voice-id="${audioId}"]`);
    const playBtn = container.querySelector('.voice-play-btn');
    const playIcon = playBtn.querySelector('.play-icon');

    if (audio.paused) {
        document.querySelectorAll('.message-voice audio').forEach(a => {
            if (a.id !== audioId && !a.paused) {
                a.pause();
                a.currentTime = 0;
                const otherContainer = document.querySelector(`[data-voice-id="${a.id}"]`);
                if (otherContainer) {
                    otherContainer.querySelector('.play-icon').textContent = '▶';
                    otherContainer.querySelectorAll('.voice-bar').forEach(bar => bar.classList.remove('active'));
                }
            }
        });

        audio.play();
        playIcon.textContent = '⏸';
        animateWaveform(container, true);
    } else {
        audio.pause();
        playIcon.textContent = '▶';
        animateWaveform(container, false);
    }
}

function onVoiceEnded(audioId) {
    const container = document.querySelector(`[data-voice-id="${audioId}"]`);
    if (container) {
        container.querySelector('.play-icon').textContent = '▶';
        animateWaveform(container, false);
    }
}

function animateWaveform(container, playing) {
    const bars = container.querySelectorAll('.voice-bar');
    bars.forEach(bar => {
        if (playing) {
            bar.classList.add('active');
        } else {
            bar.classList.remove('active');
        }
    });
}

// ============================================
// SEARCH FUNCTIONALITY
// ============================================

function openSearchModal() {
    searchModal.classList.remove('hidden');
    searchInput.value = '';
    searchResults.innerHTML = '<p class="search-hint">Type to search through messages...</p>';
    searchInput.focus();
}

function closeSearchModal() {
    searchModal.classList.add('hidden');
}

function handleSearch() {
    const query = searchInput.value.trim().toLowerCase();
    if (query.length < 2) {
        searchResults.innerHTML = '<p class="search-hint">Type at least 2 characters to search...</p>';
        return;
    }

    const filtered = messages.filter(msg =>
        (msg.text && msg.text.toLowerCase().includes(query)) ||
        (msg.sender && msg.sender.toLowerCase().includes(query))
    );

    if (filtered.length === 0) {
        searchResults.innerHTML = '<p class="no-results">No messages found matching your search.</p>';
        return;
    }

    searchResults.innerHTML = filtered.map(msg => `
        <div class="search-result-item" onclick="jumpToMessage('${msg.id}')">
            <div class="search-result-sender">${escapeHtml(msg.sender)}</div>
            <div class="search-result-text">${highlightText(msg.text || '', query)}</div>
            <div class="search-result-time">${formatTime(msg.timestamp)}</div>
        </div>
    `).join('');
}

function highlightText(text, query) {
    const escapedText = escapeHtml(text);
    const regex = new RegExp(`(${query})`, 'gi');
    return escapedText.replace(regex, '<mark>$1</mark>');
}

function jumpToMessage(msgId) {
    closeSearchModal();
    const element = document.querySelector(`[data-message-id="${msgId}"]`);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('highlight-flash');
        setTimeout(() => element.classList.remove('highlight-flash'), 2000);
    }
}

// ============================================
// SETTINGS & GROUP MANAGEMENT
// ============================================

function openSettingsModal() {
    settingsModal.classList.remove('hidden');
    editGroupNameInput.value = groupName;
    editGroupNameInput.focus();
}

function closeSettingsModal() {
    settingsModal.classList.add('hidden');
}

function saveSettings() {
    const newName = editGroupNameInput.value.trim();
    if (newName) {
        groupName = newName;
        localStorage.setItem('chatGroupName', groupName);
        updateGroupDisplay();
        closeSettingsModal();
        addSystemMessage(`Group name changed to "${groupName}"`);
    }
}

function openNewChatModal() {
    newChatModal.classList.remove('hidden');
    groupNameInput.value = '';
    groupNameInput.focus();
}

function closeNewChatModal() {
    newChatModal.classList.add('hidden');
}

function createNewGroup() {
    const newName = groupNameInput.value.trim();
    if (!newName) return;

    closeNewChatModal();

    showConfirm(
        'Create New Group?',
        'Creating a new group will clear the current chat history. Continue?',
        () => {
            groupName = newName;
            localStorage.setItem('chatGroupName', groupName);
            messages = [];
            localStorage.removeItem('chatMessages');
            updateGroupDisplay();
            renderMessages();
            addSystemMessage(`Welcome to the new group: ${groupName}! 🎉`);
        }
    );
}

// ============================================
// STORAGE
// ============================================

async function saveMessageToSupabase(message) {
    try {
        const { error } = await supabaseClient
            .from('messages')
            .insert([{
                content: message.text,
                sender: message.sender,
                type: message.type || 'text',
                created_at: message.timestamp,
                // Store file metadata if present
                file_url: message.files && message.files.length > 0 ? message.files[0].data : null,
                file_name: message.files && message.files.length > 0 ? message.files[0].name : null,
                file_size: message.files && message.files.length > 0 ? message.files[0].size : null
            }]);

        if (error) throw error;
    } catch (e) {
        console.error('Error saving message:', e);
        showAlert('Error', 'Failed to send message. Please check your connection.');
    }
}

async function loadMessages() {
    try {
        const { data, error } = await supabaseClient
            .from('messages')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error;

        if (data) {
            messages = data.map(msg => ({
                id: msg.id,
                sender: msg.sender,
                text: msg.content,
                timestamp: msg.created_at,
                files: msg.file_url ? [{
                    name: msg.file_name,
                    size: msg.file_size,
                    data: msg.file_url,
                    type: 'file' // Basic mapping, would need more robust type handling
                }] : []
            }));
            renderMessages();
        }
    } catch (e) {
        console.error('Error loading messages:', e);
        // Fallback to empty or show error
    }
}

function setupRealtimeSubscription() {
    if (!supabaseClient) return;

    supabaseClient
        .channel('public:messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
            const newMsg = payload.new;
            const message = {
                id: newMsg.id,
                sender: newMsg.sender,
                text: newMsg.content,
                timestamp: newMsg.created_at,
                files: newMsg.file_url ? [{
                    name: newMsg.file_name,
                    size: newMsg.file_size,
                    data: newMsg.file_url,
                    type: 'file'
                }] : []
            };

            // Avoid duplicating if we just sent it (though ID check handles this usually)
            if (!messages.find(m => m.id === message.id)) {
                messages.push(message);
                renderMessage(message);
                scrollToBottom();
            }
        })
        .subscribe();
}

function handleClearChat() {
    showConfirm(
        'Clear Chat History?',
        'Are you sure you want to clear all messages? This cannot be undone.',
        () => {
            messages = [];
            localStorage.removeItem('chatMessages');
            renderMessages();

            // Close sidebar on mobile if open
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('active');
            }
        }
    );
}

// ============================================
// CUSTOM MODAL HELPERS
// ============================================

function showConfirm(title, message, onConfirm) {
    confirmTitle.textContent = title;
    confirmMessage.textContent = message;
    confirmModal.classList.remove('hidden');

    const handleConfirm = () => {
        onConfirm();
        closeConfirm();
    };

    const closeConfirm = () => {
        confirmModal.classList.add('hidden');
        confirmOkBtn.removeEventListener('click', handleConfirm);
        confirmCancelBtn.removeEventListener('click', closeConfirm);
    };

    confirmOkBtn.addEventListener('click', handleConfirm);
    confirmCancelBtn.addEventListener('click', closeConfirm);
}

function showAlert(title, message) {
    alertTitle.textContent = title;
    alertMessage.textContent = message;
    alertModal.classList.remove('hidden');

    const closeAlert = () => {
        alertModal.classList.add('hidden');
        alertOkBtn.removeEventListener('click', closeAlert);
    };

    alertOkBtn.addEventListener('click', closeAlert);
}

// ============================================
// UTILITIES
// ============================================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function autoResizeTextarea() {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 150) + 'px';
}

function scrollToBottom() {
    setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 50);
}

// Make functions globally available for inline onclick handlers
window.toggleVoicePlayback = toggleVoicePlayback;
window.onVoiceEnded = onVoiceEnded;
window.openLightbox = openLightbox;
window.jumpToMessage = jumpToMessage;
window.removePreviewFile = removePreviewFile;

// Initialize the app
document.addEventListener('DOMContentLoaded', init);
