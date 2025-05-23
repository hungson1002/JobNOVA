export const fetchMessages = async (orderId: string, token: string) => {
  const response = await fetch(`http://localhost:8800/api/messages?order_id=${orderId}`, {
    credentials: "include",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

export const fetchTickets = async (clerkId: string, token: string) => {
  const response = await fetch(`http://localhost:8800/api/messages/tickets?clerk_id=${clerkId}`, {
    credentials: "include",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

export const fetchDirectMessages = async (clerkId: string, receiverId: string, token: string) => {
  // Nếu không có receiverId, fetch tất cả direct messages của user
  const url = receiverId 
    ? `http://localhost:8800/api/messages/direct?clerk_id=${clerkId}&receiver_clerk_id=${receiverId}`
    : `http://localhost:8800/api/messages/direct?clerk_id=${clerkId}`;

  const response = await fetch(url, {
    credentials: "include",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

export const fetchUser = async (clerkId: string, token: string) => {
  const response = await fetch(`http://localhost:8800/api/users/${clerkId}`, {
    credentials: "include",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};