const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });

async function cleanAIDummyData() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected for cleaning AI dummy data...');
  const db = mongoose.connection.db;

  // 1. Identify genuine users to preserve
  const genuineUserFilter = {
    $or: [
      { role: 'admin' },
      { username: 'admin' },
      { username: 'hshah' },
      { name: 'Harsh Shah' },
      { enrollment: '23018501210236' },
      { name: 'hitarth' },
      { enrollment: '23018501210234' },
      { name: 'Shaikh Aman Irfanbhai' }
    ]
  };

  const genuineUsers = await db.collection('users').find(genuineUserFilter).toArray();
  const genuineUserIds = genuineUsers.map((u) => u._id);
  console.log('Preserving Genuine Users:', genuineUsers.map((u) => `${u.name} (${u.role}: ${u.username || u.enrollment})`));

  // Find all AI dummy/test users
  const dummyUsers = await db.collection('users').find({
    _id: { $nin: genuineUserIds }
  }).toArray();
  const dummyUserIds = dummyUsers.map((u) => u._id);
  console.log(`Found ${dummyUsers.length} AI dummy/test users to remove:`, dummyUsers.map((u) => u.name));

  // Remove dummy users
  if (dummyUserIds.length > 0) {
    const delUsersRes = await db.collection('users').deleteMany({ _id: { $in: dummyUserIds } });
    console.log(`✓ Removed ${delUsersRes.deletedCount} dummy users.`);

    // Remove their active sessions
    const delSessionsRes = await db.collection('sessions').deleteMany({ userId: { $in: dummyUserIds } });
    console.log(`✓ Removed ${delSessionsRes.deletedCount} sessions belonging to dummy users.`);
  }

  // 2. Clean AI dummy assignments (preserve genuine assignments like 'AI/ML assignment' by hitarth)
  const dummyAssignments = await db.collection('assignments').find({
    $or: [
      { title: { $regex: /\[1791223467764\]|\[1791223621888\]/ } },
      { title: 'MERN Assignment 1' },
      { title: 'Data Mining Clustering Lab' },
      { title: 'Past Due Assignment' }
    ]
  }).toArray();
  const dummyAssignmentIds = dummyAssignments.map((a) => a._id);
  console.log(`Found ${dummyAssignments.length} AI test assignments to remove.`);

  if (dummyAssignmentIds.length > 0) {
    const delAsgRes = await db.collection('assignments').deleteMany({ _id: { $in: dummyAssignmentIds } });
    console.log(`✓ Removed ${delAsgRes.deletedCount} dummy assignments.`);

    // Remove submissions for these assignments
    const delSubRes = await db.collection('submissions').deleteMany({ assignmentId: { $in: dummyAssignmentIds } });
    console.log(`✓ Removed ${delSubRes.deletedCount} submissions for dummy assignments.`);
  }

  // 3. Clean AI test messages (preserve genuine message: 'hello' from Aman to hshah)
  const delMsgsRes = await db.collection('messages').deleteMany({
    $or: [
      { message: { $regex: /doubt regarding Question 2/i } },
      { message: { $regex: /Tomorrow's MERN assignment submission deadline/i } },
      { senderId: 'AIML001' },
      { receiverId: { $in: ['AIML001', 'AIML002', 'AIML003', 'AIML004'] } }
    ]
  });
  console.log(`✓ Removed ${delMsgsRes.deletedCount} AI test messages.`);

  // 4. Clean AI test attendance sessions and records (preserve genuine ADA record)
  const delAttSessRes = await db.collection('attendancesessions').deleteMany({
    subject: 'MERN'
  });
  console.log(`✓ Removed ${delAttSessRes.deletedCount} test attendance sessions.`);

  const delAttRes = await db.collection('attendances').deleteMany({
    subject: 'MERN'
  });
  console.log(`✓ Removed ${delAttRes.deletedCount} test attendance records.`);

  // 5. Clean AI FacultySubjectAssignments (remove dummy faculty assignments; ensure Harsh Shah mapping)
  const delFsaRes = await db.collection('facultysubjectassignments').deleteMany({
    facultyUsername: { $ne: 'hshah' }
  });
  console.log(`✓ Removed ${delFsaRes.deletedCount} dummy faculty subject assignments.`);

  // Update Harsh Shah's mapping to Department: AIML, Semester: 7, Class/Section: A, Assigned Subject: MERN
  const harsh = await db.collection('users').findOne({ username: 'hshah' });
  if (harsh) {
    await db.collection('users').updateOne(
      { _id: harsh._id },
      {
        $set: {
          department: 'AIML',
          semester: '7',
          classSection: 'A',
          assignedSubject: 'MERN'
        }
      }
    );

    await db.collection('facultysubjectassignments').updateOne(
      { facultyId: harsh._id },
      {
        $set: {
          facultyName: 'Harsh Shah',
          facultyUsername: 'hshah',
          department: 'AIML',
          semester: 7,
          classSection: 'A',
          subject: 'MERN',
          status: 'Active'
        }
      },
      { upsert: true }
    );
    console.log('✓ Successfully mapped Harsh Shah -> Department: AIML, Semester: 7, Class/Section: A, Assigned Subject: MERN');
  }

  console.log('\n--- VERIFICATION OF REMAINING COLLECTIONS ---');
  const collections = await db.listCollections().toArray();
  for (const col of collections) {
    const count = await db.collection(col.name).countDocuments();
    console.log(`${col.name}: ${count} records`);
  }

  process.exit(0);
}

cleanAIDummyData().catch((err) => {
  console.error('Error during cleanup:', err);
  process.exit(1);
});
