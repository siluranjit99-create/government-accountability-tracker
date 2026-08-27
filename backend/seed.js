const db = require('./db');

// Clear existing data so re-running this script gives a clean demo state
db.exec('DELETE FROM comments');
db.exec('DELETE FROM pins');
db.exec('DELETE FROM issues');

const now = Date.now();
const daysAgo = (n) => new Date(now - n * 24 * 60 * 60 * 1000).toISOString();

// Deterministic placeholder photos (picsum.photos/seed/... always returns the
// same image for the same seed, so the demo looks the same every run).
const photo = (seed) => `https://picsum.photos/seed/${seed}/600/400`;

const issues = [
  { title: 'Pothole near Ratna Park', description: 'Large pothole causing traffic to swerve into oncoming lane', category: 'Roads', lat: 27.7025, lng: 85.3145, created_at: daysAgo(3), status: 'open', upvote_count: 18, resolve_confirmations: 0, photo_url: photo('pothole-ratna-park') },
  { title: 'Exposed wiring on utility pole', description: 'Live wire hanging low above sidewalk, sparking during rain', category: 'Electricity', lat: 27.6980, lng: 85.3240, created_at: daysAgo(1), status: 'open', upvote_count: 25, resolve_confirmations: 0, photo_url: photo('exposed-wiring-pole') },
  { title: 'Streetlights out on Ring Road stretch', description: 'Entire stretch dark at night near bus stop', category: 'Electricity', lat: 27.6910, lng: 85.3390, created_at: daysAgo(22), status: 'open', upvote_count: 9, resolve_confirmations: 1, photo_url: photo('streetlights-ringroad') },
  { title: 'Leaking water pipe flooding street', description: 'Constant leak has pooled water for weeks, mosquito breeding risk', category: 'Water', lat: 27.7100, lng: 85.3070, created_at: daysAgo(35), status: 'open', upvote_count: 14, resolve_confirmations: 1, photo_url: photo('leaking-pipe') },
  { title: 'Garbage not collected in over a month', description: 'Bins overflowing, spilling into the street', category: 'Sanitation', lat: 27.6850, lng: 85.3300, created_at: daysAgo(48), status: 'open', upvote_count: 6, resolve_confirmations: 0, photo_url: photo('garbage-overflow') },
  { title: 'Broken drain cover on footpath', description: 'Missing cover creates fall hazard for pedestrians', category: 'Roads', lat: 27.7150, lng: 85.2990, created_at: daysAgo(60), status: 'open', upvote_count: 11, resolve_confirmations: 2, photo_url: photo('broken-drain-cover') },
  { title: 'No lighting in pedestrian underpass', description: "Underpass near market has no working lights, unsafe at night", category: 'Public Safety', lat: 27.7040, lng: 85.3180, created_at: daysAgo(15), status: 'open', upvote_count: 12, resolve_confirmations: 0, photo_url: photo('dark-underpass') },
  { title: 'Unmarked construction pit left open', description: 'Open pit near school, no barricade or warning signs', category: 'Public Safety', lat: 27.6990, lng: 85.3120, created_at: daysAgo(5), status: 'open', upvote_count: 20, resolve_confirmations: 0, photo_url: photo('open-pit') },
  { title: 'Graffiti removed from community wall', description: 'Reported and cleaned up by city crew within days', category: 'Other', lat: 27.7060, lng: 85.3260, created_at: daysAgo(8), status: 'resolved', upvote_count: 4, resolve_confirmations: 3, photo_url: photo('graffiti-wall') },
  { title: 'Fallen tree cleared from sidewalk', description: 'Tree down after storm, city removed it quickly', category: 'Other', lat: 27.7205, lng: 85.3020, created_at: daysAgo(6), status: 'resolved', upvote_count: 7, resolve_confirmations: 3, photo_url: photo('fallen-tree') },
];

const insertIssue = db.prepare(`
  INSERT INTO issues (title, description, category, photo_url, lat, lng, created_at, status, upvote_count, resolve_confirmations)
  VALUES (@title, @description, @category, @photo_url, @lat, @lng, @created_at, @status, @upvote_count, @resolve_confirmations)
`);

const issueIds = issues.map(issue => insertIssue.run(issue).lastInsertRowid);

const insertComment = db.prepare(`
  INSERT INTO comments (issue_id, author_name, text, created_at, is_resolution_confirmation)
  VALUES (?, ?, ?, ?, ?)
`);

// comments keyed to issueIds[N] matching the issues array order above
insertComment.run(issueIds[0], 'Sabin', 'Almost hit this on my scooter yesterday', daysAgo(1), 0);
insertComment.run(issueIds[0], 'Nisha', 'City needs to fix this before monsoon', daysAgo(2), 0);
insertComment.run(issueIds[1], 'Rohan', 'Reported to the electricity board too, still nothing', daysAgo(1), 0);
insertComment.run(issueIds[2], 'Sabin', 'Confirmed, still dark as of this week', daysAgo(3), 1);
insertComment.run(issueIds[6], 'Nisha', 'This needs proper lighting installed soon', daysAgo(10), 0);
insertComment.run(issueIds[8], 'Nisha', 'Confirmed fixed, looks great now', daysAgo(2), 1);

console.log(`Seeded ${issueIds.length} issues with comments and photos.`);