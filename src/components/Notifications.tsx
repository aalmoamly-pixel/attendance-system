import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  Check, 
  User,
  Shield,
  Inbox,
  Search,
  CheckCircle2,
  Paperclip,
  Smile
} from 'lucide-react';
import { db, supabase } from '../lib/supabase';
import { getAuthState } from '../lib/auth';
import type { Notification, Student } from '../types/database';

interface NotificationsProps {
  studentId?: number;
  isAdmin?: boolean;
}

export default function Notifications({ studentId, isAdmin = false }: NotificationsProps) {
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [selectedChatStudent, setSelectedChatStudent] = useState<Student | null>(null);
  const [messages, setMessages] = useState<Notification[]>([]);
  const [allMessages, setAllMessages] = useState<Notification[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const authState = getAuthState();
  const currentUserId = authState.user?.student_id;

  useEffect(() => {
    loadInitialData();
    
    // Set up realtime listener for new messages
    let subscription: any = null;
    if (supabase) {
      subscription = supabase
        .channel('notifications_channel')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'notifications'
        }, (payload) => {
          console.log('[Realtime] New message received:', payload);
          handleRealtimeUpdate(payload);
        })
        .subscribe();
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [studentId, isAdmin]);

  useEffect(() => {
    filterMessages(allMessages);
  }, [selectedChatStudent, allMessages, isAdmin, studentId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [notifs, students] = await Promise.all([
        db.getNotifications(),
        isAdmin ? db.getStudents() : []
      ]);
      
      setAllMessages(notifs);
      if (isAdmin) {
        const filteredStudents = students.filter(s => s.role === 'student');
        setAllStudents(filteredStudents);
        
        if (!selectedChatStudent && filteredStudents.length > 0) {
          const firstStudent = filteredStudents[0];
          setSelectedChatStudent(firstStudent);
        }
      }
    } catch (err) {
      console.error('[Notifications] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRealtimeUpdate = (payload: any) => {
    if (payload.eventType === 'INSERT' && payload.new) {
      setAllMessages(prev => [payload.new, ...prev]);
    } else if (payload.eventType === 'UPDATE' && payload.new) {
      setAllMessages(prev => 
        prev.map(msg => 
          msg.notification_id === payload.new.notification_id ? payload.new : msg
        )
      );
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const filterMessages = (notifs: Notification[]) => {
    let filtered: Notification[] = [];
    
    if (isAdmin && selectedChatStudent) {
      filtered = notifs.filter(n => n.student_id === selectedChatStudent.student_id);
      
      // Mark unread messages as read
      const unreadFromStudent = filtered.filter(
        n => n.sender_role === 'student' && !n.is_read
      );
      
      unreadFromStudent.forEach(n => {
        db.markNotificationRead(n.notification_id);
      });
      
    } else if (!isAdmin && studentId) {
      filtered = notifs.filter(n => n.student_id === studentId);
      
      // Mark unread messages from admin as read
      const unreadFromAdmin = filtered.filter(
        n => n.sender_role === 'admin' && !n.is_read
      );
      
      unreadFromAdmin.forEach(n => {
        db.markNotificationRead(n.notification_id);
      });
    }

    setMessages(filtered.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    ));
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageInput.trim()) return;
    if (isAdmin && !selectedChatStudent) return;
    if (!isAdmin && !studentId) return;

    try {
      setSending(true);
      const targetStudentId = isAdmin ? selectedChatStudent!.student_id : studentId;
      
      const newNotification = await db.sendNotification({
        student_id: targetStudentId!,
        sender_id: currentUserId || 0,
        sender_role: authState.role || 'student',
        message: messageInput.trim(),
        is_read: false
      });

      // Optimistic update
      setAllMessages(prev => [newNotification, ...prev]);
      setMessageInput('');
    } catch (err) {
      console.error('[Notifications] Error sending:', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getUnreadCount = (student: Student) => {
    return allMessages.filter(n => 
      n.student_id === student.student_id && 
      n.sender_role === 'student' && 
      !n.is_read
    ).length;
  };

  const getLastMessage = (student: Student) => {
    const studentMessages = allMessages.filter(n => 
      n.student_id === student.student_id
    );
    if (studentMessages.length === 0) return null;
    
    const sorted = studentMessages.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return sorted[0];
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-SA', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Sort students by last message time
  const sortedStudents = [...allStudents].sort((a, b) => {
    const lastMsgA = getLastMessage(a);
    const lastMsgB = getLastMessage(b);
    
    if (!lastMsgA && !lastMsgB) return 0;
    if (!lastMsgA) return 1;
    if (!lastMsgB) return -1;
    
    return new Date(lastMsgB.created_at).getTime() - new Date(lastMsgA.created_at).getTime();
  });

  const filteredStudents = sortedStudents.filter(s => 
    s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.academic_id.includes(searchQuery)
  );

  const totalUnread = isAdmin 
    ? allMessages.filter(n => n.sender_role === 'student' && !n.is_read).length
    : allMessages.filter(n => n.student_id === studentId && n.sender_role === 'admin' && !n.is_read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center">
              <MessageSquare className="w-7 h-7 text-white" />
            </div>
            دردشة الرسائل
          </h1>
          <p className="text-dark-muted mt-2 text-lg">
            {isAdmin ? 'الدردشة مع الطلاب' : 'الدردشة مع الإدارة'}
          </p>
        </div>
        {totalUnread > 0 && (
          <div className="flex items-center gap-3 bg-gradient-to-r from-brand-danger/20 to-brand-warning/20 border border-brand-danger/30 px-6 py-3 rounded-2xl">
            <span className="text-2xl font-black text-brand-danger">{totalUnread}</span>
            <span className="text-brand-danger font-bold">رسالة جديدة</span>
          </div>
        )}
      </div>

      <div className="glass-card h-[calc(100vh-240px)] flex overflow-hidden rounded-3xl border-2 border-dark-border/50 shadow-2xl">
        {isAdmin && (
          <div className="w-full md:w-96 border-l border-dark-border flex flex-col bg-dark-bg/30">
            <div className="p-6 border-b border-dark-border bg-dark-card/50">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                قائمة الطلاب
              </h3>
              <div className="relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-muted" />
                <input
                  type="text"
                  placeholder="بحث عن طالب..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-dark-bg border-2 border-dark-border rounded-2xl pr-12 pl-5 py-3.5 text-white focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredStudents.map((student) => {
                const unread = getUnreadCount(student);
                const lastMsg = getLastMessage(student);
                const isSelected = selectedChatStudent?.student_id === student.student_id;
                
                return (
                  <button
                    key={student.student_id}
                    onClick={() => setSelectedChatStudent(student)}
                    className={`w-full p-5 flex items-center gap-4 border-b border-dark-border/30 transition-all hover:translate-x-[-4px] ${
                      isSelected 
                        ? 'bg-gradient-to-l from-brand-primary/15 to-transparent border-l-4 border-l-brand-primary shadow-lg shadow-brand-primary/10' 
                        : 'hover:bg-dark-hover'
                    }`}
                  >
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center flex-shrink-0 shadow-lg">
                        <span className="text-white font-black text-xl">{student.full_name.charAt(0)}</span>
                      </div>
                      {unread > 0 && (
                        <div className="absolute -top-1 -left-1 w-7 h-7 bg-brand-danger rounded-full flex items-center justify-center border-4 border-dark-bg shadow-lg">
                          <span className="text-white font-black text-xs">{unread}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-right min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white truncate text-lg">{student.full_name}</span>
                        {lastMsg && (
                          <span className="text-xs text-dark-muted">{formatTime(lastMsg.created_at)}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-dark-muted truncate">
                          {lastMsg ? lastMsg.message : student.academic_id}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col bg-gradient-to-b from-dark-bg/50 to-dark-card/10">
          {(!isAdmin || selectedChatStudent) ? (
            <>
              <div className="p-5 border-b border-dark-border flex items-center gap-4 bg-dark-card/30 backdrop-blur-sm">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center shadow-lg">
                  {isAdmin ? (
                    <span className="text-white font-black">{selectedChatStudent?.full_name.charAt(0)}</span>
                  ) : (
                    <Shield className="w-6 h-6 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">
                    {isAdmin ? selectedChatStudent?.full_name : 'الإدارة'}
                  </h3>
                  <p className="text-sm text-dark-muted mt-1">
                    {isAdmin ? selectedChatStudent?.academic_id : 'مدرسة حضورك الذكي'}
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-gradient-to-br from-dark-bg/30 via-transparent to-dark-card/20">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-dark-muted py-20">
                    <div className="w-28 h-28 rounded-3xl bg-dark-card/50 flex items-center justify-center mb-6">
                      <MessageSquare className="w-14 h-14 opacity-40" />
                    </div>
                    <p className="text-xl font-bold text-white mb-2">لا توجد رسائل بعد</p>
                    <p className="text-base">ارسل رسالة أولى لبدء المحادثة!</p>
                  </div>
                ) : (
                  <>
                    {(() => {
                      let lastDate = '';
                      return messages.map((msg, _index) => {
                        const msgDate = formatDate(msg.created_at);
                        const showDate = msgDate !== lastDate;
                        lastDate = msgDate;
                        const isFromMe = msg.sender_id === currentUserId;

                        return (
                          <React.Fragment key={msg.notification_id}>
                            {showDate && (
                              <div className="flex justify-center my-6">
                                <span className="text-sm text-dark-muted bg-dark-card/70 backdrop-blur-sm px-5 py-2 rounded-full border border-dark-border/30">
                                  {msgDate}
                                </span>
                              </div>
                            )}
                            <div className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] ${isFromMe ? 'order-1' : 'order-2'}`}>
                                <div className={`p-5 rounded-3xl shadow-xl ${
                                  isFromMe
                                    ? 'bg-gradient-to-br from-brand-primary to-brand-secondary text-white rounded-tl-xl shadow-brand-primary/30'
                                    : 'bg-gradient-to-br from-dark-card to-dark-bg/90 text-white rounded-tr-xl border-2 border-dark-border/50'
                                }`}>
                                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{msg.message}</p>
                                  <div className={`flex items-center gap-2 mt-3 ${isFromMe ? 'justify-end' : 'justify-end'}`}>
                                    <span className="text-xs opacity-75">{formatTime(msg.created_at)}</span>
                                    {isFromMe && msg.is_read && (
                                      <CheckCircle2 className="w-4 h-4 text-white/90" />
                                    )}
                                    {isFromMe && !msg.is_read && (
                                      <Check className="w-4 h-4 opacity-60" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </React.Fragment>
                        );
                      });
                    })()}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              <div className="p-6 border-t border-dark-border bg-dark-card/30 backdrop-blur-sm">
                <form onSubmit={handleSendMessage} className="flex gap-4">
                  <div className="hidden md:flex items-center gap-3">
                    <button type="button" className="p-3 rounded-2xl bg-dark-card border border-dark-border hover:bg-dark-hover text-dark-muted hover:text-white transition-all">
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <button type="button" className="p-3 rounded-2xl bg-dark-card border border-dark-border hover:bg-dark-hover text-dark-muted hover:text-white transition-all">
                      <Smile className="w-5 h-5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="اكتب رسالتك هنا..."
                    className="flex-1 bg-dark-card border-2 border-dark-border rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all text-base"
                  />
                  <button
                    type="submit"
                    disabled={sending || !messageInput.trim()}
                    className="btn-primary px-8 py-4 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl flex items-center gap-3 text-base font-bold shadow-lg shadow-brand-primary/30 hover:scale-105 transition-transform"
                  >
                    {sending ? (
                      <div className="animate-spin w-6 h-6 border-3 border-white border-t-transparent rounded-full"></div>
                    ) : (
                      <Send className="w-6 h-6" />
                    )}
                    إرسال
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-dark-muted bg-gradient-to-br from-dark-bg/50 to-dark-card/20">
              <div className="w-40 h-40 rounded-full bg-dark-card/50 flex items-center justify-center mb-8 shadow-2xl">
                <Inbox className="w-20 h-20 opacity-30" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">اختر دردشة</h3>
              <p className="text-lg text-center max-w-md">اختر طالب من القائمة على اليمين للبدء في الدردشة معه</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
