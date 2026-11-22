// Fake data for the UI mockup. Shapes roughly follow the Mongoose models
// (User, Group with members[].role) so swapping in real API calls later is
// mostly a matter of replacing these objects with fetch() results.

window.MOCK = {
  currentUser: { _id: 'u1', name: 'Quoc Nguyen', email: 'quoc@example.com' },

  users: {
    u1: { _id: 'u1', name: 'Quoc Nguyen' },
    u2: { _id: 'u2', name: 'Jairo Santos' },
    u3: { _id: 'u3', name: 'William Wang' },
    u4: { _id: 'u4', name: 'Maya Chen' },
    u5: { _id: 'u5', name: 'Leo Park' },
  },

  groups: [
    {
      _id: 'g1',
      name: 'CPSC 449 Crew',
      description: 'End-of-semester celebration planning',
      inviteCode: '4F9A1C2B',
      members: [
        { user: 'u1', role: 'owner' },
        { user: 'u2', role: 'organizer' },
        { user: 'u3', role: 'member' },
      ],
      hangouts: [
        {
          _id: 'h1',
          title: 'Finals are over dinner',
          status: 'voting', // voting | finalized
          dateOptions: [
            { _id: 'd1', label: 'Fri, Dec 12 · 7:00 PM', votes: ['u1', 'u2'] },
            { _id: 'd2', label: 'Sat, Dec 13 · 6:30 PM', votes: ['u3'] },
          ],
          placeOptions: [
            { _id: 'p1', label: 'Tofu House, Fullerton', votes: ['u2'] },
            { _id: 'p2', label: 'Lucille’s BBQ, Brea', votes: ['u1', 'u3'] },
          ],
        },
        {
          _id: 'h2',
          title: 'Study session + boba',
          status: 'finalized',
          finalDate: 'Tue, Dec 2 · 4:00 PM',
          finalPlace: 'Pollak Library, Room 312',
          dateOptions: [],
          placeOptions: [],
        },
      ],
      tasks: [
        { _id: 't1', title: 'Drive (has 4 seats)', claimedBy: 'u2' },
        { _id: 't2', title: 'Make the reservation', claimedBy: null },
        { _id: 't3', title: 'Bring a birthday card for Will', claimedBy: null },
      ],
      expenses: [
        { _id: 'e1', description: 'Boba run', amount: 27.5, paidBy: 'u1', splitAmong: ['u1', 'u2', 'u3'] },
        { _id: 'e2', description: 'Parking', amount: 12, paidBy: 'u2', splitAmong: ['u1', 'u2', 'u3'] },
      ],
    },
    {
      _id: 'g2',
      name: 'Weekend Hikers',
      description: 'Trails around SoCal, roughly twice a month',
      inviteCode: '9B2E77D1',
      members: [
        { user: 'u4', role: 'owner' },
        { user: 'u1', role: 'member' },
        { user: 'u5', role: 'organizer' },
      ],
      hangouts: [
        {
          _id: 'h3',
          title: 'Sunrise hike',
          status: 'voting',
          dateOptions: [
            { _id: 'd3', label: 'Sun, Nov 9 · 6:00 AM', votes: ['u4'] },
            { _id: 'd4', label: 'Sun, Nov 16 · 6:00 AM', votes: ['u5'] },
          ],
          placeOptions: [
            { _id: 'p3', label: 'Mount Baldy', votes: ['u4', 'u5'] },
            { _id: 'p4', label: 'Santiago Oaks', votes: [] },
          ],
        },
      ],
      tasks: [{ _id: 't4', title: 'Bring snacks and water', claimedBy: null }],
      expenses: [],
    },
  ],
};
