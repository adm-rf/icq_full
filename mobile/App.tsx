import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, FlatList, Modal } from 'react-native';
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

  // Подключаем WebSocket
  useEffect(() => {
    if (user) {
      console.log('🔌 Попытка подключения WebSocket...');
      setWsStatus('Подключение...');
      
      const newSocket = io(API_URL, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  forceNew: false,
  autoConnect: true
});
      
      newSocket.on('connect', () => {
        console.log('✅ WebSocket подключен:', newSocket.id);
        setWsStatus('Online');
        newSocket.emit('register', user.id);
        console.log(`📤 Зарегистрирован в комнате user_${user.id}`);
      });
      
      newSocket.on('newMessage', (data) => {
        console.log('📨 ПОЛУЧЕНО НОВОЕ СООБЩЕНИЕ:', data);
        
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
        console.log(' Получен новый чат:', chat);
        loadConversations();
      });
      
      newSocket.on('chatDeleted', (data) => {
        console.log('🗑️ Чат удален:', data);
        if (activeChat && activeChat.id === data.chatId) {
          closeChat();
        }
        loadConversations();
      });
      
      newSocket.on('disconnect', (reason) => {
        console.log('❌ WebSocket отключен:', reason);
        setWsStatus('Offline');
      });
      
      newSocket.on('connect_error', (error) => {
        console.error('❌ Ошибка подключения WebSocket:', error.message);
        setWsStatus('Ошибка');
      });
      
      setSocket(newSocket);
      
      return () => {
        console.log(' Отключение WebSocket...');
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

  const handleSendMessage = async () => {
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
        </View>

        <ScrollView style={styles.messagesContainer}>
          {messages.length === 0 ? (
            <View style={styles.noMessages}>
              <Text style={styles.noMessagesText}>Нет сообщений</Text>
              <Text style={styles.noMessagesSubtext}>Напишите первое сообщение!</Text>
            </View>
          ) : (
            messages.map((msg) => {
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
                    <Text style={[styles.senderName, { color: getUserColor(msg.senderId) }]}>
                      {msg.senderName}
                    </Text>
                  )}
                  <Text style={styles.messageText}>{msg.content}</Text>
                  <Text style={styles.messageTime}>{formatTime(msg.createdAt)}</Text>
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
          <TouchableOpacity 
            style={[styles.sendButton, !newMessage.trim() ? styles.sendButtonDisabled : styles.sendButtonActive]}
            onPress={handleSendMessage}
          >
            <Text style={styles.sendButtonText}>➤</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isLoggedIn && user) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}> Чаты</Text>
          <Text style={styles.userName}>Привет, {user.username}!</Text>
          <View style={styles.connectionStatus}>
            <Text style={[styles.statusText, wsStatus === 'Online' ? styles.connected : styles.disconnected]}>
              {wsStatus === 'Online' ? ' Online' : '🔴 ' + wsStatus}
            </Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Выйти</Text>
          </TouchableOpacity>
        </View>

        {conversations.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>Пока нет чатов</Text>
            <Text style={styles.emptySubtext}>Создайте свой первый чат!</Text>
          </View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.chatItemWrapper}>
                <TouchableOpacity 
                  style={styles.chatItem}
                  onPress={() => openChat(item)}
                >
                  <View style={styles.chatItemContent}>
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
