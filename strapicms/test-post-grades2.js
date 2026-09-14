const axios = require('axios');

async function test() {
  try {
    console.log('Logging in...');
    let token;
    try {
      const loginRes = await axios.post('http://127.0.0.1:1339/api/auth/local', {
        identifier: 'ahmetteacher@gmail.com',
        password: '123456'
      });
      token = loginRes.data.jwt;
      console.log('Logged in successfully! Token length:', token.length);
    } catch (loginErr) {
      console.error('Login failed details:', loginErr.message, loginErr.code, loginErr.response?.status, loginErr.response?.data);
      return;
    }

    const client = axios.create({
      baseURL: 'http://127.0.0.1:1339/api',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    // Let's fetch one course offering to see its details
    const res = await client.get('/course-offerings?populate=studentEnrollments.student,teacher,subject,academicSection,academicYear,academicTerm');
    const offering = res.data.data[0];
    if (!offering) {
      console.log('No offerings found');
      return;
    }
    
    console.log('Offering Details:');
    console.log('- id:', offering.id);
    console.log('- documentId:', offering.documentId);
    console.log('- teacher:', offering.teacher?.id, offering.teacher?.documentId);
    console.log('- student:', offering.studentEnrollments?.[0]?.student?.id, offering.studentEnrollments?.[0]?.student?.documentId);
    console.log('- subject:', offering.subject?.id, offering.subject?.documentId);
    console.log('- section/academicSection:', offering.academicSection?.id, offering.academicSection?.documentId);
    console.log('- academicYear:', offering.academicYear?.id, offering.academicYear?.documentId);
    console.log('- academicTerm:', offering.academicTerm?.id, offering.academicTerm?.documentId);

    const studentDocId = offering.studentEnrollments?.[0]?.student?.documentId;
    const teacherDocId = offering.teacher?.documentId;
    const offeringDocId = offering.documentId;
    const subjectDocId = offering.subject?.documentId;
    const sectionDocId = offering.academicSection?.documentId;
    const yearDocId = offering.academicYear?.documentId;
    const termDocId = offering.academicTerm?.documentId;

    console.log('\nTesting POST with numeric IDs...');
    try {
      const resPostNum = await client.post('/gradebook-entries', {
        data: {
          title: 'Test Component Mark',
          assessmentType: 'Homework',
          score: 85,
          maxScore: 100,
          percentage: 85,
          student: offering.studentEnrollments?.[0]?.student?.id,
          teacher: offering.teacher?.id,
          courseOffering: offering.id,
          subject: offering.subject?.id,
          section: offering.academicSection?.id,
          academicYear: offering.academicYear?.id,
          academicTerm: offering.academicTerm?.id,
          recordStatus: 'Draft'
        }
      });
      console.log('Numeric IDs call succeeded!', resPostNum.status);
    } catch (err) {
      console.log('Numeric IDs call failed:', err.response?.status);
      console.dir(err.response?.data, { depth: null });
    }

    console.log('\nTesting POST with documentIds (strings)...');
    try {
      const resPost = await client.post('/gradebook-entries', {
        data: {
          title: 'Test Component Mark',
          assessmentType: 'Homework',
          score: 85,
          maxScore: 100,
          percentage: 85,
          student: studentDocId,
          teacher: teacherDocId,
          courseOffering: offeringDocId,
          subject: subjectDocId,
          section: sectionDocId,
          academicYear: yearDocId,
          academicTerm: termDocId,
          recordStatus: 'Draft'
        }
      });
      console.log('DocumentIds call succeeded!', resPost.status, resPost.data);
    } catch (err) {
      console.log('DocumentIds call failed:', err.response?.status);
      console.dir(err.response?.data, { depth: null });
    }

  } catch (err) {
    console.error('Outer error:', err.message);
  }
}

test();
