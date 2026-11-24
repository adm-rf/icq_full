import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, FlatList, Modal, Image } from 'react-native';
import { io, Socket } from 'socket.io-client';

const API_URL = 'http://185.123.195.44:3000';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  
  const [conversations, setConversations] = useState([]);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatName, setNewChatName] = useState('');
  const [chatType, setChatType] = useState<'direct' | 'group'>('group');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [wsStatus, setWsStatus] = useState('Подключение...');
  
  // Polling interval для fallback
  const pollingIntervalRef = useRef<any>(null);
  const conversationsRef = useRef(conversations);
  const activeChatRef = useRef(activeChat);
  const toastTimer = useRef<any>(null);

  useEffect(() => { conversationsRef.current = conversations; }, [conversations]);
  useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);

  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMsgSearch, setShowMsgSearch] = useState(false);
  const [msgSearchQuery, setMsgSearchQuery] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const recordingInterval = useRef<any>(null);
  const [notifEnabled, setNotifEnabled] = useState(localStorage.getItem('notificationsEnabled') !== '0');
  const [toast, setToast] = useState(null);
  const [profileName, setProfileName] = useState('');
  const [profileStatus, setProfileStatus] = useState('');
  const [profileAvatar, setProfileAvatar] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    if (token && userData) {
      setIsLoggedIn(true);
      setUser(JSON.parse(userData));
      loadConversations();
      loadUsers();
    }
  }, []);

  // Подключаем WebSocket с улучшенными настройками стабильности
  useEffect(() => {
    if (user) {
      console.log('🔌 Попытка подключения WebSocket...');
      setWsStatus('Подключение...');
      
      const newSocket = io(API_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
        randomizationFactor: 0.5,
        timeout: 30000,
        forceNew: false,
        autoConnect: true
      });
      
      // Heartbeat проверка - если нет активности 30с, форсим reconnect
      let lastMessageTime = Date.now();
      let heartbeatInterval: NodeJS.Timeout | null = null;
      
      const startHeartbeatCheck = () => {
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        heartbeatInterval = setInterval(() => {
          const timeSinceLastMessage = Date.now() - lastMessageTime;
          if (timeSinceLastMessage > 30000 && newSocket.connected) {
            console.warn('⚠️ Heartbeat timeout - нет сообщений 30с, форсируем reconnect');
            newSocket.disconnect();
            newSocket.connect();
          }
        }, 10000);
      };
      
      newSocket.on('connect', () => {
        console.log('✅ WebSocket подключен:', newSocket.id);
        setWsStatus('Online');
        lastMessageTime = Date.now();
        newSocket.emit('register', user.id);
        console.log(`📤 Зарегистрирован в комнате user_${user.id}`);
        startHeartbeatCheck();
      });
      
      newSocket.on('reconnect_attempt', (attemptNumber: number) => {
        console.log(`🔄 Попытка переподключения #${attemptNumber}...`);
        setWsStatus(`Переподключение (${attemptNumber})...`);
      });
      
      newSocket.on('reconnect', (attemptNumber: number) => {
        console.log(`✅ Успешная переподключение после ${attemptNumber} попыток`);
        setWsStatus('Online');
        newSocket.emit('register', user.id);
        lastMessageTime = Date.now();
        startHeartbeatCheck();
      });
      
      newSocket.on('reconnect_error', (error) => {
        console.error('❌ Ошибка переподключения:', error.message);
      });
      
      newSocket.on('reconnect_failed', () => {
        console.error('❌ Все попытки переподключения исчерпаны');
        setWsStatus('Offline - повторите позже');
      });
      
      newSocket.on('newMessage', (data) => {
        console.log('📨 ПОЛУЧЕНО НОВОЕ СООБЩЕНИЕ:', data);

        if (data.message && data.message.senderId !== (user?.id || 1)) {
          fetch(`${API_URL}/api/conversations/${data.chatId}/messages/${data.message.id}/delivered`, { method: 'PATCH', headers: getAuthHeaders() }).catch(() => {});
          if (activeChat && data.chatId === activeChat.id) {
            fetch(`${API_URL}/api/conversations/${data.chatId}/messages/${data.message.id}/read`, { method: 'PATCH', headers: getAuthHeaders() }).catch(() => {});
          }
          const isActive = activeChatRef.current && activeChatRef.current.id === data.chatId;
          if (!isActive && localStorage.getItem('notificationsEnabled') !== '0') {
            showNotification(data.message.senderName || 'Новое сообщение', data.message.content, data.chatId);
          }
        }
        lastMessageTime = Date.now();
        
        if (activeChat && data.chatId === activeChat.id) {
          setMessages(prev => {
            if (prev.some(m => m.id === data.message.id)) {
              return prev;
            }
            return [...prev, data.message];
          });
        }
        
        loadConversations();
      });
      
      newSocket.on('newChat', (chat) => {
        console.log('📬 Получен новый чат:', chat);
        lastMessageTime = Date.now();
        loadConversations();
      });
      
      newSocket.on('chatDeleted', (data) => {
        console.log('🗑️ Чат удален:', data);
        lastMessageTime = Date.now();
        if (activeChat && activeChat.id === data.chatId) {
          closeChat();
        }
        loadConversations();
      });
      
      // Обработка событий онлайн/оффлайн других пользователей
      newSocket.on('userOnline', (data) => {
        console.log(`🟢 Пользователь ${data.userId} онлайн`);
        // Можно обновить состояние списка пользователей
        loadUsers();
      });
      
      newSocket.on('userOffline', (data) => {
        console.log(`🔴 Пользователь ${data.userId} оффлайн`);
        // Можно обновить состояние списка пользователей
        loadUsers();
      });
      
      newSocket.on('messageDelivered', (data) => {
        setMessages(prev => prev.map(m => m.id === data.messageId && m.status === 'sent' ? { ...m, status: 'delivered' } : m));
      });

      newSocket.on('messageRead', (data) => {
        setMessages(prev => prev.map(m => m.id === data.messageId ? { ...m, status: 'read' } : m));
      });

      newSocket.on('disconnect', (reason) => {
        console.log('❌ WebSocket отключен:', reason);
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        setWsStatus('Offline');
      });
      
      newSocket.on('connect_error', (error) => {
        console.error('❌ Ошибка подключения WebSocket:', error.message);
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        setWsStatus('Ошибка подключения');
      });
      
      setSocket(newSocket);
      
      return () => {
        console.log('🔌 Отключение WebSocket...');
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        newSocket.disconnect();
      };
    }
  }, [user]);

  // Polling как fallback (каждые 3 секунды)
  useEffect(() => {
    if (isLoggedIn && user) {
      pollingIntervalRef.current = setInterval(() => {
        loadConversations();
        
        if (activeChat) {
          loadMessages(activeChat.id);
        }
      }, 3000);
      
      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, [isLoggedIn, user, activeChat]);

  useEffect(() => {
    if (socket && activeChat) {
      console.log('💬 Присоединение к комнате чата:', activeChat.id);
      socket.emit('joinChat', activeChat.id);
    }
  }, [socket, activeChat]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const loadConversations = async () => {
    try {
      const response = await fetch(`${API_URL}/api/conversations`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (data.success) {
        setConversations(data.data || []);
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки чатов:', error);
    }
  };

  const loadMessages = async (chatId) => {
    try {
      const response = await fetch(`${API_URL}/api/conversations/${chatId}/messages`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (data.success) {
        setMessages(prev => {
          if (prev.length === data.data.length) {
            return prev;
          }
          return data.data || [];
        });
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки сообщений:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (data.success) setUsers(data.data || []);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const openChat = async (chat) => {
    console.log('📂 Открытие чата:', chat.id, chat.name);
    setActiveChat(chat);
    setNewMessage('');
    
    try {
      const response = await fetch(`${API_URL}/api/conversations/${chat.id}/messages`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (data.success) {
        setMessages(data.data || []);
        (data.data || []).forEach((m) => {
          if (m.senderId !== (user?.id || 1) && m.status !== 'read') {
            fetch(`${API_URL}/api/conversations/${chat.id}/messages/${m.id}/read`, { method: 'PATCH', headers: getAuthHeaders() }).catch(() => {});
          }
        });
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const closeChat = () => {
    setActiveChat(null);
    setMessages([]);
    setNewMessage('');
  };

  const handleRegister = async () => {
    if (!username || !email || !password) {
      setStatus(' Заполните все поля!'); return;
    }
    setLoading(true); setStatus('🔄 Регистрация...');
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, username }),
      });
      const data = await response.json();
      if (data.success) {
        setStatus('✅ Регистрация успешна! Теперь войдите.');
        setUsername(''); setEmail(''); setPassword('');
      } else {
        setStatus(`❌ Ошибка: ${data.message || 'Неизвестная ошибка'}`);
      }
    } catch (error) {
      setStatus(`❌ Ошибка подключения: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setStatus(' Введите email и пароль!'); return;
    }
    setLoading(true); setStatus('🔄 Вход...');
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (data.success) {
        const token = data.data?.tokens?.accessToken;
        const userData = data.data?.user;
        if (!token || !userData) {
          setStatus('❌ Ошибка структуры ответа сервера');
          setLoading(false);
          return;
        }
        localStorage.setItem('authToken', token);
        localStorage.setItem('userData', JSON.stringify(userData));
        setIsLoggedIn(true);
        setUser(userData);
        setStatus('✅ Вход выполнен!');
        loadConversations();
        loadUsers();
      } else {
        setStatus(`❌ Ошибка: ${data.message || 'Неверный email или пароль'}`);
      }
    } catch (error) {
      setStatus(`❌ Ошибка подключения: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (socket) socket.disconnect();
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setIsLoggedIn(false);
    setUser(null);
    setConversations([]);
    setActiveChat(null);
    setStatus('Вы вышли из системы');
  };

  useEffect(() => {
    if (!showProfile) return;
    const timer = setTimeout(() => {
      const slot = document.getElementById('avatar-picker-slot');
      if (!slot || slot.childElementCount > 0) return;
      const inp = document.createElement('input');
      inp.type = 'file';
      inp.accept = 'image/*';
      inp.style.width = '100%';
      const status = document.createElement('div');
      status.style.fontSize = '12px';
      status.style.marginTop = '4px';
      status.style.color = '#333';
      const doUpload = async (file) => {
        status.textContent = '⏫ Загрузка: ' + file.name + '...';
        const fd = new FormData();
        fd.append('avatar', file);
        try {
          const r = await fetch(API_URL + '/api/profile/avatar', {
            method: 'POST',
            headers: { Authorization: 'Bearer ' + localStorage.getItem('authToken') },
            body: fd
          });
          const d = await r.json();
          if (d.success) {
            status.textContent = '✅ Аватар загружен!';
            setProfileAvatar(d.data.avatarUrl);
            const newData = { ...user, avatarUrl: d.data.avatarUrl };
            setUser(newData);
            localStorage.setItem('userData', JSON.stringify(newData));
          } else {
            status.textContent = '❌ Ошибка сервера: ' + (d.message || r.status);
          }
        } catch (e) {
          status.textContent = '❌ Ошибка сети: ' + e.message;
        }
      };
      inp.addEventListener('change', (ev) => {
        const f = ev.target.files && ev.target.files[0];
        if (f) doUpload(f);
      });
      slot.appendChild(inp);
      slot.appendChild(status);
    }, 200);
    return () => clearTimeout(timer);
  }, [showProfile]);

  const openChatById = (chatId) => {
    const target = conversationsRef.current.find(c => c.id === chatId);
    if (target) openChat(target);
  };

  const showNotification = (senderName, body, chatId) => {
    setToast({ title: senderName, body, chatId });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 5000);
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const n = new Notification('💬 ' + senderName, { body });
        n.onclick = () => { window.focus(); openChatById(chatId); n.close(); };
      } catch (e) { console.error(e); }
    }
  };

  const toggleNotifications = async () => {
    if (notifEnabled) {
      localStorage.setItem('notificationsEnabled', '0');
      setNotifEnabled(false);
      return;
    }
    localStorage.setItem('notificationsEnabled', '1');
    setNotifEnabled(true);
    if ('Notification' in window && Notification.permission === 'default') {
      try { await Notification.requestPermission(); } catch (e) {}
    }
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🔔 Уведомления включены', { body: 'Вы получите уведомление о новых сообщениях' });
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        
        // Отправляем на сервер
        const formData = new FormData();
        formData.append('voice', audioBlob, 'voice.webm');
        formData.append('duration', String(recordingDuration));

        try {
          const response = await fetch(`${API_URL}/api/voice`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });

          const result = await response.json();
          if (result.success) {
            // Отправляем сообщение в чат
            await handleSendMessage(result.data.fileUrl, 'voice', result.data.duration);
          }
        } catch (error) {
          console.error('Ошибка отправки голоса:', error);
        }

        setAudioChunks([]);
        setRecordingDuration(0);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setAudioChunks(chunks);
      setIsRecording(true);

      // Таймер
      let seconds = 0;
      recordingInterval.current = setInterval(() => {
        seconds += 1;
        setRecordingDuration(seconds);
      }, 1000);
    } catch (error) {
      console.error('Ошибка доступа к микрофону:', error);
      alert('Не удалось получить доступ к микрофону');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
        recordingInterval.current = null;
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
        recordingInterval.current = null;
      }
      setAudioChunks([]);
      setRecordingDuration(0);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const openProfile = async () => {
    setShowProfile(true);
    setProfileName(user?.username || '');
    setProfileStatus(user?.status || '');
    setProfileAvatar(user?.avatarUrl || null);
    try {
      const r = await fetch(API_URL + '/api/profile', { headers: getAuthHeaders() });
      const d = await r.json();
      if (d.success) {
        setProfileName(d.data.username || '');
        setProfileStatus(d.data.status || '');
        setProfileAvatar(d.data.avatarUrl || null);
      }
    } catch (e) { console.error(e); }
  };

  const saveProfile = async () => {
    try {
      const r = await fetch(API_URL + '/api/profile', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ username: profileName, status: profileStatus })
      });
      const d = await r.json();
      if (d.success) {
        const newData = { ...user, username: d.data.username, status: d.data.status, avatarUrl: d.data.avatarUrl };
        setUser(newData);
        localStorage.setItem('userData', JSON.stringify(newData));
        Alert.alert('✅ Успех', 'Профиль сохранён');
        setShowProfile(false);
      } else {
        Alert.alert('❌ Ошибка', d.message || 'Не удалось сохранить');
      }
    } catch (e) { Alert.alert('❌ Ошибка', e.message); }
  };

  const pickAvatar = () => {
    console.log('📷 pickAvatar вызван');
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    document.body.appendChild(input);
    input.onchange = async (ev) => {
      const file = ev.target.files[0];
      console.log('📷 Выбран файл:', file && file.name, file && file.size);
      if (!file) return;
      const fd = new FormData();
      fd.append('avatar', file);
      try {
        const r = await fetch(API_URL + '/api/profile/avatar', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + localStorage.getItem('authToken') },
          body: fd
        });
        console.log('📷 Статус ответа сервера:', r.status);
        const d = await r.json();
        if (d.success) {
          console.log('📷 Аватар сохранён:', d.data.avatarUrl);
          setProfileAvatar(d.data.avatarUrl);
          const newData = { ...user, avatarUrl: d.data.avatarUrl };
          setUser(newData);
          localStorage.setItem('userData', JSON.stringify(newData));
        } else {
          console.error('❌ Сервер ответил ошибкой:', d);
        }
      } catch (e) {
        console.error('❌ Ошибка загрузки аватара:', e);
      }
      input.remove();
    };
    input.click();
  };

  const toggleUserSelection = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreateConversation = async () => {
    if (chatType === 'direct' && selectedUsers.length === 0) {
      Alert.alert('Ошибка', 'Выберите пользователя для личного чата');
      return;
    }
    
    if (chatType === 'group' && selectedUsers.length === 0) {
      Alert.alert('Ошибка', 'Выберите хотя бы одного участника');
      return;
    }
    
    setLoading(true);
    try {
      const body: any = {
        type: chatType,
        participantIds: selectedUsers
      };
      
      if (chatType === 'group') {
        if (newChatName.trim()) {
          body.name = newChatName;
        } else {
          const selectedUserNames = users
            .filter(u => selectedUsers.includes(u.id))
            .map(u => u.username);
          body.name = `Группа: ${selectedUserNames.join(', ')}`;
        }
      }
      
      const response = await fetch(`${API_URL}/api/conversations`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });
      const data = await response.json();
      
      if (data.success) {
        Alert.alert('✅ Успех', `Чат "${data.data.name}" создан!`);
        setShowNewChatModal(false);
        setNewChatName('');
        setSelectedUsers([]);
        setChatType('group');
        await loadConversations();
      } else {
        Alert.alert('❌ Ошибка', data.message || 'Не удалось создать чат');
      }
    } catch (error) {
      Alert.alert('❌ Ошибка', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChat = async (chatId, chatName) => {
    if (!confirm(`Удалить чат "${chatName}"?`)) return;
    
    try {
      const response = await fetch(`${API_URL}/api/conversations/${chatId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        if (activeChat && activeChat.id === chatId) {
          closeChat();
        }
        await loadConversations();
      } else {
        Alert.alert('❌ Ошибка', data.message);
      }
    } catch (error) {
      Alert.alert('❌ Ошибка', error.message);
    }
  };

  const handleSendMessage = async (fileUrl?: string, type: string = 'text', duration?: number) => {
    if (!newMessage.trim() || !activeChat) return;
    
    const messageText = newMessage;
    setNewMessage('');
    
    try {
      const response = await fetch(`${API_URL}/api/conversations/${activeChat.id}/messages`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          content: messageText, 
          type: 'text',
          senderId: user?.id || 1,
          senderName: user?.username || 'admin'
        }),
      });
      const data = await response.json();
      
      if (data.success) {
        setMessages(prev => {
          if (prev.some(m => m.id === data.data.id)) {
            return prev;
          }
          return [...prev, data.data];
        });
        await loadConversations();
      } else {
        Alert.alert('❌ Ошибка', data.message);
        setNewMessage(messageText);
      }
    } catch (error) {
      Alert.alert('❌ Ошибка', error.message);
      setNewMessage(messageText);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const renderTicks = (msg) => {
    if (msg.senderId !== (user?.id || 1)) return null;
    if (msg.status === 'read') return <Text style={styles.ticksRead}>✓✓</Text>;
    if (msg.status === 'delivered') return <Text style={styles.ticks}>✓✓</Text>;
    return <Text style={styles.ticks}>✓</Text>;
  };

  const displayMessages = msgSearchQuery.trim()
    ? messages.filter(m => (m.content || '').toLowerCase().includes(msgSearchQuery.toLowerCase().trim()))
    : messages;

  const filteredConversations = conversations.filter(c =>
    (c.name || '').toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const foundUsers = searchQuery.trim()
    ? users.filter(u => u.id !== (user?.id || 1) && (u.username || '').toLowerCase().includes(searchQuery.toLowerCase().trim()))
    : [];

  const openOrCreateDirect = async (u) => {
    const existing = conversations.find(c => c.type === 'direct' && (c.participantIds || []).includes(u.id));
    if (existing) {
      openChat(existing);
      return;
    }
    try {
      const r = await fetch(API_URL + '/api/conversations', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ type: 'direct', participantIds: [u.id] })
      });
      const d = await r.json();
      if (d.success) {
        await loadConversations();
        openChat(d.data);
      } else {
        Alert.alert('❌ Ошибка', d.message || 'Не удалось создать чат');
      }
    } catch (e) { Alert.alert('❌ Ошибка', e.message); }
  };

  const getChatAvatar = (chat) => {
    if (chat.type === 'direct') {
      const otherId = (chat.participantIds || []).find(id => id !== (user?.id || 1));
      const other = users.find(u => u.id === otherId);
      return other?.avatarUrl || null;
    }
    return null;
  };

  const getChatInitial = (chat) => {
    if (chat.type === 'direct') {
      const otherId = (chat.participantIds || []).find(id => id !== (user?.id || 1));
      const other = users.find(u => u.id === otherId);
      return (other?.username || '?')[0].toUpperCase();
    }
    return (chat.name || 'G')[0].toUpperCase();
  };

  const renderMsgAvatar = (senderId) => {
    const u = users.find(x => x.id === senderId);
    if (u && u.avatarUrl) {
      return <Image source={{ uri: API_URL + '/' + u.avatarUrl }} style={styles.msgAvatar} />;
    }
    return (
      <View style={[styles.msgAvatar, { backgroundColor: getUserColor(senderId) }]}>
        <Text style={styles.msgAvatarLetter}>{((u && u.username) || 'U')[0].toUpperCase()}</Text>
      </View>
    );
  };

  const getUserColor = (userId) => {
    const colors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    return colors[userId % colors.length];
  };

  if (activeChat) {
    return (
      <View style={styles.container}>
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={closeChat} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Назад</Text>
          </TouchableOpacity>
          <View style={styles.chatHeaderInfo}>
            <Text style={styles.chatHeaderTitle}>{activeChat.name}</Text>
            <Text style={styles.chatHeaderSubtitle}>
              {activeChat.type === 'group' ? 'Групповой чат' : 'Личный чат'}
              <Text style={[styles.onlineIndicator, wsStatus === 'Online' ? styles.online : styles.offline]}>
                {' '}● {wsStatus}
              </Text>
            </Text>
          </View>
          <TouchableOpacity onPress={() => { setShowMsgSearch(!showMsgSearch); setMsgSearchQuery(''); }} style={styles.backButton}>
            <Text style={styles.backButtonText}>🔍</Text>
          </TouchableOpacity>
        </View>

        {showMsgSearch && (
          <View style={styles.searchBox}>
            <TextInput
              style={styles.searchInput}
              placeholder="Поиск по сообщениям..."
              value={msgSearchQuery}
              onChangeText={setMsgSearchQuery}
            />
            {msgSearchQuery.trim() !== '' && (
              <Text style={styles.searchSectionTitle}>
                Найдено: {displayMessages.length}
              </Text>
            )}
          </View>
        )}

        <ScrollView style={styles.messagesContainer}>
          {messages.length === 0 ? (
            <View style={styles.noMessages}>
              <Text style={styles.noMessagesText}>Нет сообщений</Text>
              <Text style={styles.noMessagesSubtext}>Напишите первое сообщение!</Text>
            </View>
          ) : (
            displayMessages.map((msg) => {
              const isMyMessage = msg.senderId === (user?.id || 1);
              return (
                <View 
                  key={msg.id} 
                  style={[
                    styles.messageBubble,
                    isMyMessage ? styles.myMessage : styles.otherMessage
                  ]}
                >
                  {!isMyMessage && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      {renderMsgAvatar(msg.senderId)}
                      <Text style={[styles.senderName, { color: getUserColor(msg.senderId) }]}>
                        {msg.senderName}
                      </Text>
                    </View>
                  )}
                  {msg.type === 'voice' ? (
                    <View style={styles.voiceMessageContainer}>
                      <Text style={styles.voiceIcon}>🎤</Text>
                      <Text style={styles.voiceDuration}>{formatDuration(msg.duration || 0)}</Text>
                      <TouchableOpacity style={styles.voicePlayButton} onPress={() => {
                        const audio = new Audio(`\${API_URL}/\${msg.content}`);
                        audio.play();
                      }}>
                        <Text style={styles.voicePlayIcon}>▶️</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Text style={[
                      styles.messageText,
                      msg.senderId === userId && styles.messageTextOwn,
                    ]}>
                      {msg.content}
                    </Text>
                  )}
                  <Text style={styles.messageTime}>{formatTime(msg.createdAt)}</Text>
                  {renderTicks(msg)}
                </View>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.messageInput}
            placeholder="Введите сообщение..."
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            onSubmitEditing={handleSendMessage}
          />
          {isRecording ? (
            <View style={styles.recordingContainer}>
              <TouchableOpacity onPress={cancelRecording} style={styles.recordingCancelBtn}>
                <Text style={styles.recordingCancelText}>✕</Text>
              </TouchableOpacity>
              <View style={styles.recordingWave}>
                <Text style={styles.recordingText}>🎤 {formatDuration(recordingDuration)}</Text>
              </View>
              <TouchableOpacity onPress={stopRecording} style={styles.recordingStopBtn}>
                <Text style={styles.recordingStopText}>⏹</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TouchableOpacity onPress={startRecording} style={styles.voiceButton}>
                <Text style={styles.voiceButtonText}>🎤</Text>
              </TouchableOpacity>
              <TouchableOpacity 
            style={[styles.sendButton, !newMessage.trim() ? styles.sendButtonDisabled : styles.sendButtonActive]}
            onPress={handleSendMessage}
          >
            <Text style={styles.sendButtonText}>➤</Text>
          </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  }

  if (isLoggedIn && user) {
    return (
      <View style={styles.container}>
        {toast && (
          <TouchableOpacity style={styles.toast} onPress={() => { openChatById(toast.chatId); setToast(null); }}>
            <Text style={styles.toastTitle}>💬 {toast.title}</Text>
            <Text style={styles.toastBody} numberOfLines={2}>{toast.body}</Text>
          </TouchableOpacity>
        )}
        <View style={styles.header}>
          <Text style={styles.headerTitle}> Чаты</Text>
          <Text style={styles.userName}>Привет, {user.username}!</Text>
          <View style={styles.connectionStatus}>
            <Text style={[styles.statusText, wsStatus === 'Online' ? styles.connected : styles.disconnected]}>
              {wsStatus === 'Online' ? ' Online' : '🔴 ' + wsStatus}
            </Text>
          </View>
          <TouchableOpacity onPress={toggleNotifications} style={styles.logoutButton}>
            <Text style={styles.logoutText}>{notifEnabled ? '🔔' : '🔕'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={openProfile} style={styles.logoutButton}>
            <Text style={styles.logoutText}>👤 Профиль</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Выйти</Text>
          </TouchableOpacity>
        </View>

        <Modal transparent={true} visible={showProfile} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>👤 Профиль</Text>
              <View style={styles.avatarPreview}>
                {profileAvatar ? (
                  <Image source={{ uri: API_URL + '/' + profileAvatar }} style={styles.avatarImage} />
                ) : (
                  <View style={[styles.avatarCircle, { backgroundColor: getUserColor(user?.id || 1) }]}>
                    <Text style={styles.avatarLetter}>{(user?.username || 'U')[0].toUpperCase()}</Text>
                  </View>
                )}
              </View>
              <View nativeID="avatar-picker-slot" style={{ height: 44, marginBottom: 10 }} />
              <TextInput style={styles.profileInput} value={profileName} onChangeText={setProfileName} placeholder="Имя пользователя" />
              <TextInput style={styles.profileInput} value={profileStatus} onChangeText={setProfileStatus} placeholder="Статус" />
              <Text style={styles.profileEmail}>{user?.email}</Text>
              <View style={styles.profileActions}>
                <TouchableOpacity onPress={saveProfile} style={styles.profileButton}>
                  <Text style={styles.profileButtonText}>💾 Сохранить</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowProfile(false)} style={styles.cancelButton}>
                  <Text style={styles.cancelButtonText}>Отмена</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            placeholder="🔍 Поиск чатов и людей..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {searchQuery.trim() !== '' && foundUsers.length > 0 && (
          <View style={styles.searchResults}>
            <Text style={styles.searchSectionTitle}>Люди</Text>
            {foundUsers.map(u => (
              <TouchableOpacity key={u.id} style={styles.searchUserRow} onPress={() => openOrCreateDirect(u)}>
                {u.avatarUrl ? (
                  <Image source={{ uri: API_URL + '/' + u.avatarUrl }} style={styles.chatAvatarImage} />
                ) : (
                  <View style={[styles.chatAvatarCircle, { backgroundColor: getUserColor(u.id) }]}>
                    <Text style={styles.chatAvatarLetter}>{(u.username || 'U')[0].toUpperCase()}</Text>
                  </View>
                )}
                <Text style={styles.searchUserName}>{u.username}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {filteredConversations.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>{searchQuery.trim() ? 'Ничего не найдено' : 'Пока нет чатов'}</Text>
            <Text style={styles.emptySubtext}>{searchQuery.trim() ? 'Попробуйте другой запрос' : 'Создайте свой первый чат!'}</Text>
          </View>
        ) : (
          <FlatList
            data={filteredConversations}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.chatItemWrapper}>
                <TouchableOpacity 
                  style={styles.chatItem}
                  onPress={() => openChat(item)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    {getChatAvatar(item) ? (
                      <Image source={{ uri: API_URL + '/' + getChatAvatar(item) }} style={styles.chatAvatarImage} />
                    ) : (
                      <View style={[styles.chatAvatarCircle, { backgroundColor: getUserColor(item.id) }]}>
                        <Text style={styles.chatAvatarLetter}>
                          {item.type === 'group' ? '👥' : getChatInitial(item)}
                        </Text>
                      </View>
                    )}
                    <View style={[styles.chatItemContent, { flex: 1 }]}>
                    <View style={styles.chatItemHeader}>
                      <Text style={styles.chatName}>{item.name || 'Без названия'}</Text>
                      <Text style={styles.chatType}>
                        {item.type === 'group' ? '👥' : ''}
                      </Text>
                    </View>
                    <Text style={styles.chatLastMessage} numberOfLines={1}>
                      {item.lastMessage ? `${item.lastMessage.senderName}: ${item.lastMessage.content}` : 'Нет сообщений'}
                    </Text>
                  </View>
                  </View>
                  <View style={styles.chatItemRight}>
                    <Text style={styles.chatTime}>
                      {item.lastMessage ? formatTime(item.lastMessage.createdAt) : ''}
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => handleDeleteChat(item.id, item.name)}
                >
                  <Text style={styles.deleteButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}

        <TouchableOpacity 
          style={styles.newChatButton}
          onPress={() => setShowNewChatModal(true)}
        >
          <Text style={styles.newChatText}>+ Создать чат</Text>
        </TouchableOpacity>

        <Modal visible={showNewChatModal} transparent animationType="fade" onRequestClose={() => setShowNewChatModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Новый чат</Text>
              
              <View style={styles.chatTypeSelector}>
                <TouchableOpacity 
                  style={[styles.chatTypeButton, chatType === 'direct' && styles.chatTypeButtonActive]}
                  onPress={() => setChatType('direct')}
                >
                  <Text style={[styles.chatTypeButtonText, chatType === 'direct' && styles.chatTypeButtonTextActive]}>
                    👤 Личный
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.chatTypeButton, chatType === 'group' && styles.chatTypeButtonActive]}
                  onPress={() => setChatType('group')}
                >
                  <Text style={[styles.chatTypeButtonText, chatType === 'group' && styles.chatTypeButtonTextActive]}>
                    👥 Групповой
                  </Text>
                </TouchableOpacity>
              </View>

              {chatType === 'group' && (
                <TextInput
                  style={styles.modalInput}
                  placeholder="Название чата (необязательно)"
                  value={newChatName}
                  onChangeText={setNewChatName}
                />
              )}

              <Text style={styles.selectUsersTitle}>Выберите участников:</Text>
              <ScrollView style={styles.usersList}>
                {users.map(u => (
                  <TouchableOpacity
                    key={u.id}
                    style={[
                      styles.userItem,
                      selectedUsers.includes(u.id) && styles.userItemSelected
                    ]}
                    onPress={() => toggleUserSelection(u.id)}
                  >
                    <View style={styles.userAvatar}>
                      <Text style={styles.userAvatarText}>{u.username[0].toUpperCase()}</Text>
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{u.username}</Text>
                      <Text style={styles.userEmail}>{u.email}</Text>
                    </View>
                    {selectedUsers.includes(u.id) && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]} 
                  onPress={() => {
                    setShowNewChatModal(false);
                    setSelectedUsers([]);
                    setNewChatName('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Отмена</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.createButton]} 
                  onPress={handleCreateConversation} 
                  disabled={loading}
                >
                  <Text style={styles.createButtonText}>{loading ? '...' : 'Создать'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}> ICQ Messenger</Text>
        <Text style={styles.subtitle}>Web версия</Text>
        <TextInput style={styles.input} placeholder="Имя пользователя" value={username} onChangeText={setUsername} />
        <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Пароль" value={password} onChangeText={setPassword} secureTextEntry />
        <TouchableOpacity style={[styles.button, loading && styles.disabled]} onPress={handleRegister} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Загрузка...' : 'Зарегистрироваться'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.loginButton, loading && styles.disabled]} onPress={handleLogin} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Загрузка...' : 'Войти'}</Text>
        </TouchableOpacity>
        {status ? <View style={styles.statusContainer}><Text style={styles.status}>{status}</Text></View> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  voiceButton: {
    backgroundColor: '#4fc3f7',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  voiceButtonText: {
    fontSize: 20,
  },
  recordingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    backgroundColor: '#ff5252',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cancelButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  recordingWave: {
    flex: 1,
    alignItems: 'center',
  },
  recordingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stopButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  stopButtonText: {
    color: '#fff',
    fontSize: 18,
  },
  voiceMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(79, 195, 247, 0.2)',
    borderRadius: 12,
    padding: 8,
    minWidth: 150,
  },
  voiceIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  voiceDuration: {
    fontSize: 14,
    color: '#4fc3f7',
    fontWeight: 'bold',
    marginRight: 8,
  },
  voicePlayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4fc3f7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voicePlayIcon: {
    fontSize: 16,
  },
  toast: { position: 'absolute', top: 10, left: 10, right: 10, backgroundColor: '#333', borderRadius: 12, padding: 12, zIndex: 300, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8 },
  toastTitle: { color: '#4fc3f7', fontWeight: 'bold', marginBottom: 4 },
  toastBody: { color: '#fff' },
  searchBox: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff' },
  searchInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#f5f5f5' },
  searchResults: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 8 },
  searchSectionTitle: { paddingHorizontal: 16, fontSize: 13, color: '#888', marginBottom: 4 },
  searchUserRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 6 },
  searchUserName: { fontSize: 16, fontWeight: 'bold' },
  msgAvatar: { width: 24, height: 24, borderRadius: 12, marginRight: 6 },
  msgAvatarLetter: { color: '#fff', fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
  chatAvatarImage: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  chatAvatarCircle: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  chatAvatarLetter: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  ticks: { color: '#999', fontSize: 12, marginLeft: 4 },
  ticksRead: { color: '#4fc3f7', fontSize: 12, marginLeft: 4 },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '90%', maxWidth: 400 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  avatarPreview: { alignItems: 'center', marginBottom: 15 },
  avatarImage: { width: 80, height: 80, borderRadius: 40 },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  profileButton: { backgroundColor: '#2563eb', borderRadius: 8, padding: 10, alignItems: 'center', marginBottom: 10 },
  profileButtonText: { color: '#fff', fontWeight: 'bold' },
  profileInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 10 },
  profileEmail: { color: '#888', textAlign: 'center', marginBottom: 10 },
  profileActions: { flexDirection: 'row', gap: 10 },
  cancelButton: { flex: 1, backgroundColor: '#eee', borderRadius: 8, padding: 10, alignItems: 'center' },
  cancelButtonText: { color: '#333', fontWeight: 'bold' },

  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { maxWidth: 500, margin: 'auto', padding: 20, paddingTop: 60, backgroundColor: '#fff', minHeight: '100%' },
  title: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 10, color: '#000' },
  subtitle: { fontSize: 18, color: '#666', textAlign: 'center', marginBottom: 40 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 16, backgroundColor: '#fff' },
  button: { backgroundColor: '#2563eb', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  loginButton: { backgroundColor: '#10b981' },
  disabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  statusContainer: { marginTop: 20, padding: 15, backgroundColor: '#f0f0f0', borderRadius: 8 },
  status: { fontSize: 14, textAlign: 'center', color: '#333' },
  
  header: { backgroundColor: '#2563eb', padding: 20, paddingTop: 60 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  userName: { fontSize: 16, color: '#e0e0e0', marginTop: 5 },
  connectionStatus: { marginTop: 5 },
  statusText: { fontSize: 12, color: '#fff' },
  connected: { color: '#90EE90' },
  disconnected: { color: '#FFB6C1' },
  logoutButton: { marginTop: 10, alignSelf: 'flex-start' },
  logoutText: { color: '#fff', fontSize: 14 },
  
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: '#fff' },
  emptyText: { fontSize: 18, color: '#666', marginBottom: 10 },
  emptySubtext: { fontSize: 14, color: '#999' },
  chatItemWrapper: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  chatItem: { flex: 1, padding: 15 },
  chatItemContent: { flex: 1 },
  chatItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  chatName: { fontSize: 16, fontWeight: 'bold', color: '#000', flex: 1 },
  chatType: { fontSize: 16, marginLeft: 8 },
  chatLastMessage: { fontSize: 13, color: '#666' },
  chatItemRight: { alignItems: 'flex-end', marginLeft: 10 },
  chatTime: { fontSize: 11, color: '#999' },
  deleteButton: { width: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fee' },
  deleteButtonText: { color: '#e53e3e', fontSize: 18, fontWeight: 'bold' },
  
  newChatButton: { backgroundColor: '#2563eb', padding: 15, margin: 20, borderRadius: 8, alignItems: 'center' },
  newChatText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 20, width: '90%', maxWidth: 500, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  modalInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 16 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  modalButton: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 5 },
  cancelButton: { backgroundColor: '#6c757d' },
  cancelButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  createButton: { backgroundColor: '#2563eb' },
  createButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
  chatTypeSelector: { flexDirection: 'row', marginBottom: 15 },
  chatTypeButton: { flex: 1, padding: 12, borderWidth: 2, borderColor: '#ccc', borderRadius: 8, alignItems: 'center', marginHorizontal: 5 },
  chatTypeButtonActive: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  chatTypeButtonText: { fontSize: 14, color: '#666' },
  chatTypeButtonTextActive: { color: '#2563eb', fontWeight: 'bold' },
  
  selectUsersTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  usersList: { maxHeight: 200, marginBottom: 15 },
  userItem: { flexDirection: 'row', alignItems: 'center', padding: 10, borderWidth: 1, borderColor: '#eee', borderRadius: 8, marginBottom: 8 },
  userItemSelected: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  userAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  userAvatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  userInfo: { flex: 1 },
  userName: { fontSize: 14, fontWeight: 'bold', color: '#000' },
  userEmail: { fontSize: 12, color: '#666' },
  checkmark: { color: '#2563eb', fontSize: 20, fontWeight: 'bold' },
  
  chatHeader: { backgroundColor: '#2563eb', padding: 15, paddingTop: 50, flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: 15 },
  backButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  chatHeaderInfo: { flex: 1 },
  chatHeaderTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  chatHeaderSubtitle: { color: '#e0e0e0', fontSize: 13, marginTop: 2 },
  onlineIndicator: { fontSize: 13 },
  online: { color: '#90EE90' },
  offline: { color: '#FFB6C1' },
  
  messagesContainer: { flex: 1, padding: 15, backgroundColor: '#e5ddd5' },
  noMessages: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  noMessagesText: { fontSize: 18, color: '#666', marginBottom: 10 },
  noMessagesSubtext: { fontSize: 14, color: '#999' },
  
  messageBubble: { maxWidth: '75%', padding: 10, borderRadius: 12, marginBottom: 8 },
  myMessage: { alignSelf: 'flex-end', backgroundColor: '#dcf8c6' },
  otherMessage: { alignSelf: 'flex-start', backgroundColor: '#fff' },
  senderName: { fontSize: 12, fontWeight: 'bold', marginBottom: 3 },
  messageText: { fontSize: 15, color: '#000' },
  messageTime: { fontSize: 10, color: '#999', textAlign: 'right', marginTop: 4 },
  
  inputContainer: { flexDirection: 'row', padding: 10, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#ddd' },
  messageInput: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 20, padding: 10, marginRight: 10, maxHeight: 100, backgroundColor: '#fff' },
  sendButton: { width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', marginLeft: 5 },
  sendButtonActive: { backgroundColor: '#2563eb' },
  sendButtonDisabled: { backgroundColor: '#9ca3af' },
  sendButtonText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
});
