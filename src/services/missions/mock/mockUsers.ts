
// Mock users for testing
const mockUsers = [
  { id: "user1", name: "John Doe" },
  { id: "user2", name: "Jane Smith" },
  { id: "user3", name: "Robert Brown" },
];

// Helper function to get a mock user by ID
export const getMockUser = (id: string) => {
  return mockUsers.find(user => user.id === id) || { name: "Non assigné" };
};
