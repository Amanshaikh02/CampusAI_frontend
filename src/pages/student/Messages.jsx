import React from 'react';
import { useLocation } from 'react-router-dom';
import Layout from '../../components/Layout';
import ChatInterface from '../../components/chat/ChatInterface';

export default function StudentMessages({ currentUser, setCurrentUser }) {
  const location = useLocation();
  const isFaculty = currentUser?.role === 'teacher' || currentUser?.role === 'faculty';
  const role = isFaculty ? 'teacher' : 'student';
  const initialRecipientId = location.state?.recipientId || null;

  return (
    <Layout
      role={role}
      currentUser={currentUser}
      setCurrentUser={setCurrentUser}
      searchPlaceholder="Search campus directory..."
    >
      <ChatInterface
        currentUser={currentUser}
        initialRecipientId={initialRecipientId}
      />
    </Layout>
  );
}
