import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Send, MessageSquare, User, Shield, GraduationCap,
  CheckCheck, Sparkles, X, Loader2, ArrowLeft, RefreshCw
} from 'lucide-react';
import chatService from '../../services/chatService';
import socketService from '../../services/socketService';

export default function ChatInterface({ currentUser, initialRecipientId = null }) {
  const currentUserId = currentUser?._id || currentUser?.id;

  // Conversations & History State
  const [conversations, setConversations] = useState([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Message Input State
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Socket & Typing State
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [partnerIsTyping, setPartnerIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Mobile responsiveness: 'list' or 'chat' view
  const [mobileView, setMobileView] = useState('list');

  // Auto-scroll to bottom of messages container
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, partnerIsTyping]);

  // 1. Initialize Socket.io connection
  useEffect(() => {
    if (!currentUser || !currentUserId) return;

    const socket = socketService.connect(currentUser);
    if (socket) {
      setIsSocketConnected(socket.connected);

      const handleConnect = () => setIsSocketConnected(true);
      const handleDisconnect = () => setIsSocketConnected(false);

      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);

      // Listen for incoming messages in real-time
      const unsubReceive = socketService.onReceiveMessage((incomingMsg) => {
        // If message belongs to currently open conversation, append it
        setSelectedPartner((currentSelected) => {
          const partnerId = currentSelected?._id || currentSelected?.id;
          if (partnerId && incomingMsg.sender === partnerId.toString()) {
            setMessages((prev) => [...prev, incomingMsg]);
            // Send read receipt
            socketService.emitMarkRead(currentUserId, partnerId);
          }
          return currentSelected;
        });

        // Update conversations preview
        fetchConversations(false);
      });

      // Listen for sent message confirmation
      const unsubSent = socketService.onMessageSent((sentMsg) => {
        setMessages((prev) => {
          // Avoid duplicate if optimistically added
          if (prev.some((m) => m._id === sentMsg._id || (m.tempId && m.text === sentMsg.text))) {
            return prev.map((m) => (m.tempId && m.text === sentMsg.text ? sentMsg : m));
          }
          return [...prev, sentMsg];
        });
        fetchConversations(false);
      });

      // Listen for live typing
      const unsubTyping = socketService.onUserTyping(({ senderId }) => {
        setSelectedPartner((currentSelected) => {
          const partnerId = currentSelected?._id || currentSelected?.id;
          if (partnerId && partnerId.toString() === senderId.toString()) {
            setPartnerIsTyping(true);
          }
          return currentSelected;
        });
      });

      const unsubStopTyping = socketService.onUserStopTyping(({ senderId }) => {
        setSelectedPartner((currentSelected) => {
          const partnerId = currentSelected?._id || currentSelected?.id;
          if (partnerId && partnerId.toString() === senderId.toString()) {
            setPartnerIsTyping(false);
          }
          return currentSelected;
        });
      });

      return () => {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
        unsubReceive();
        unsubSent();
        unsubTyping();
        unsubStopTyping();
      };
    }
  }, [currentUser, currentUserId]);

  // 2. Fetch Recent Conversations
  const fetchConversations = async (showLoading = true) => {
    if (showLoading) setIsLoadingConversations(true);
    try {
      const data = await chatService.getConversations();
      setConversations(data || []);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      if (showLoading) setIsLoadingConversations(false);
    }
  };

  useEffect(() => {
    fetchConversations(true);
  }, [currentUserId]);

  // 3. Search Users across Admin, Faculty, and Student roles
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const results = await chatService.searchUsers(searchQuery.trim());
        setSearchResults(results || []);
      } catch (err) {
        console.error('Error during global user search:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // 4. Select a user to chat with and load chat history
  const handleSelectPartner = async (partner) => {
    if (!partner) return;
    const partnerId = partner._id || partner.id;
    setSelectedPartner(partner);
    setSearchQuery('');
    setSearchResults([]);
    setMobileView('chat');
    setPartnerIsTyping(false);

    setIsLoadingHistory(true);
    try {
      const { messages: history } = await chatService.getChatHistory(partnerId);
      setMessages(history || []);
      // Mark read in conversation list
      setConversations((prev) =>
        prev.map((c) =>
          c.partner?._id === partnerId || c.partner?.id === partnerId
            ? { ...c, unreadCount: 0 }
            : c
        )
      );
      // Emit socket mark_read
      socketService.emitMarkRead(currentUserId, partnerId);
    } catch (err) {
      console.error('Failed to load chat history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // If initialRecipientId was passed via location.state, load it automatically
  useEffect(() => {
    if (initialRecipientId && (!selectedPartner || (selectedPartner._id !== initialRecipientId && selectedPartner.id !== initialRecipientId))) {
      chatService.getChatHistory(initialRecipientId).then(({ targetUser, messages }) => {
        if (targetUser) {
          setSelectedPartner(targetUser);
          setMessages(messages || []);
          setMobileView('chat');
        }
      }).catch(console.error);
    }
  }, [initialRecipientId]);

  // 5. Handle Send Message
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || !selectedPartner || isSending) return;

    const partnerId = selectedPartner._id || selectedPartner.id;
    setIsSending(true);

    // Optimistic message item
    const tempMsg = {
      _id: 'temp_' + Date.now(),
      tempId: true,
      sender: currentUserId.toString(),
      senderName: currentUser?.name || 'You',
      receiver: partnerId.toString(),
      receiverName: selectedPartner.name,
      text,
      message: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
      isSender: true
    };

    setMessages((prev) => [...prev, tempMsg]);
    setInputText('');

    // Emit stop typing
    socketService.emitStopTyping(currentUserId, partnerId);

    try {
      // Send via socket first, fallback to REST
      socketService.sendMessage(currentUserId, partnerId, text, async (response) => {
        if (!response || !response.success) {
          // Fallback to REST API
          const restMsg = await chatService.sendMessage(partnerId, text);
          setMessages((prev) => prev.map((m) => (m.tempId ? restMsg : m)));
        }
      });
      fetchConversations(false);
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsSending(false);
    }
  };

  // 6. Handle input typing events
  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (!selectedPartner) return;
    const partnerId = selectedPartner._id || selectedPartner.id;

    // Emit live typing indicator
    socketService.emitTyping(currentUserId, partnerId, currentUser?.name || 'User');

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketService.emitStopTyping(currentUserId, partnerId);
    }, 1500);
  };

  // Helper for role pill styling
  const renderRoleBadge = (roleStr = '') => {
    const r = roleStr.toLowerCase();
    if (r === 'admin') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <Shield size={10} className="text-rose-600" />
          Admin
        </span>
      );
    }
    if (r === 'faculty' || r === 'teacher') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <GraduationCap size={10} className="text-amber-600" />
          Faculty
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
        <User size={10} className="text-indigo-600" />
        Student
      </span>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] max-h-[920px] bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden transition-all">
      {/* Top Universal App Header */}
      <div className="px-6 py-3.5 bg-white border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-2xs">
            <MessageSquare size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 tracking-tight leading-tight flex items-center gap-2">
              Campus Real-Time Chat
              <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                Socket.io
              </span>
            </h2>
            <p className="text-xs text-slate-400">Search anyone (Admin, Faculty, Student) and chat in real-time</p>
          </div>
        </div>

        {/* Live Socket Status Dot */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchConversations(true)}
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-all"
            title="Refresh conversations"
          >
            <RefreshCw size={15} />
          </button>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200/60 text-xs font-medium text-slate-600">
            <span
              className={`w-2 h-2 rounded-full ${
                isSocketConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="text-[11px] font-semibold text-slate-700">
              {isSocketConnected ? 'Live' : 'Connecting'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Chat Splitter */}
      <div className="flex-1 flex overflow-hidden">
        {/* ========================================================= */}
        {/* LEFT PANEL: User Search & Recent Chats                     */}
        {/* ========================================================= */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-slate-100 flex flex-col bg-slate-50/50 ${
            mobileView === 'chat' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Search Box */}
          <div className="p-3.5 border-b border-slate-100 bg-white">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search anyone (Name, Email, Enrollment)..."
                className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all"
                style={{ paddingLeft: '2.5rem' }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Global Search Results Dropdown / Header */}
            {searchQuery && (
              <div className="mt-2 text-[11px] font-bold text-slate-400 px-1 uppercase tracking-wider flex items-center justify-between">
                <span>Search Results</span>
                {isSearching && <Loader2 size={12} className="animate-spin text-indigo-600" />}
              </div>
            )}
          </div>

          {/* List Area: Search Results or Recent Chats */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {searchQuery ? (
              // Search Results Display
              searchResults.length > 0 ? (
                searchResults.map((user) => (
                  <button
                    key={user._id || user.id}
                    type="button"
                    onClick={() => handleSelectPartner(user)}
                    className="w-full text-left p-3.5 hover:bg-indigo-50/60 transition-all flex items-center gap-3 group"
                  >
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-600">
                          {user.name}
                        </span>
                        {renderRoleBadge(user.role)}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {user.department ? `${user.department} • ` : ''}
                        {user.enrollment || user.email || user.username}
                      </p>
                    </div>
                  </button>
                ))
              ) : isSearching ? (
                <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                  <Loader2 size={20} className="animate-spin text-indigo-600" />
                  <span>Searching users across all collections...</span>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">
                  No users found matching &quot;{searchQuery}&quot;
                </div>
              )
            ) : (
              // Recent Conversations List
              <div>
                <div className="px-4 py-2.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100/50">
                  Recent Conversations
                </div>

                {isLoadingConversations ? (
                  <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                    <Loader2 size={20} className="animate-spin text-indigo-600" />
                    <span>Loading recent chats...</span>
                  </div>
                ) : conversations.length > 0 ? (
                  conversations.map((conv) => {
                    const partner = conv.partner;
                    if (!partner) return null;
                    const isSelected =
                      selectedPartner &&
                      (selectedPartner._id === partner._id || selectedPartner.id === partner._id);

                    return (
                      <button
                        key={conv.id || conv.conversationId || partner._id}
                        type="button"
                        onClick={() => handleSelectPartner(partner)}
                        className={`w-full text-left p-3.5 transition-all flex items-center gap-3 border-l-4 ${
                          isSelected
                            ? 'bg-indigo-50/70 border-indigo-600'
                            : 'border-transparent hover:bg-slate-100/60 bg-white'
                        }`}
                      >
                        <div className="relative shrink-0">
                          <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shadow-2xs">
                            {partner.name ? partner.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          {conv.unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-slate-800 truncate">
                              {partner.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium shrink-0">
                              {conv.lastMessageAt
                                ? new Date(conv.lastMessageAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : ''}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-1 mt-0.5">
                            <p
                              className={`text-[11px] truncate ${
                                conv.unreadCount > 0
                                  ? 'font-bold text-slate-800'
                                  : 'text-slate-400 font-normal'
                              }`}
                            >
                              {conv.lastMessage || 'No messages yet'}
                            </p>
                            {renderRoleBadge(partner.role)}
                          </div>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="p-8 text-center flex flex-col items-center">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mb-3">
                      <Sparkles size={22} />
                    </div>
                    <h4 className="text-xs font-bold text-slate-700">No Conversations Yet</h4>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
                      Use the search bar above to find any Admin, Faculty member, or Student!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT PANEL: Live Chat Window                             */}
        {/* ========================================================= */}
        <div
          className={`flex-1 flex flex-col bg-slate-50/30 ${
            mobileView === 'list' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {selectedPartner ? (
            <>
              {/* Partner Chat Header */}
              <div className="px-6 py-3.5 bg-white border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Mobile Back Button */}
                  <button
                    type="button"
                    onClick={() => setMobileView('list')}
                    className="md:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                  >
                    <ArrowLeft size={18} />
                  </button>

                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                      {selectedPartner.name ? selectedPartner.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-800 truncate">
                        {selectedPartner.name}
                      </h3>
                      {renderRoleBadge(selectedPartner.role)}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      {partnerIsTyping ? (
                        <span className="text-indigo-600 font-semibold animate-pulse">
                          typing...
                        </span>
                      ) : (
                        selectedPartner.department || selectedPartner.email || 'Online'
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Chat Messages Stream */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3.5 bg-[#f8fafc]/60">
                {isLoadingHistory ? (
                  <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400 gap-2">
                    <Loader2 size={24} className="animate-spin text-indigo-600" />
                    <span>Loading conversation history...</span>
                  </div>
                ) : messages.length > 0 ? (
                  messages.map((msg, index) => {
                    const isSender =
                      msg.isSender ||
                      (msg.sender?._id || msg.sender) === currentUserId.toString() ||
                      msg.senderId === currentUserId.toString();

                    return (
                      <div
                        key={msg._id || msg.id || index}
                        className={`flex flex-col ${isSender ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[78%] sm:max-w-[65%] px-4 py-2.5 rounded-2xl text-xs shadow-2xs leading-relaxed transition-all ${
                            isSender
                              ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-br-xs'
                              : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                          }`}
                        >
                          {!isSender && (
                            <span className="block text-[10px] font-bold text-indigo-600 mb-0.5">
                              {msg.senderName || selectedPartner.name}
                            </span>
                          )}
                          <p className="whitespace-pre-wrap break-words">{msg.text || msg.message}</p>
                        </div>
                        <div className="flex items-center gap-1 mt-1 px-1">
                          <span className="text-[10px] text-slate-400 font-medium">
                            {msg.timestamp ||
                              (msg.createdAt
                                ? new Date(msg.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : '')}
                          </span>
                          {isSender && (
                            <CheckCheck
                              size={12}
                              className={msg.isRead ? 'text-indigo-600' : 'text-slate-300'}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6">
                    <div className="w-14 h-14 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                      <MessageSquare size={26} />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">
                      Start a chat with {selectedPartner.name}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                      Send your first message below. Communication will be delivered in real-time
                      through Socket.io!
                    </p>
                  </div>
                )}

                {/* Partner Typing Indicator Bubble */}
                {partnerIsTyping && (
                  <div className="flex items-center gap-1.5 p-3 rounded-2xl bg-white border border-slate-200 text-slate-400 w-fit">
                    <span className="text-[11px] font-medium text-slate-500">{selectedPartner.name} is typing</span>
                    <span className="flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                    </span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Box */}
              <div className="p-3.5 sm:p-4 bg-white border-t border-slate-100">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={handleInputChange}
                    placeholder={`Message ${selectedPartner.name}... (Press Enter to send)`}
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || isSending}
                    className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold text-xs rounded-2xl transition-all shadow-sm flex items-center gap-1.5"
                  >
                    {isSending ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        <Send size={15} />
                        <span className="hidden sm:inline">Send</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            // Empty State: No Partner Selected
            <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-[#f8fafc]/40">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 shadow-sm">
                <MessageSquare size={32} />
              </div>
              <h3 className="text-base font-bold text-slate-800">Your Messages</h3>
              <p className="text-xs text-slate-400 mt-1.5 max-w-sm">
                Select a conversation from the left, or use the search bar above to find any Admin,
                Faculty member, or Student to start chatting in real time.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
