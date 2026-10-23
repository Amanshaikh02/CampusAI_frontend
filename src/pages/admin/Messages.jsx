import React from 'react';
import Layout from '../../components/Layout';
import ChatInterface from '../../components/chat/ChatInterface';

export default function AdminMessages({ currentUser, setCurrentUser }) {
  return (
    <Layout
      role="admin"
      currentUser={currentUser}
      setCurrentUser={setCurrentUser}
      searchPlaceholder="Search campus administration..."
    >
      <ChatInterface currentUser={currentUser} />
    </Layout>
  );
}
