// Mock data for the academy when MongoDB is not available
export const mockEvents = [
  {
    _id: '1',
    title: 'Spring Belt Promotion',
    description: 'Our quarterly belt promotion ceremony for all levels. Come witness the progress of our dedicated students.',
    date: new Date('2024-04-15'),
    image: 'https://images.unsplash.com/photo-1552072092-7f9b8d63efcb?auto=format&fit=crop&q=80&w=2070',
    status: 'upcoming'
  },
  {
    _id: '2',
    title: 'Regional Tournament 2024',
    description: 'Elite Taekwondo Academy will be hosting the regional sparring and poomsae tournament. Open to all black belts.',
    date: new Date('2024-05-20'),
    image: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&q=80&w=2072',
    status: 'upcoming'
  },
  {
    _id: '3',
    title: 'Winter Seminar',
    description: 'A special 2-day seminar focusing on advanced self-defense techniques and mental discipline.',
    date: new Date('2024-01-10'),
    image: 'https://images.unsplash.com/photo-1517438322307-e67111335449?auto=format&fit=crop&q=80&w=2071',
    status: 'completed'
  }
];

export const mockGallery = [
  { _id: '1', image: 'https://images.unsplash.com/photo-1552072092-7f9b8d63efcb?auto=format&fit=crop&q=80&w=2070' },
  { _id: '2', image: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&q=80&w=2072' },
  { _id: '3', image: 'https://images.unsplash.com/photo-1517438322307-e67111335449?auto=format&fit=crop&q=80&w=2071' },
  { _id: '4', image: 'https://images.unsplash.com/photo-1552072805-2a9039d00e57?auto=format&fit=crop&q=80&w=2070' }
];

export const mockStudents = [
  {
    _id: '1',
    studentId: 'ETKD-2025-001',
    name: 'John Doe',
    dob: new Date('2025-05-15'),
    joiningDate: new Date('2025-01-10'),
    beltRank: 'Yellow',
    marks: 85,
    feesPending: 0,
    phone: '555-0101',
    email: 'john@example.com'
  },
  {
    _id: '2',
    studentId: 'ETKD-2024-002',
    name: 'Jane Smith',
    dob: new Date('2012-08-20'),
    joiningDate: new Date('2023-03-15'),
    beltRank: 'White',
    marks: 70,
    feesPending: 150,
    phone: '555-0102',
    email: 'jane@example.com'
  }
];
