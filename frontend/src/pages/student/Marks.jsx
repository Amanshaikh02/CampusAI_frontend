import React from 'react';
import Layout from '../../components/Layout';
import StudentPerformanceDashboard from '../../components/analytics/StudentPerformanceDashboard';

export default function StudentMarks({ currentUser }) {
  return (
    <Layout role="student" currentUser={currentUser}>
      <StudentPerformanceDashboard
        role="student"
        currentUser={currentUser}
        embedded={true}
      />
    </Layout>
  );
}
