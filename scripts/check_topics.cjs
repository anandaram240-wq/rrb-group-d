const d = require('../src/data/pyqs.json');
const topicsBySubject = {};
d.forEach(q => {
  if (!topicsBySubject[q.subject]) topicsBySubject[q.subject] = {};
  topicsBySubject[q.subject][q.topic] = (topicsBySubject[q.subject][q.topic] || 0) + 1;
});
Object.entries(topicsBySubject).forEach(([sub, topics]) => {
  console.log('\n=== ' + sub + ' ===');
  Object.entries(topics).sort((a,b) => b[1]-a[1]).forEach(([t, c]) => {
    console.log('  ' + t + ': ' + c);
  });
});
